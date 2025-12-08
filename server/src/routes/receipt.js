import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// Lấy danh sách sản phẩm
router.get('/products', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT MaSP, TenSP, DonGia, SoLuong
            FROM sanpham
            WHERE TinhTrang = 1
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách sản phẩm' });
    }
});

// Lấy danh sách phiếu nhập
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                pn.MaPN,
                ncc.TenNCC,
                sp.TenSP AS TenSPDisplay,
                tg.TenTG AS TacGiaDisplay,
                tl.TenTL AS TheLoaiDisplay,
                ct.SoLuong AS SoLuongDisplay,
                ct.DonGiaNhap AS DonGiaDisplay,
                SUM(ct.SoLuong * ct.DonGiaNhap) AS TongTien,
                pn.TinhTrang,
                'N/A' AS GhiChu
            FROM phieunhap pn
            JOIN nhacungcap ncc ON pn.MaNCC = ncc.MaNCC
            JOIN chitietphieunhap ct ON pn.MaPN = ct.MaPN
            JOIN sanpham sp ON ct.MaSP = sp.MaSP
            LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
            LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
            GROUP BY pn.MaPN, ncc.TenNCC, sp.TenSP, tg.TenTG, tl.TenTL, ct.SoLuong, ct.DonGiaNhap, pn.TinhTrang
            ORDER BY pn.NgayTao DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách phiếu nhập' });
    }
});
// Tìm kiếm phiếu nhập
router.get('/search', async (req, res) => {
    const { MaNCC, TenNCC, fromDate, toDate } = req.query;
    try {
        let query = `
            SELECT 
                pn.MaPN,
                ncc.TenNCC,
                sp.TenSP AS TenSPDisplay,
                tg.TenTG AS TacGiaDisplay,
                tl.TenTL AS TheLoaiDisplay,
                ct.SoLuong AS SoLuongDisplay,
                ct.DonGiaNhap AS DonGiaDisplay,
                SUM(ct.SoLuong * ct.DonGiaNhap) AS TongTien,
                pn.TinhTrang,
                pn.NgayTao,
                'N/A' AS GhiChu
            FROM phieunhap pn
            JOIN nhacungcap ncc ON pn.MaNCC = ncc.MaNCC
            JOIN chitietphieunhap ct ON pn.MaPN = ct.MaPN
            JOIN sanpham sp ON ct.MaSP = sp.MaSP
            LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
            LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
        `;
        const queryParams = [];
        const conditions = [];

        if (MaNCC) {
            conditions.push('pn.MaNCC = ?');
            queryParams.push(MaNCC);
        }
        if (TenNCC) {
            conditions.push('ncc.TenNCC LIKE ?');
            queryParams.push(`%${TenNCC}%`);
        }
        if (fromDate) {
            conditions.push('pn.NgayTao >= ?');
            queryParams.push(fromDate);
        }
        if (toDate) {
            conditions.push('pn.NgayTao <= ?');
            queryParams.push(toDate);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += `
            GROUP BY pn.MaPN, ncc.TenNCC, sp.TenSP, tg.TenTG, tl.TenTL, ct.SoLuong, ct.DonGiaNhap, pn.TinhTrang
            ORDER BY pn.NgayTao DESC
        `;

        const [rows] = await pool.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi tìm kiếm phiếu nhập' });
    }
});
// Tạo phiếu nhập mới
router.post('/', async (req, res) => {
    const { MaNCC, TenTK, items, TyLeLoi = 0 } = req.body;

    // === VALIDATION ===
    // Kiểm tra thông tin bắt buộc
    if (!MaNCC || !TenTK || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
            error: 'Thiếu thông tin bắt buộc',
            details: 'Cần có: MaNCC, TenTK, và ít nhất 1 sản phẩm'
        });
    }

    // Validate tỷ lệ lợi nhuận (0-100%)
    const tyLeLoi = parseFloat(TyLeLoi) || 0;
    if (tyLeLoi < 0 || tyLeLoi > 100) {
        return res.status(400).json({ 
            error: 'Tỷ lệ lợi nhuận không hợp lệ',
            details: 'Tỷ lệ lợi nhuận phải từ 0% đến 100%'
        });
    }

    // Validate từng item
    for (const item of items) {
        if (!item.MaSP || !item.SoLuong || item.SoLuong <= 0) {
            return res.status(400).json({ 
                error: 'Thông tin sản phẩm không hợp lệ',
                details: `Sản phẩm ${item.MaSP || 'không xác định'}: Số lượng phải > 0`
            });
        }
        if (!item.DonGiaNhap || item.DonGiaNhap <= 0) {
            return res.status(400).json({ 
                error: 'Giá nhập không hợp lệ',
                details: `Sản phẩm ${item.MaSP}: Giá nhập phải > 0`
            });
        }
    }

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Kiểm tra nhà cung cấp có hoạt động không
            const [nccRows] = await connection.query(
                'SELECT MaNCC, TenNCC, TinhTrang FROM nhacungcap WHERE MaNCC = ?',
                [MaNCC]
            );
            if (nccRows.length === 0) {
                throw new Error('Nhà cung cấp không tồn tại');
            }
            if (!nccRows[0].TinhTrang) {
                throw new Error(`Nhà cung cấp "${nccRows[0].TenNCC}" đã ngừng hoạt động`);
            }

            // Kiểm tra tất cả sản phẩm có tồn tại không và lấy thông tin tồn kho hiện tại
            const maSPList = items.map(item => item.MaSP);
            const [spRows] = await connection.query(
                'SELECT MaSP, TenSP, TinhTrang, SoLuong, DonGia FROM sanpham WHERE MaSP IN (?)',
                [maSPList]
            );
            
            // Tạo map để tra cứu nhanh thông tin sản phẩm
            const spMap = new Map();
            spRows.forEach(sp => spMap.set(sp.MaSP, sp));
            
            for (const item of items) {
                if (!spMap.has(item.MaSP)) {
                    throw new Error(`Sản phẩm với mã ${item.MaSP} không tồn tại`);
                }
            }

            // === TÍNH TOÁN ===
            // Tổng tiền nhập = Σ(DonGiaNhap × SoLuong)
            const TongTienNhap = items.reduce((total, item) => {
                return total + (parseFloat(item.DonGiaNhap) * parseInt(item.SoLuong));
            }, 0);

            // Tạo phiếu nhập
            const [result] = await connection.query(
                'INSERT INTO phieunhap (MaNCC, TenTK, NgayTao, TongTien, TinhTrang) VALUES (?, ?, NOW(), ?, 1)',
                [MaNCC, TenTK, TongTienNhap]
            );
            const MaPN = result.insertId;

            // Xử lý từng sản phẩm
            const itemsProcessed = [];
            for (const item of items) {
                const donGiaNhapMoi = parseFloat(item.DonGiaNhap);
                const soLuongNhapMoi = parseInt(item.SoLuong);
                // Tỷ lệ lợi nhuận có thể được set riêng cho từng sản phẩm, hoặc dùng chung
                const itemTyLeLoi = parseFloat(item.TyLeLoi) || tyLeLoi;
                
                // Lấy thông tin tồn kho hiện tại
                const spHienTai = spMap.get(item.MaSP);
                const soLuongCu = parseInt(spHienTai.SoLuong) || 0;
                const donGiaBanCu = parseFloat(spHienTai.DonGia) || 0;
                
                // === CÔNG THỨC TÍNH GIÁ BÁN BÌNH QUÂN GIA QUYỀN ===
                // Bước 1: Tính giá nhập cũ từ giá bán cũ (nếu có)
                // Giá nhập cũ = Giá bán cũ / (1 + TyLeLoi/100)
                // Nếu chưa có tồn kho hoặc giá bán = 0, coi như không có hàng cũ
                let donGiaNhapTrungBinh;
                
                if (soLuongCu > 0 && donGiaBanCu > 0) {
                    // Ước tính giá nhập cũ từ giá bán cũ (giả sử tỷ lệ lợi nhuận cũ cũng là itemTyLeLoi)
                    const donGiaNhapCu = donGiaBanCu / (1 + itemTyLeLoi / 100);
                    
                    // Tính giá nhập trung bình theo phương pháp bình quân gia quyền
                    // Giá nhập TB = (SL cũ × Giá nhập cũ + SL mới × Giá nhập mới) / (SL cũ + SL mới)
                    const tongGiaTriCu = soLuongCu * donGiaNhapCu;
                    const tongGiaTriMoi = soLuongNhapMoi * donGiaNhapMoi;
                    const tongSoLuong = soLuongCu + soLuongNhapMoi;
                    
                    donGiaNhapTrungBinh = (tongGiaTriCu + tongGiaTriMoi) / tongSoLuong;
                } else {
                    // Chưa có hàng tồn, giá nhập trung bình = giá nhập mới
                    donGiaNhapTrungBinh = donGiaNhapMoi;
                }
                
                // Bước 2: Tính giá bán mới = Giá nhập trung bình × (1 + Tỷ lệ lợi nhuận / 100)
                const donGiaBanMoi = Math.round(donGiaNhapTrungBinh * (1 + itemTyLeLoi / 100));

                // Lưu chi tiết phiếu nhập
                await connection.query(
                    'INSERT INTO chitietphieunhap (MaPN, MaSP, DonGiaNhap, SoLuong, TinhTrang) VALUES (?, ?, ?, ?, 1)',
                    [MaPN, item.MaSP, donGiaNhapMoi, soLuongNhapMoi]
                );

                // Cập nhật số lượng tồn kho và GIÁ BÁN BÌNH QUÂN
                await connection.query(
                    'UPDATE sanpham SET SoLuong = SoLuong + ?, DonGia = ? WHERE MaSP = ?',
                    [soLuongNhapMoi, donGiaBanMoi, item.MaSP]
                );

                itemsProcessed.push({
                    MaSP: item.MaSP,
                    SoLuongCu: soLuongCu,
                    DonGiaBanCu: donGiaBanCu,
                    DonGiaNhapMoi: donGiaNhapMoi,
                    SoLuongNhapMoi: soLuongNhapMoi,
                    DonGiaNhapTrungBinh: Math.round(donGiaNhapTrungBinh),
                    DonGiaBanMoi: donGiaBanMoi,
                    TyLeLoi: itemTyLeLoi,
                    ThanhTien: donGiaNhapMoi * soLuongNhapMoi
                });
            }

            await connection.commit();
            
            res.status(201).json({ 
                MaPN, 
                message: 'Tạo phiếu nhập thành công',
                TongTienNhap,
                TyLeLoi: tyLeLoi,
                items: itemsProcessed
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Lỗi khi tạo phiếu nhập:', error);
        res.status(500).json({ 
            error: 'Lỗi khi tạo phiếu nhập',
            details: error.message 
        });
    }
});

// Lấy chi tiết phiếu nhập
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [receipt] = await pool.query(`
            SELECT pn.*, ncc.TenNCC, ncc.SDT, ncc.DiaChi
            FROM phieunhap pn
            JOIN nhacungcap ncc ON pn.MaNCC = ncc.MaNCC
            WHERE pn.MaPN = ?
        `, [id]);

        if (receipt.length === 0) {
            return res.status(404).json({ error: 'Phiếu nhập không tồn tại' });
        }

        const [details] = await pool.query(`
            SELECT ct.*, sp.TenSP, tg.TenTG AS TacGia, tl.TenTL AS TheLoai
            FROM chitietphieunhap ct
            JOIN sanpham sp ON ct.MaSP = sp.MaSP
            LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
            LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
            WHERE ct.MaPN = ?
        `, [id]);

        res.json({
            ...receipt[0],
            items: details,
            TongTien: details.reduce((total, item) => total + (item.SoLuong * item.DonGiaNhap), 0)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi lấy chi tiết phiếu nhập' });
    }
});
// ...existing code...
// Route: lấy sản phẩm dưới mức tồn kho (public)
router.get('/low-stock', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const [rows] = await pool.query(
      `SELECT MaSP, TenSP, SoLuong, DonGia, COALESCE(MinSoLuong,0) AS MinSoLuong,
              (COALESCE(MinSoLuong,0) - COALESCE(SoLuong,0)) AS Needed
       FROM sanpham
       WHERE COALESCE(MinSoLuong,0) > 0
         AND COALESCE(SoLuong,0) < COALESCE(MinSoLuong,0)
       ORDER BY Needed DESC
       LIMIT ?`,
      [limit]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Lỗi khi lấy low-stock:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});
// ...existing code...
export default router;