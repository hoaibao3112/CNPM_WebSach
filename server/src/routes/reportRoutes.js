import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();
router.get('/overview', async (req, res) => {
  try {
    // Doanh thu
    const [[totalRevenue]] = await pool.query(
      `SELECT SUM(TongTien) as total 
       FROM hoadon 
       WHERE tinhtrang NOT IN ('Đã hủy', 'Chờ xử lý')`
    );

    // Tổng đơn hàng hợp lệ - Sửa MainD thành MaHD hoặc tên cột chính xác
    const [[validOrders]] = await pool.query(
      `SELECT COUNT(MaHD) as total 
       FROM hoadon 
       WHERE tinhtrang NOT IN ('Đã hủy')`
    );

    // Top sản phẩm
    const [topProducts] = await pool.query(
      `SELECT 
        sp.MaSP, 
        sp.TenSP, 
        SUM(ct.Soluong) as totalSold 
       FROM chitiethoadon ct
       JOIN sanpham sp ON ct.MaSP = sp.MaSP
       JOIN hoadon hd ON ct.MaHD = hd.MaHD
       WHERE hd.tinhtrang = 'Đã giao hàng' 
       GROUP BY sp.MaSP
       ORDER BY totalSold DESC
       LIMIT 5`
    );

    res.json({
      totalRevenue: totalRevenue.total || 0,
      totalOrders: validOrders.total,
      topProducts
    });
  } catch (error) {
    console.error('Lỗi thống kê tổng quan:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});
// API doanh thu theo tháng (Giữ nguyên do đã đúng)
router.get('/revenue-by-month', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT 
        YEAR(NgayTao) as year,
        MONTH(NgayTao) as month,
        SUM(TongTien) as revenue
       FROM hoadon
       WHERE tinhtrang = 'Đã giao hàng'
       GROUP BY YEAR(NgayTao), MONTH(NgayTao)
       ORDER BY year ASC, month ASC`
    );

    res.json(results);
  } catch (error) {
    console.error('Lỗi thống kê doanh thu:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// API thống kê trạng thái đơn hàng (Giữ nguyên do đã đúng)
router.get('/order-status', async (req, res) => {
  try {
    const [statusStats] = await pool.query(
      `SELECT 
        tinhtrang as status,
        COUNT(MaHD) as count 
       FROM hoadon
       GROUP BY tinhtrang`
    );

    res.json(statusStats);
  } catch (error) {
    console.error('Lỗi thống kê trạng thái đơn hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;