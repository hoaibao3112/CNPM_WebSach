import express from 'express';
import pool from '../config/connectDatabase.js';
import { authenticateToken } from '../utils/generateToken.js';

const router = express.Router();

// Simple admin permission check used for rating moderation
const checkAdminPermission = (req, res, next) => {
  if (!req.user) return res.status(403).json({ error: 'Không tìm thấy thông tin user trong token.' });
  const identifier = req.user.makh || req.user.MaTK || req.user.userId;
  const userType = req.user.userType;
  const allowedUsers = ['NV004', 'NV007', '4', '7', 4, 7];
  const allowedTypes = ['admin', 'staff'];
  if (allowedUsers.includes(identifier) || allowedTypes.includes(userType)) return next();
  return res.status(403).json({ error: 'Không có quyền truy cập.' });
};



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

// POST /api/ratings - Thêm đánh giá (mới) vào hàng chờ phê duyệt
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

    // Thêm vào bảng pending_danhgia (chờ duyệt)
    const [result] = await pool.query(
      `INSERT INTO pending_danhgia (MaSP, MaKH, SoSao, NhanXet) VALUES (?, ?, ?, ?)`,
      [parseInt(masp), makh, parseInt(sosao), nhanxet || null]
    );

    if (result.affectedRows === 0) {
      console.error('Failed to create pending rating:', { masp, makh });
      return res.status(500).json({ error: 'Không thể lưu đánh giá chờ duyệt' });
    }

    console.log('Pending rating created', { MaPDG: result.insertId, MaSP: masp, MaKH: makh });
    res.status(201).json({ message: 'Đã gửi đánh giá. Đánh giá sẽ hiển thị sau khi được quản trị viên duyệt.' });
  } catch (error) {
    console.error('Lỗi khi gửi đánh giá chờ duyệt:', error.message || error);
    res.status(500).json({ error: 'Lỗi khi gửi đánh giá', details: error.message || error });
  }
});

// ADMIN: Lấy danh sách đánh giá đang chờ duyệt
router.get('/pending/list', authenticateToken, checkAdminPermission, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT MaPDG, MaSP, MaKH, SoSao, NhanXet, NgayDanhGia FROM pending_danhgia ORDER BY NgayDanhGia DESC`);
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('Error fetching pending ratings:', err.message || err);
    res.status(500).json({ error: 'Lỗi khi lấy đánh giá chờ duyệt' });
  }
});

// ADMIN: Duyệt (approve) một đánh giá chờ duyệt, chuyển sang bảng danhgia
router.post('/pending/:id/approve', authenticateToken, checkAdminPermission, async (req, res) => {
  const { id } = req.params;
  try {
    // Lấy bản ghi pending
    const [pendingRows] = await pool.query('SELECT * FROM pending_danhgia WHERE MaPDG = ?', [parseInt(id)]);
    if (!pendingRows.length) return res.status(404).json({ error: 'Không tìm thấy đánh giá chờ duyệt' });
    const p = pendingRows[0];

    // Chuyển sang bảng danhgia (upsert để tránh duplicate)
    const [insertResult] = await pool.query(
      `INSERT INTO danhgia (MaSP, MaKH, SoSao, NhanXet, NgayDanhGia) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE SoSao = VALUES(SoSao), NhanXet = VALUES(NhanXet), NgayDanhGia = VALUES(NgayDanhGia)`,
      [p.MaSP, p.MaKH, p.SoSao, p.NhanXet, p.NgayDanhGia]
    );

    // Xóa bản ghi pending
    await pool.query('DELETE FROM pending_danhgia WHERE MaPDG = ?', [parseInt(id)]);

    res.status(200).json({ message: 'Đã duyệt đánh giá và hiển thị trên trang.' });
  } catch (err) {
    console.error('Error approving pending rating:', err.message || err);
    res.status(500).json({ error: 'Lỗi khi duyệt đánh giá', details: err.message || err });
  }
});

// ADMIN: Từ chối (xóa) một đánh giá chờ duyệt
router.delete('/pending/:id', authenticateToken, checkAdminPermission, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM pending_danhgia WHERE MaPDG = ?', [parseInt(id)]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy đánh giá chờ duyệt' });
    res.status(200).json({ message: 'Đã từ chối và xóa đánh giá chờ duyệt.' });
  } catch (err) {
    console.error('Error deleting pending rating:', err.message || err);
    res.status(500).json({ error: 'Lỗi khi xóa đánh giá chờ duyệt' });
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