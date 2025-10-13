import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// ======================= TAB 1: DOANH THU =======================

// Thống kê theo năm
router.get('/doanhthu/nam', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        YEAR(hd.NgayTao) AS Nam,
        COALESCE(SUM(CASE WHEN hd.tinhtrang NOT IN ('Đã hủy') THEN hd.TongTien * 0.7 END), 0) AS Von,
        COALESCE(SUM(CASE WHEN hd.tinhtrang NOT IN ('Đã hủy') THEN hd.TongTien END), 0) AS DoanhThu
      FROM hoadon hd
      GROUP BY YEAR(hd.NgayTao)
      ORDER BY Nam DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi thống kê doanh thu theo năm:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Thống kê từng tháng trong năm
router.get('/doanhthu/thang/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const [rows] = await pool.execute(`
      SELECT 
        MONTH(hd.NgayTao) AS Thang,
        COALESCE(SUM(CASE WHEN hd.tinhtrang NOT IN ('Đã hủy') THEN hd.TongTien * 0.7 END), 0) AS Von,
        COALESCE(SUM(CASE WHEN hd.tinhtrang NOT IN ('Đã hủy') THEN hd.TongTien END), 0) AS DoanhThu
      FROM hoadon hd
      WHERE YEAR(hd.NgayTao) = ?
      GROUP BY MONTH(hd.NgayTao)
      ORDER BY Thang ASC
    `, [year]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi thống kê doanh thu theo tháng:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Thống kê từng ngày trong tháng
router.get('/doanhthu/ngay/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const [rows] = await pool.execute(`
      SELECT 
        DAY(hd.NgayTao) AS Ngay,
        COALESCE(SUM(CASE WHEN hd.tinhtrang NOT IN ('Đã hủy') THEN hd.TongTien * 0.7 END), 0) AS Von,
        COALESCE(SUM(CASE WHEN hd.tinhtrang NOT IN ('Đã hủy') THEN hd.TongTien END), 0) AS DoanhThu
      FROM hoadon hd
      WHERE YEAR(hd.NgayTao) = ? AND MONTH(hd.NgayTao) = ?
      GROUP BY DAY(hd.NgayTao)
      ORDER BY Ngay ASC
    `, [year, month]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi thống kê doanh thu theo ngày:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Thống kê theo khoảng thời gian tùy chỉnh
router.post('/doanhthu/khoangtg', async (req, res) => {
  try {
    const { tuNgay, denNgay } = req.body;
    
    if (!tuNgay || !denNgay) {
      return res.status(400).json({ 
        success: false, 
        error: 'Vui lòng cung cấp tuNgay và denNgay' 
      });
    }

    const [rows] = await pool.execute(`
      SELECT 
        DATE(hd.NgayTao) AS Ngay,
        COALESCE(SUM(CASE WHEN hd.tinhtrang NOT IN ('Đã hủy') THEN hd.TongTien * 0.7 END), 0) AS Von,
        COALESCE(SUM(CASE WHEN hd.tinhtrang NOT IN ('Đã hủy') THEN hd.TongTien END), 0) AS DoanhThu
      FROM hoadon hd
      WHERE DATE(hd.NgayTao) BETWEEN ? AND ?
      GROUP BY DATE(hd.NgayTao)
      ORDER BY Ngay ASC
    `, [tuNgay, denNgay]);
    
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi thống kê doanh thu theo khoảng thời gian:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================= TAB 2: BÁN HÀNG =======================

// Thống kê bán hàng theo sản phẩm
router.post('/banhang/sanpham', async (req, res) => {
  try {
    const { tuNgay, denNgay, timePeriod } = req.body;
    
    let dateFilter = '';
    let params = [];
    
    if (timePeriod === 'today') {
      dateFilter = 'AND DATE(hd.NgayTao) = CURDATE()';
    } else if (tuNgay && denNgay) {
      dateFilter = 'AND DATE(hd.NgayTao) BETWEEN ? AND ?';
      params = [tuNgay, denNgay];
    }

    const [rows] = await pool.execute(`
      SELECT 
        sp.MaSP,
        sp.TenSP,
        sp.HinhAnh,
        SUM(ct.SoLuong) AS SoLuongBan,
        COUNT(DISTINCT hd.MaHD) AS SoLuongDon
      FROM chitiethoadon ct
      JOIN hoadon hd ON ct.MaHD = hd.MaHD
      JOIN sanpham sp ON ct.MaSP = sp.MaSP
      WHERE hd.tinhtrang NOT IN ('Đã hủy') ${dateFilter}
      GROUP BY sp.MaSP, sp.TenSP, sp.HinhAnh
      ORDER BY SoLuongBan DESC
      LIMIT 100
    `, params);
    
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi thống kê bán hàng theo sản phẩm:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Thống kê bán hàng theo thể loại
router.post('/banhang/theloai', async (req, res) => {
  try {
    const { tuNgay, denNgay, timePeriod } = req.body;
    
    let dateFilter = '';
    let params = [];
    
    if (timePeriod === 'today') {
      dateFilter = 'AND DATE(hd.NgayTao) = CURDATE()';
    } else if (tuNgay && denNgay) {
      dateFilter = 'AND DATE(hd.NgayTao) BETWEEN ? AND ?';
      params = [tuNgay, denNgay];
    }

    const [rows] = await pool.execute(`
      SELECT 
        tl.MaTL,
        tl.TenTL AS TheLoai,
        SUM(ct.SoLuong) AS TongSoLuong,
        COUNT(DISTINCT hd.MaHD) AS TongDon,
        COUNT(DISTINCT sp.MaSP) AS SoSanPham
      FROM chitiethoadon ct
      JOIN hoadon hd ON ct.MaHD = hd.MaHD
      JOIN sanpham sp ON ct.MaSP = sp.MaSP
      JOIN theloai tl ON sp.MaTL = tl.MaTL
      WHERE hd.tinhtrang NOT IN ('Đã hủy') ${dateFilter}
      GROUP BY tl.MaTL, tl.TenTL
      ORDER BY TongSoLuong DESC
    `, params);
    
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi thống kê bán hàng theo thể loại:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================= TAB 3: KHÁCH HÀNG =======================

// Thống kê khách hàng theo thời gian
router.post('/khachhang/khoangtg', async (req, res) => {
  try {
    const { tuNgay, denNgay, timePeriod } = req.body;
    
    let dateFilter = '';
    let params = [];
    
    if (timePeriod === 'today') {
      dateFilter = 'AND DATE(hd.NgayTao) = CURDATE()';
    } else if (tuNgay && denNgay) {
      dateFilter = 'AND DATE(hd.NgayTao) BETWEEN ? AND ?';
      params = [tuNgay, denNgay];
    }

    const [rows] = await pool.execute(`
      SELECT 
        DATE(hd.NgayTao) AS ThoiGian,
        COUNT(DISTINCT hd.makh) AS SoLuongKhachHang,
        COUNT(hd.MaHD) AS SoLuongDon,
        COUNT(DISTINCT sp.MaSP) AS SoLoaiSanPham
      FROM hoadon hd
      JOIN chitiethoadon ct ON hd.MaHD = ct.MaHD
      JOIN sanpham sp ON ct.MaSP = sp.MaSP
      WHERE hd.tinhtrang NOT IN ('Đã hủy') ${dateFilter}
      GROUP BY DATE(hd.NgayTao)
      ORDER BY ThoiGian ASC
    `, params);
    
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi thống kê khách hàng:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Keep existing APIs
router.get('/overview', async (req, res) => {
  try {
    const { timeRange, startDate, endDate } = req.query;
    
    let dateFilter = '';
    let params = [];
    
    if (timeRange && timeRange !== 'all') {
      const days = {
        '7d': 7,
        '30d': 30,
        '3m': 90,
        '6m': 180,
        '1y': 365
      };
      
      if (days[timeRange]) {
        dateFilter = 'AND hd.NgayTao >= DATE_SUB(NOW(), INTERVAL ? DAY)';
        params.push(days[timeRange]);
      }
    } else if (startDate && endDate) {
      dateFilter = 'AND hd.NgayTao BETWEEN ? AND ?';
      params = [startDate, endDate];
    }

    const [revenue] = await pool.query(`
      SELECT COALESCE(SUM(TongTien), 0) as totalRevenue
      FROM hoadon 
      WHERE tinhtrang NOT IN ('Đã hủy') ${dateFilter}
    `, params);

    const [orders] = await pool.query(`
      SELECT COUNT(*) as totalOrders
      FROM hoadon 
      WHERE 1=1 ${dateFilter}
    `, params);

    const [customers] = await pool.query(`
      SELECT COUNT(DISTINCT makh) as totalCustomers
      FROM hoadon 
      WHERE 1=1 ${dateFilter}
    `, params);

    const [topProducts] = await pool.query(`
      SELECT 
        sp.TenSP,
        SUM(ct.SoLuong) as totalSold,
        SUM(ct.SoLuong * ct.DonGia) as totalRevenue
      FROM chitiethoadon ct
      JOIN sanpham sp ON ct.MaSP = sp.MaSP
      JOIN hoadon hd ON ct.MaHD = hd.MaHD
      WHERE hd.tinhtrang NOT IN ('Đã hủy') ${dateFilter}
      GROUP BY sp.MaSP, sp.TenSP
      ORDER BY totalSold DESC
      LIMIT 10
    `, params);

    res.json({
      success: true,
      totalRevenue: revenue[0].totalRevenue,
      totalOrders: orders[0].totalOrders,
      totalCustomers: customers[0].totalCustomers,
      topProducts: topProducts
    });

  } catch (error) {
    console.error('Overview API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi lấy tổng quan', 
      details: error.message 
    });
  }
});

export default router;