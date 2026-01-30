import pool from '../config/connectDatabase.js';

class ReceiptService {
    async getAllReceipts() {
        const [rows] = await pool.query(`
      SELECT 
          pn.MaPN, ncc.TenNCC, sp.TenSP AS TenSPDisplay,
          tg.TenTG AS TacGiaDisplay, tl.TenTL AS TheLoaiDisplay,
          ct.SoLuong AS SoLuongDisplay, ct.DonGiaNhap AS DonGiaDisplay,
          SUM(ct.SoLuong * ct.DonGiaNhap) AS TongTien,
          pn.TinhTrang, pn.NgayTao
      FROM phieunhap pn
      JOIN nhacungcap ncc ON pn.MaNCC = ncc.MaNCC
      JOIN chitietphieunhap ct ON pn.MaPN = ct.MaPN
      JOIN sanpham sp ON ct.MaSP = sp.MaSP
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      GROUP BY pn.MaPN, ncc.TenNCC, sp.TenSP, tg.TenTG, tl.TenTL, ct.SoLuong, ct.DonGiaNhap, pn.TinhTrang, pn.NgayTao
      ORDER BY pn.NgayTao DESC
    `);
        return rows;
    }

    async getReceiptById(id) {
        const [receipt] = await pool.query(`
      SELECT pn.*, ncc.TenNCC, ncc.SDT, ncc.DiaChi
      FROM phieunhap pn
      JOIN nhacungcap ncc ON pn.MaNCC = ncc.MaNCC
      WHERE pn.MaPN = ?
    `, [id]);

        if (receipt.length === 0) throw new Error('Phiếu nhập không tồn tại');

        const [details] = await pool.query(`
      SELECT ct.*, sp.TenSP, tg.TenTG AS TacGia, tl.TenTL AS TheLoai
      FROM chitietphieunhap ct
      JOIN sanpham sp ON ct.MaSP = sp.MaSP
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      WHERE ct.MaPN = ?
    `, [id]);

        return {
            ...receipt[0],
            items: details,
            TongTien: details.reduce((total, item) => total + (item.SoLuong * item.DonGiaNhap), 0)
        };
    }

    async createReceipt(data) {
        const { MaNCC, TenTK, items, TyLeLoi = 0 } = data;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Validate Supplier
            const [[ncc]] = await connection.query('SELECT * FROM nhacungcap WHERE MaNCC = ?', [MaNCC]);
            if (!ncc) throw new Error('Nhà cung cấp không tồn tại');
            if (!ncc.TinhTrang) throw new Error(`Nhà cung cấp "${ncc.TenNCC}" đã ngừng hoạt động`);

            // 2. Validate Products
            const maSPList = items.map(item => item.MaSP);
            const [spRows] = await connection.query('SELECT * FROM sanpham WHERE MaSP IN (?)', [maSPList]);
            const spMap = new Map(spRows.map(sp => [sp.MaSP, sp]));

            for (const item of items) {
                if (!spMap.has(item.MaSP)) throw new Error(`Sản phẩm ${item.MaSP} không tồn tại`);
            }

            // 3. Create Receipt Header
            const TongTienNhap = items.reduce((sum, item) => sum + (parseFloat(item.DonGiaNhap) * parseInt(item.SoLuong)), 0);
            const [result] = await connection.query(
                'INSERT INTO phieunhap (MaNCC, TenTK, NgayTao, TongTien, TinhTrang) VALUES (?, ?, NOW(), ?, 1)',
                [MaNCC, TenTK, TongTienNhap]
            );
            const MaPN = result.insertId;

            // 4. Process items and update stock/price
            for (const item of items) {
                const spHienTai = spMap.get(item.MaSP);
                const soLuongNhapMoi = parseInt(item.SoLuong);
                const donGiaNhapMoi = parseFloat(item.DonGiaNhap);
                const itemTyLeLoi = parseFloat(item.TyLeLoi) || TyLeLoi;

                // Formula: Weighted Average Cost
                let donGiaNhapTrungBinh = donGiaNhapMoi;
                if (spHienTai.SoLuong > 0 && spHienTai.DonGia > 0) {
                    const donGiaNhapCu = spHienTai.DonGia / (1 + itemTyLeLoi / 100);
                    donGiaNhapTrungBinh = (spHienTai.SoLuong * donGiaNhapCu + soLuongNhapMoi * donGiaNhapMoi) / (spHienTai.SoLuong + soLuongNhapMoi);
                }
                const donGiaBanMoi = Math.round(donGiaNhapTrungBinh * (1 + itemTyLeLoi / 100));

                await connection.query('INSERT INTO chitietphieunhap (MaPN, MaSP, DonGiaNhap, SoLuong, TinhTrang) VALUES (?, ?, ?, ?, 1)', [MaPN, item.MaSP, donGiaNhapMoi, soLuongNhapMoi]);
                await connection.query('UPDATE sanpham SET SoLuong = SoLuong + ?, DonGia = ? WHERE MaSP = ?', [soLuongNhapMoi, donGiaBanMoi, item.MaSP]);
            }

            await connection.commit();
            return MaPN;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async searchReceipts(filters) {
        let query = `
            SELECT 
                pn.MaPN, ncc.TenNCC, sp.TenSP AS TenSPDisplay,
                tg.TenTG AS TacGiaDisplay, tl.TenTL AS TheLoaiDisplay,
                ct.SoLuong AS SoLuongDisplay, ct.DonGiaNhap AS DonGiaDisplay,
                SUM(ct.SoLuong * ct.DonGiaNhap) AS TongTien,
                pn.TinhTrang, pn.NgayTao
            FROM phieunhap pn
            JOIN nhacungcap ncc ON pn.MaNCC = ncc.MaNCC
            JOIN chitietphieunhap ct ON pn.MaPN = ct.MaPN
            JOIN sanpham sp ON ct.MaSP = sp.MaSP
            LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
            LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
            WHERE 1=1
        `;
        const params = [];

        if (filters.MaNCC) {
            query += ' AND pn.MaNCC = ?';
            params.push(filters.MaNCC);
        }
        if (filters.TenNCC) {
            query += ' AND ncc.TenNCC LIKE ?';
            params.push(`%${filters.TenNCC}%`);
        }
        if (filters.fromDate) {
            query += ' AND pn.NgayTao >= ?';
            params.push(filters.fromDate);
        }
        if (filters.toDate) {
            query += ' AND pn.NgayTao <= ?';
            params.push(filters.toDate);
        }

        query += `
            GROUP BY pn.MaPN, ncc.TenNCC, sp.TenSP, tg.TenTG, tl.TenTL, ct.SoLuong, ct.DonGiaNhap, pn.TinhTrang, pn.NgayTao
            ORDER BY pn.NgayTao DESC
        `;

        const [rows] = await pool.query(query, params);
        return rows;
    }
}

export default new ReceiptService();
