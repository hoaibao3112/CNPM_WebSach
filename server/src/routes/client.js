import express from 'express';
import pool from '../config/connectDatabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateOTP, sendOTPEmail } from '../utils/emailService.js';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import crypto from 'crypto';

const router = express.Router();

// Tạo token đặt lại mật khẩu
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Middleware xác thực token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Không có token, truy cập bị từ chối' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded); // Debug payload token
    req.user = decoded;
    if (!decoded.makh) {
      return res.status(403).json({ error: 'Token không chứa makh' });
    }
    next();
  } catch (error) {
    console.error('Lỗi xác minh token:', error);
    res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Hàm kiểm tra dữ liệu khách hàng
const validateCustomer = (customerData, isUpdate = false, requirePassword = false) => {
  const errors = [];

  if (!isUpdate || customerData.tenkh !== undefined) {
    if (!customerData.tenkh?.trim()) {
      errors.push('Tên khách hàng là bắt buộc');
    } else if (customerData.tenkh.trim().length > 100) {
      errors.push('Tên khách hàng không được vượt quá 100 ký tự');
    }
  }

  if (customerData.email !== undefined && customerData.email !== null && customerData.email !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      errors.push('Email không hợp lệ');
    } else if (customerData.email.length > 100) {
      errors.push('Email không được vượt quá 100 ký tự');
    }
  }

  if (requirePassword && (!isUpdate || customerData.matkhau !== undefined)) {
    if (!customerData.matkhau || customerData.matkhau.trim() === '') {
      errors.push('Mật khẩu là bắt buộc');
    } else if (customerData.matkhau.length > 100) {
      errors.push('Mật khẩu không được vượt quá 100 ký tự');
    }
  }

  if (customerData.sdt && !/^\d{10,11}$/.test(customerData.sdt)) {
    errors.push('Số điện thoại không hợp lệ (phải có 10-11 số)');
  }

  if (customerData.diachi && customerData.diachi.length > 255) {
    errors.push('Địa chỉ không được vượt quá 255 ký tự');
  }

  console.log('Kết quả kiểm tra:', errors); // Debug
  return errors;
};

// POST /register/send-otp - Gửi OTP đăng ký
router.post('/register/send-otp', async (req, res) => {
  try {
    const { tenkh, email } = req.body;
    console.log('Nhận yêu cầu OTP đăng ký:', { tenkh, email });

    const validationErrors = validateCustomer({ tenkh, email }, false, false);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const [[existingUser]] = await pool.query('SELECT * FROM khachhang WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    const [recentRequests] = await pool.query(
      'SELECT COUNT(*) as count FROM otp_requests WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)',
      [email]
    );
    if (recentRequests[0].count >= 3) {
      return res.status(429).json({ error: 'Quá nhiều yêu cầu OTP. Vui lòng thử lại sau 5 phút.' });
    }

    const otp = generateOTP();
    const otpToken = generateResetToken();

    await pool.query(
      'INSERT INTO otp_requests (email, otp, token, created_at, type) VALUES (?, ?, ?, NOW(), ?) ON DUPLICATE KEY UPDATE otp = VALUES(otp), token = VALUES(token), created_at = VALUES(created_at)',
      [email, otp, otpToken, 'register']
    );

    await sendOTPEmail(email, otp, tenkh);

    res.status(200).json({ message: 'OTP đã được gửi đến email của bạn', token: otpToken });
  } catch (error) {
    console.error('Lỗi gửi OTP đăng ký:', error);
    res.status(500).json({ error: 'Lỗi khi gửi OTP' });
  }
});

// POST /register/verify-otp - Xác thực OTP đăng ký
router.post('/register/verify-otp', async (req, res) => {
  try {
    const { email, otp, token } = req.body;
    console.log('Xác thực OTP đăng ký:', { email, otp, token });

    if (!email || !otp || !token) {
      return res.status(400).json({ error: 'Thiếu thông tin OTP' });
    }

    const [[otpRecord]] = await pool.query(
      'SELECT * FROM otp_requests WHERE email = ? AND token = ? AND otp = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE) AND type = ?',
      [email, token, otp, 'register']
    );

    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    await pool.query('DELETE FROM otp_requests WHERE email = ? AND token = ?', [email, token]);

    res.status(200).json({ message: 'OTP xác thực thành công', verified: true });
  } catch (error) {
    console.error('Lỗi xác thực OTP đăng ký:', error);
    res.status(500).json({ error: 'Lỗi khi xác thực OTP' });
  }
});

// POST /register/set-password - Đặt mật khẩu sau khi xác thực OTP
router.post('/register/set-password', async (req, res) => {
  try {
    const { email, tenkh, matkhau, sdt, diachi } = req.body;
    console.log('Đặt mật khẩu:', { email, tenkh });

    const validationErrors = validateCustomer({ tenkh, email, matkhau, sdt, diachi }, false, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const hashedPassword = await bcrypt.hash(matkhau, 10);

    const [result] = await pool.query(
      'INSERT INTO khachhang (tenkh, email, matkhau, sdt, diachi) VALUES (?, ?, ?, ?, ?)',
      [tenkh, email, hashedPassword, sdt || null, diachi || null]
    );

    const makh = result.insertId;
    const accessToken = generateToken(makh, 'customer');
    const refreshToken = generateRefreshToken(makh, 'customer');

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: { makh, tenkh, email },
      token: accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Lỗi đặt mật khẩu:', error);
    res.status(500).json({ error: 'Lỗi khi đăng ký tài khoản' });
  }
});

// POST /login - Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { email, matkhau } = req.body;
    console.log('Yêu cầu đăng nhập:', { email });

    if (!email || !matkhau) {
      return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });
    }

    const [[user]] = await pool.query(
      'SELECT makh, tenkh, email, matkhau FROM khachhang WHERE email = ?',
      [email]
    );

    if (!user || !(await bcrypt.compare(matkhau, user.matkhau))) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const accessToken = generateToken(user.makh, 'customer');
    const refreshToken = generateRefreshToken(user.makh, 'customer');

    res.status(200).json({
      message: 'Đăng nhập thành công',
      user: { makh: user.makh, tenkh: user.tenkh, email: user.email },
      token: accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ error: 'Lỗi khi đăng nhập' });
  }
});

router.post('/forgot-password/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Gửi OTP quên mật khẩu:', { email });

    const [[user]] = await pool.query('SELECT makh, tenkh FROM khachhang WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: 'Email không tồn tại' });
    }

    const [recentRequests] = await pool.query(
      'SELECT COUNT(*) as count FROM otp_requests WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)',
      [email]
    );
    if (recentRequests[0].count >= 3) {
      return res.status(429).json({ error: 'Quá nhiều yêu cầu OTP. Vui lòng thử lại sau 5 phút.' });
    }

    const otp = generateOTP();
    const token = generateResetToken();

    await pool.query(
      'INSERT INTO otp_requests (email, otp, token, created_at, type) VALUES (?, ?, ?, NOW(), ?) ON DUPLICATE KEY UPDATE otp = VALUES(otp), token = VALUES(token), created_at = VALUES(created_at)',
      [email, otp, token, 'forgot-password']
    );

    await sendOTPEmail(email, otp, user.tenkh, true);

    res.status(200).json({ message: 'OTP đã được gửi đến email của bạn', token });
  } catch (error) {
    console.error('Lỗi gửi OTP quên mật khẩu:', error);
    res.status(500).json({ error: 'Lỗi khi gửi OTP' });
  }
});

  
router.post('/forgot-password/verify-otp', async (req, res) => {
  try {
    const { email, otp, token } = req.body;
    console.log('Xác thực OTP quên mật khẩu:', { email, otp, token }); // Xác nhận log này
    if (!email || !otp || !token) {
      return res.status(400).json({ error: 'Thiếu thông tin OTP hoặc token' });
    }
    const [[otpRecord]] = await pool.query(
      'SELECT * FROM otp_requests WHERE email = ? AND otp = ? AND token = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE) AND type = ?',
      [email, otp, token, 'forgot-password']
    );
    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP, token không hợp lệ hoặc đã hết hạn' });
    }
    const resetToken = generateResetToken();
    await pool.query(
      'UPDATE khachhang SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?',
      [resetToken, email]
    );
    await pool.query('DELETE FROM otp_requests WHERE email = ? AND otp = ? AND token = ?', [email, otp, token]);
    res.status(200).json({ message: 'OTP xác thực thành công', resetToken });
  } catch (error) {
    console.error('Lỗi xác thực OTP quên mật khẩu:', error);
    res.status(500).json({ error: 'Lỗi khi xác thực OTP' });
  }
});

// POST /forgot-password/reset - Đặt lại mật khẩu
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, matkhau, resetToken } = req.body;
    console.log('Đặt lại mật khẩu:', { email, resetToken });

    if (!email || !matkhau || !resetToken) {
      return res.status(400).json({ error: 'Thiếu thông tin' });
    }

    const [[user]] = await pool.query(
      'SELECT makh FROM khachhang WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()',
      [email, resetToken]
    );

    if (!user) {
      return res.status(400).json({ error: 'Reset token không hợp lệ hoặc đã hết hạn' });
    }

    const hashedPassword = await bcrypt.hash(matkhau, 10);

    await pool.query(
      'UPDATE khachhang SET matkhau = ?, reset_token = NULL, reset_token_expires = NULL WHERE makh = ?',
      [hashedPassword, user.makh]
    );

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    res.status(500).json({ error: 'Lỗi khi đặt lại mật khẩu' });
  }
});

// GET /profile - Lấy thông tin profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Lấy profile cho makh:', req.user.makh);
    const [[user]] = await pool.query(
      'SELECT makh, tenkh, email, sdt, diachi FROM khachhang WHERE makh = ?',
      [req.user.makh]
    );

    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Lỗi lấy profile:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin profile' });
  }
});

// PUT /profile - Cập nhật profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { tenkh, sdt, diachi } = req.body;
    console.log('Cập nhật profile:', { makh: req.user.makh, tenkh, sdt, diachi });

    const validationErrors = validateCustomer({ tenkh, sdt, diachi }, true, false);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const [result] = await pool.query(
      'UPDATE khachhang SET tenkh = ?, sdt = ?, diachi = ? WHERE makh = ?',
      [tenkh, sdt || null, diachi || null, req.user.makh]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    res.status(200).json({ message: 'Cập nhật profile thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật profile' });
  }
});

// PUT /profile/change-password - Đổi mật khẩu
router.put('/profile/change-password', authenticateToken, async (req, res) => {
  try {
    const { matkhau_cu, matkhau_moi } = req.body;
    console.log('Đổi mật khẩu cho makh:', req.user.makh);

    if (!matkhau_cu || !matkhau_moi) {
      return res.status(400).json({ error: 'Thiếu mật khẩu cũ hoặc mới' });
    }

    const [[user]] = await pool.query(
      'SELECT matkhau FROM khachhang WHERE makh = ?',
      [req.user.makh]
    );

    if (!user || !(await bcrypt.compare(matkhau_cu, user.matkhau))) {
      return res.status(400).json({ error: 'Mật khẩu cũ không đúng' });
    }

    const hashedNewPassword = await bcrypt.hash(matkhau_moi, 10);

    await pool.query(
      'UPDATE khachhang SET matkhau = ? WHERE makh = ?',
      [hashedNewPassword, req.user.makh]
    );

    res.status(200).json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    res.status(500).json({ error: 'Lỗi khi đổi mật khẩu' });
  }
});

// GET /cart - Lấy danh sách giỏ hàng
// Trong file client.js, cập nhật endpoint GET /cart
router.get('/cart', authenticateToken, async (req, res) => {
  try {
    console.log('Lấy giỏ hàng cho makh:', req.user.makh);
    if (!req.user.makh) {
      return res.status(400).json({ error: 'Không tìm thấy mã khách hàng' });
    }

    const [cartItems] = await pool.query(
      `SELECT g.MaSP, g.SoLuong AS quantity, g.Selected,
              s.TenSP AS name, s.DonGia AS price, s.HinhAnh AS image, s.SoLuong AS stock
       FROM giohang g
       JOIN sanpham s ON g.MaSP = s.MaSP
       WHERE g.MaKH = ?`,
      [req.user.makh]
    );

    res.status(200).json(cartItems);
  } catch (error) {
    console.error('Lỗi lấy giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi khi lấy giỏ hàng', details: error.message });
  }
});

// POST /cart/add - Thêm sản phẩm vào giỏ hàng
router.post('/cart/add', authenticateToken, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  console.log('Thêm vào giỏ hàng:', { makh: req.user.makh, productId, quantity });

  try {
    if (!req.user.makh) {
      return res.status(400).json({ error: 'Không tìm thấy mã khách hàng' });
    }
    if (!productId || quantity < 1) {
      return res.status(400).json({ error: 'Thông tin sản phẩm không hợp lệ' });
    }

    const [product] = await pool.query('SELECT SoLuong FROM sanpham WHERE MaSP = ?', [productId]);
    if (!product.length || product[0].SoLuong < quantity) {
      return res.status(400).json({ error: 'Sản phẩm không đủ hàng' });
    }

    await pool.query(
      `INSERT INTO giohang (MaKH, MaSP, SoLuong, Selected)
       VALUES (?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE SoLuong = SoLuong + VALUES(SoLuong)`,
      [req.user.makh, productId, quantity]
    );

    res.status(200).json({ message: 'Thêm vào giỏ hàng thành công' });
  } catch (error) {
    console.error('Lỗi thêm giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi khi thêm vào giỏ hàng', details: error.message });
  }
});

// PUT /cart/update - Cập nhật số lượng
router.put('/cart/update', authenticateToken, async (req, res) => {
  const { productId, quantity } = req.body;
  console.log('Cập nhật giỏ hàng:', { makh: req.user.makh, productId, quantity });

  try {
    if (!req.user.makh) {
      return res.status(400).json({ error: 'Không tìm thấy mã khách hàng' });
    }
    if (!productId || quantity < 1) {
      return res.status(400).json({ error: 'Thông tin không hợp lệ' });
    }

    const [product] = await pool.query('SELECT SoLuong FROM sanpham WHERE MaSP = ?', [productId]);
    if (!product.length || product[0].SoLuong < quantity) {
      return res.status(400).json({ error: 'Sản phẩm không đủ hàng' });
    }

    const [result] = await pool.query(
      'UPDATE giohang SET SoLuong = ? WHERE MaKH = ? AND MaSP = ?',
      [quantity, req.user.makh, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại trong giỏ hàng' });
    }

    res.status(200).json({ message: 'Cập nhật giỏ hàng thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật giỏ hàng', details: error.message });
  }
});

// PUT /cart/select - Cập nhật trạng thái selected
router.put('/cart/select', authenticateToken, async (req, res) => {
  const { productId, selected } = req.body;
  console.log('Cập nhật selected:', { makh: req.user.makh, productId, selected });

  try {
    if (!req.user.makh) {
      return res.status(400).json({ error: 'Không tìm thấy mã khách hàng' });
    }

    const [result] = await pool.query(
      'UPDATE giohang SET Selected = ? WHERE MaKH = ? AND MaSP = ?',
      [selected, req.user.makh, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại trong giỏ hàng' });
    }

    res.status(200).json({ message: 'Cập nhật trạng thái chọn thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật selected:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái chọn', details: error.message });
  }
});

// DELETE /cart/remove/:productId - Xóa sản phẩm khỏi giỏ hàng
router.delete('/cart/remove/:productId', authenticateToken, async (req, res) => {
  const { productId } = req.params;
  console.log('Xóa sản phẩm khỏi giỏ:', { makh: req.user.makh, productId });

  try {
    if (!req.user.makh) {
      return res.status(400).json({ error: 'Không tìm thấy mã khách hàng' });
    }

    const [result] = await pool.query('DELETE FROM giohang WHERE MaKH = ? AND MaSP = ?', [req.user.makh, productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại trong giỏ hàng' });
    }

    res.status(200).json({ message: 'Xóa khỏi giỏ hàng thành công' });
  } catch (error) {
    console.error('Lỗi xóa giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi khi xóa khỏi giỏ hàng', details: error.message });
  }
});

// DELETE /cart/clear - Xóa toàn bộ giỏ hàng
router.delete('/cart/clear', authenticateToken, async (req, res) => {
  console.log('Xóa toàn bộ giỏ hàng:', { makh: req.user.makh });

  try {
    if (!req.user.makh) {
      return res.status(400).json({ error: 'Không tìm thấy mã khách hàng' });
    }

    const [result] = await pool.query('DELETE FROM giohang WHERE MaKH = ?', [req.user.makh]);

    res.status(200).json({ message: `Đã xóa ${result.affectedRows} sản phẩm khỏi giỏ hàng` });
  } catch (error) {
    console.error('Lỗi xóa giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi khi xóa giỏ hàng', details: error.message });
  }
});

// POST /logout - Đăng xuất
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    console.log('Đăng xuất cho makh:', req.user.makh);
    // Xóa refresh token từ DB nếu có
    // await pool.query('DELETE FROM refresh_tokens WHERE makh = ?', [req.user.makh]);

    res.status(200).json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error('Lỗi đăng xuất:', error);
    res.status(500).json({ error: 'Lỗi khi đăng xuất' });
  }
});

export default router;