// book.js
import express from 'express';
import pool from '../config/connectDatabase.js'; 

const router = express.Router();

// chỉ cần '/promotions'
router.get('/promotions', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      select distinct sp_km.MaKM,
        CONCAT(
          km.TenKM, ' • Mua ', ct_km.SoLuongToiThieu,
          ' – Giảm ', FORMAT(ct_km.GiaTriGiam, 0), '₫',
          ' (Đơn từ ', FORMAT(ct_km.GiaTriDonToiThieu, 0), '₫)'
        ) AS endpoint
      from sanpham as sp
      join sp_khuyen_mai as sp_km
      on sp.MaSP = sp_km.MaSP
      join ct_khuyen_mai as ct_km
      on sp_km.MaKM = ct_km.MaKM
      join khuyen_mai as km
      on ct_km.MaKM = km.MaKM
      where sp.TinhTrang = 1 and sp.SoLuong > 0 and km.TrangThai = 1 and km.NgayBatDau < Now() and km.NgayKetThuc > Now() and km.NgayTao < Now();
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Lấy danh sách sản phẩm theo khuyến mãi
router.get('/promotions/:promoId/products', async (req, res) => {
  const { promoId } = req.params;

  try {
    const [rows] = await pool.execute(`
      SELECT 
        sp.MaSP, 
        sp.TenSP, 
        sp.DonGia, 
        sp.HinhAnh,
        sp.SoLuong,
        sp.TinhTrang
      FROM sanpham AS sp
      JOIN sp_khuyen_mai AS sp_km ON sp.MaSP = sp_km.MaSP
      WHERE sp_km.MaKM = ? 
        AND sp.TinhTrang = 1 
        AND sp.SoLuong > 0
    `, [promoId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;