import express from 'express';
import pool from '../config/connectDatabase.js';
import { authenticateToken } from '../utils/generateToken.js';

const router = express.Router();

// Hàm kiểm tra dữ liệu đánh giá
const validateRating = (data) => {
  const errors = [];
  if (!data.masp || isNaN(data.masp)) {
    errors.push('Mã sản phẩm (MaSP) không hợp lệ');
  }
  if (!data.sosao || isNaN(data.sosao) || data.sosao < 1 || data.sosao > 5) {
    errors.push('Số sao phải từ 1 đến 5');
  }
  if (data.nhanxet && typeof data.nhanxet !== 'string') {
    errors.push('Nhận xét phải là chuỗi ký tự');
  }
  if (data.nhanxet && data.nhanxet.length > 500) {
    errors.push('Nhận xét không được vượt quá 500 ký tự');
  }
  return errors;
};

// GET /api/ratings/:productId - Lấy danh sách đánh giá và trung bình sao
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId || isNaN(productId)) {
      console.error('Invalid productId:', productId);
      return res.status(400).json({ error: 'ID sản phẩm không hợp lệ' });
    }

    // Lấy danh sách đánh giá
    const [ratings] = await pool.query(
      `SELECT dg.MaDG, dg.SoSao, dg.NhanXet, dg.NgayDanhGia, kh.TenKH 
       FROM danhgia dg 
       JOIN khachhang kh ON dg.MaKH = kh.MaKH 
       WHERE dg.MaSP = ? 
       ORDER BY dg.NgayDanhGia DESC`,
      [parseInt(productId)]
    );

    // Tính trung bình sao
    const averageRating = ratings.length > 0 
      ? (ratings.reduce((sum, r) => sum + r.SoSao, 0) / ratings.length).toFixed(1)
      : 0;

    console.log(`Fetched ratings for MaSP ${productId}:`, { total: ratings.length, averageRating });

    res.status(200).json({
      ratings,
      averageRating: parseFloat(averageRating),
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Lỗi lấy đánh giá:', error.message);
    res.status(500).json({ error: 'Lỗi khi lấy đánh giá', details: error.message });
  }
});

// POST /api/ratings - Thêm hoặc cập nhật đánh giá
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { masp, sosao, nhanxet } = req.body;
    const makh = req.user.makh;

    // Kiểm tra dữ liệu
    const validationErrors = validateRating({ masp, sosao, nhanxet });
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ errors: validationErrors });
    }

    // Kiểm tra sản phẩm tồn tại
    const [product] = await pool.query('SELECT MaSP FROM sanpham WHERE MaSP = ?', [parseInt(masp)]);
    if (!product.length) {
      console.error('Product not found:', masp);
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    // Kiểm tra khách hàng tồn tại
    const [customer] = await pool.query('SELECT MaKH FROM khachhang WHERE MaKH = ?', [makh]);
    if (!customer.length) {
      console.error('Customer not found:', makh);
      return res.status(404).json({ error: 'Khách hàng không tồn tại' });
    }

    // Upsert đánh giá
    const [result] = await pool.query(
      `INSERT INTO danhgia (MaSP, MaKH, SoSao, NhanXet) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       SoSao = VALUES(SoSao), 
       NhanXet = VALUES(NhanXet), 
       NgayDanhGia = CURRENT_TIMESTAMP`,
      [parseInt(masp), makh, parseInt(sosao), nhanxet || null]
    );

    if (result.affectedRows === 0) {
      console.error('Failed to save rating:', { masp, makh });
      return res.status(500).json({ error: 'Không thể lưu đánh giá' });
    }

    const message = result.insertId ? 'Thêm đánh giá thành công' : 'Cập nhật đánh giá thành công';
    console.log(message, { MaSP: masp, MaKH: makh, SoSao: sosao });
    res.status(201).json({ message });
  } catch (error) {
    console.error('Lỗi thêm/cập nhật đánh giá:', error.message);
    res.status(500).json({ error: 'Lỗi khi thêm/cập nhật đánh giá', details: error.message });
  }
});

// PUT /api/ratings/:ratingId - Cập nhật đánh giá
router.put('/:ratingId', authenticateToken, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { sosao, nhanxet } = req.body;
    const makh = req.user.makh;

    // Kiểm tra dữ liệu
    const validationErrors = validateRating({ masp: 1, sosao, nhanxet }); // masp không cần thiết ở đây, chỉ để validate
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ errors: validationErrors });
    }

    // Kiểm tra quyền
    const [existing] = await pool.query(
      'SELECT MaDG, MaSP FROM danhgia WHERE MaDG = ? AND MaKH = ?',
      [parseInt(ratingId), makh]
    );
    if (!existing.length) {
      console.error('Unauthorized or rating not found:', { ratingId, makh });
      return res.status(403).json({ error: 'Không có quyền cập nhật hoặc đánh giá không tồn tại' });
    }

    // Cập nhật đánh giá
    const [result] = await pool.query(
      'UPDATE danhgia SET SoSao = ?, NhanXet = ?, NgayDanhGia = CURRENT_TIMESTAMP WHERE MaDG = ?',
      [parseInt(sosao), nhanxet || null, parseInt(ratingId)]
    );

    if (result.affectedRows === 0) {
      console.error('Failed to update rating:', ratingId);
      return res.status(500).json({ error: 'Không thể cập nhật đánh giá' });
    }

    console.log('Cập nhật đánh giá thành công:', { MaDG: ratingId, SoSao: sosao });
    res.status(200).json({ message: 'Cập nhật đánh giá thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật đánh giá:', error.message);
    res.status(500).json({ error: 'Lỗi khi cập nhật đánh giá', details: error.message });
  }
});

// DELETE /api/ratings/:ratingId - Xóa đánh giá
router.delete('/:ratingId', authenticateToken, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const makh = req.user.makh;

    // Kiểm tra quyền
    const [existing] = await pool.query(
      'SELECT MaDG FROM danhgia WHERE MaDG = ? AND MaKH = ?',
      [parseInt(ratingId), makh]
    );
    if (!existing.length) {
      console.error('Unauthorized or rating not found:', { ratingId, makh });
      return res.status(403).json({ error: 'Không có quyền xóa hoặc đánh giá không tồn tại' });
    }

    // Xóa đánh giá
    const [result] = await pool.query('DELETE FROM danhgia WHERE MaDG = ?', [parseInt(ratingId)]);

    if (result.affectedRows === 0) {
      console.error('Failed to delete rating:', ratingId);
      return res.status(500).json({ error: 'Không thể xóa đánh giá' });
    }

    console.log('Xóa đánh giá thành công:', { MaDG: ratingId });
    res.status(200).json({ message: 'Xóa đánh giá thành công' });
  } catch (error) {
    console.error('Lỗi xóa đánh giá:', error.message);
    res.status(500).json({ error: 'Lỗi khi xóa đánh giá', details: error.message });
  }
});

export default router;