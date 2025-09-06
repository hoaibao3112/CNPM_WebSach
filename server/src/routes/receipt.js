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

// Tạo phiếu nhập mới
router.post('/', async (req, res) => {
    const { MaNCC, TenTK, items } = req.body;

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const TongTien = items.reduce((total, item) => total + (item.DonGiaNhap * item.SoLuong), 0);

            const [result] = await connection.query(
                'INSERT INTO phieunhap (MaNCC, TenTK, NgayTao, TongTien, TinhTrang) VALUES (?, ?, NOW(), ?, 1)',
                [MaNCC, TenTK, TongTien]
            );
            const MaPN = result.insertId;

            for (const item of items) {
                await connection.query(
                    'INSERT INTO chitietphieunhap (MaPN, MaSP, DonGiaNhap, SoLuong, TinhTrang) VALUES (?, ?, ?, ?, 1)',
                    [MaPN, item.MaSP, item.DonGiaNhap, item.SoLuong]
                );

                await connection.query(
                    'UPDATE sanpham SET SoLuong = SoLuong + ?, DonGia = ? WHERE MaSP = ?',
                    [item.SoLuong, item.DonGiaNhap, item.MaSP]
                );
            }

            await connection.commit();
            res.status(201).json({ MaPN, message: 'Tạo phiếu nhập thành công' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi tạo phiếu nhập' });
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

export default router;