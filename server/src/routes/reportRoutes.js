import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

/**
 * 1. Tổng quan hệ thống (doanh thu, đơn hàng, top sản phẩm)
 */
router.get('/overview', async (req, res) => {
  try {
    // Tổng doanh thu (chỉ tính đơn đã giao hàng)
    const [[totalRevenue]] = await pool.query(
      `SELECT SUM(TongTien) as total 
       FROM hoadon 
       WHERE tinhtrang = 'Đã giao hàng'`
    );

    // Tổng đơn hàng hợp lệ (không tính đã hủy)
    const [[totalOrders]] = await pool.query(
      `SELECT COUNT(MaHD) as total 
       FROM hoadon 
       WHERE tinhtrang != 'Đã hủy'`
    );

    // Top 5 sản phẩm bán chạy
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
      totalOrders: totalOrders.total,
      topProducts
    });
  } catch (error) {
    console.error('Lỗi thống kê tổng quan:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

/**
 * 2. Doanh thu theo tháng/năm
 */
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

/**
 * 3. Thống kê trạng thái đơn hàng
 */
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

// /**
//  * 4. Thống kê khách hàng mới theo tháng
//  */
// router.get('/new-customers-by-month', async (req, res) => {
//   try {
//     const [results] = await pool.query(
//       `SELECT 
//         YEAR(NgayTao) as year,
//         MONTH(NgayTao) as month,
//         COUNT(makh) as newCustomers
//        FROM khachhang
//        GROUP BY YEAR(NgayTao), MONTH(NgayTao)
//        ORDER BY year ASC, month ASC`
//     );
//     res.json(results);
//   } catch (error) {
//     console.error('Lỗi thống kê khách hàng mới:', error);
//     res.status(500).json({ error: 'Lỗi server' });
//   }
// });

/**
 * 5. Thống kê sản phẩm tồn kho
 */
router.get('/product-inventory', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT MaSP, TenSP, SoLuong FROM sanpham ORDER BY SoLuong ASC`
    );
    res.json(results);
  } catch (error) {
    console.error('Lỗi thống kê tồn kho:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

/**
 * 6. Thống kê doanh thu theo sản phẩm
 */
router.get('/revenue-by-product', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT 
        sp.MaSP, 
        sp.TenSP, 
        SUM(ct.Soluong * ct.DonGia) as revenue
       FROM chitiethoadon ct
       JOIN sanpham sp ON ct.MaSP = sp.MaSP
       JOIN hoadon hd ON ct.MaHD = hd.MaHD
       WHERE hd.tinhtrang = 'Đã giao hàng'
       GROUP BY sp.MaSP
       ORDER BY revenue DESC`
    );
    res.json(results);
  } catch (error) {
    console.error('Lỗi thống kê doanh thu theo sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;