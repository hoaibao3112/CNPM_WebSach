// cartRoutes.js
import express from 'express';
import pool from '../config/connectDatabase.js';
import jwt from 'jsonwebtoken';  // Để authenticate

const router = express.Router();

// Middleware authenticate (tái sử dụng từ client.js)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Không có token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token không hợp lệ' });
  }
};

// GET /api/cart: Lấy giỏ hàng của user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [cartItems] = await pool.query(`
      SELECT 
        gh.MaSP AS id,
        sp.TenSP AS name,
        sp.DonGia AS price,
        sp.HinhAnh AS image,
        gh.SoLuong AS quantity
      FROM giohang_chitiet gh
      JOIN sanpham sp ON gh.MaSP = sp.MaSP
      WHERE gh.MaKH = ?
    `, [req.user.userId]);  // req.user.userId từ token (makh)

    res.json(cartItems);
  } catch (error) {
    console.error('Lỗi lấy giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/cart/add: Thêm item vào giỏ
router.post('/add', authenticateToken, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId || quantity < 1) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });

  try {
    // Kiểm tra sản phẩm tồn tại và còn hàng
    const [[product]] = await pool.query('SELECT SoLuong FROM sanpham WHERE MaSP = ?', [productId]);
    if (!product || product.SoLuong < quantity) return res.status(400).json({ error: 'Sản phẩm không tồn tại hoặc hết hàng' });

    // Thêm hoặc update nếu đã tồn tại
    await pool.query(`
      INSERT INTO giohang_chitiet (MaKH, MaSP, SoLuong) 
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE SoLuong = SoLuong + VALUES(SoLuong)
    `, [req.user.userId, productId, quantity]);

    res.json({ success: true, message: 'Thêm vào giỏ hàng thành công' });
  } catch (error) {
    console.error('Lỗi thêm item:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/cart/update: Cập nhật quantity
router.put('/update', authenticateToken, async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || quantity < 1) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });

  try {
    const [result] = await pool.query(`
      UPDATE giohang_chitiet SET SoLuong = ? 
      WHERE MaKH = ? AND MaSP = ?
    `, [quantity, req.user.userId, productId]);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item không tồn tại trong giỏ' });

    res.json({ success: true, message: 'Cập nhật giỏ hàng thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật item:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/cart/remove: Xóa item
router.delete('/remove', authenticateToken, async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });

  try {
    const [result] = await pool.query('DELETE FROM giohang_chitiet WHERE MaKH = ? AND MaSP = ?', [req.user.userId, productId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item không tồn tại' });

    res.json({ success: true, message: 'Xóa item thành công' });
  } catch (error) {
    console.error('Lỗi xóa item:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/cart/clear: Xóa toàn bộ giỏ
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM giohang_chitiet WHERE MaKH = ?', [req.user.userId]);
    res.json({ success: true, message: 'Xóa giỏ hàng thành công' });
  } catch (error) {
    console.error('Lỗi xóa giỏ:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;