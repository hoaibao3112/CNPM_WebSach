import express from 'express';
import pool from '../config/connectDatabase.js';
import { authenticateToken } from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Helper: check order existence, ownership and completed state
async function checkOrderOwnershipAndCompleted(orderId, customerId) {
  const [rows] = await pool.query('SELECT MaHD, makh, tinhtrang, TrangThaiThanhToan FROM hoadon WHERE MaHD = ?', [parseInt(orderId)]);
  if (!rows || rows.length === 0) return { exists: false };
  const order = rows[0];
  const status = String(order.tinhtrang || order.TrangThai || order.TrangThaiThanhToan || '').toLowerCase();
  const completedKeywords = ['đã giao hàng','đã giao','giao hàng','da giao','da giao hang','hoàn thành','hoan thanh','delivered','completed'];
  const completed = completedKeywords.some(k => status.includes(k));
  const owner = String(order.makh) === String(customerId);
  return { exists: true, completed, owner, order };
}

//lay the loai dươc mua nhiều nhất từ hóa đơn

router.get("/order-count", async(req, res) => {
  try {
    const sql = `SELECT tl.matl ,tl.TenTL, COUNT(sp.MaSP) AS tong_sanpham
                  FROM chitiethoadon ct
                  JOIN sanpham sp ON ct.MaSP = sp.MaSP
                  JOIN theloai tl ON sp.MaTL = tl.MaTL
                  GROUP BY tl.TenTL, tl.matl
                  ORDER BY tong_sanpham DESC
                  LIMIT 3;
                `
    const [result] = await pool.query(sql);
    return res.status(200).json({success: true, data: result})
  } catch (error) {
    console.log(error);
    return res.status(500).json({error:"lỗi server" })
  }
})

// GET /api/orderreview/:orderId - return review for that order. Token is optional;
// - If token present and userType is admin/staff, return any review for the order
// - If token present for a customer, return only their review
// - If no token present, return public review for the order (if any)
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    // Try to optionally verify token if present in cookie or Authorization header
    const token = req.cookies?.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    let optionalUser = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
        optionalUser = decoded;
        console.log('Optional token verified for orderreview GET:', { user: optionalUser });
      } catch (e) {
        console.warn('Optional token invalid or expired for orderreview GET:', e.message);
        // proceed without user
      }
    }

    if (!orderId || isNaN(orderId)) return res.status(400).json({ error: 'Invalid orderId' });

    // If requester is admin/staff, allow fetching review for the order regardless of owner
    if (optionalUser && (optionalUser.userType === 'admin' || optionalUser.userType === 'staff' || optionalUser.userType === 'superadmin')) {
      console.log('Admin/staff fetch by user:', optionalUser);
      const [rows] = await pool.query(
        `SELECT d.*, kh.tenkh AS customerName
         FROM danhgia_donhang d
         LEFT JOIN khachhang kh ON d.MaKH = kh.makh
         WHERE d.MaHD = ?`,
        [parseInt(orderId)]
      );
      return res.status(200).json({ review: rows[0] || null });
    }

    // If authenticated customer, return only their review
    if (optionalUser && (optionalUser.makh || optionalUser.id || optionalUser.MaKH)) {
      const customerId = optionalUser.makh || optionalUser.id || optionalUser.MaKH;
      const [rows] = await pool.query('SELECT * FROM danhgia_donhang WHERE MaHD = ? AND MaKH = ?', [parseInt(orderId), customerId]);
      return res.status(200).json({ review: rows[0] || null });
    }

    // No token: public fetch — return any review for the order (useful for admin staff who can't send token)
    const [rows] = await pool.query(
      `SELECT d.MaDGHD AS MaDGHD, d.MaHD, d.MaKH, d.SoSao, d.NhanXet, d.NgayDanhGia, kh.tenkh AS customerName
       FROM danhgia_donhang d
       LEFT JOIN khachhang kh ON d.MaKH = kh.makh
       WHERE d.MaHD = ?`,
      [parseInt(orderId)]
    );
    return res.status(200).json({ review: rows[0] || null });
  } catch (err) {
    console.error('GET /api/orderreview/:orderId error', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// POST /api/orderreview/:orderId - create or update a review (only owner, only when order completed)
router.post('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('POST /api/orderreview/:orderId called', { orderId, user: req.user && req.user.makh, body: req.body });
    const customerId = req.user && (req.user.makh || req.user.id || req.user.MaKH);
    const { rating, comment } = req.body;

    if (!orderId || isNaN(orderId)) return res.status(400).json({ error: 'Invalid orderId' });
    const r = parseInt(rating);
    if (!r || r < 1 || r > 5) return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });

    const check = await checkOrderOwnershipAndCompleted(orderId, customerId);
    if (!check.exists) return res.status(404).json({ error: 'Order not found' });
    if (!check.owner) return res.status(403).json({ error: 'Không có quyền đánh giá đơn hàng này' });
    if (!check.completed) return res.status(400).json({ error: 'Chỉ được đánh giá khi đơn hàng đã hoàn thành' });

    // Upsert using unique key (MaHD,MaKH)
    const sql = `INSERT INTO danhgia_donhang (MaHD, MaKH, SoSao, NhanXet)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE SoSao = VALUES(SoSao), NhanXet = VALUES(NhanXet), NgayDanhGia = CURRENT_TIMESTAMP`;

    const [result] = await pool.query(sql, [parseInt(orderId), customerId, r, comment || null]);

    // result.affectedRows: insert -> 1 or 2? For ON DUPLICATE, affectedRows can be 1 (insert) or 2 (update)
    if (!result) return res.status(500).json({ error: 'Không thể lưu đánh giá' });

    const message = result.affectedRows && result.affectedRows > 1 ? 'Cập nhật đánh giá thành công' : 'Đã lưu đánh giá';
    return res.status(200).json({ message });
  } catch (err) {
    console.error('POST /api/orderreview/:orderId error', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});



export default router;
