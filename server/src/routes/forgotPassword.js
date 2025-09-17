import express from 'express';
import pool from '../config/connectDatabase.js';
import bcrypt from 'bcryptjs';
import { generateOTP, sendOTPEmail } from '../utils/emailService.js';
import crypto from 'crypto';

const router = express.Router();
const saltRounds = 10;

// POST /send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Gửi OTP quên mật khẩu cho admin:', { email });

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }

    const [[existingUser]] = await pool.query('SELECT * FROM nhanvien WHERE Email = ?', [email]);
    if (!existingUser) {
      return res.status(400).json({ error: 'Email không tồn tại trong hệ thống admin' });
    }

    const [recentRequests] = await pool.query(
      'SELECT COUNT(*) as count FROM otp_requests WHERE email = ? AND type = "forgot-password" AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)',
      [email]
    );
    if (recentRequests[0].count >= 3) {
      return res.status(429).json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 5 phút.' });
    }

    const otp = generateOTP();
    const resetToken = crypto.randomBytes(32).toString('hex');

    await pool.query(
      'INSERT INTO otp_requests (email, otp, token, created_at, expires_at, type) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 5 MINUTE), ?) ON DUPLICATE KEY UPDATE otp = VALUES(otp), token = VALUES(token), created_at = VALUES(created_at), expires_at = VALUES(expires_at)',
      [email, otp, resetToken, 'forgot-password']
    );

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      console.error('Gửi email thất bại cho:', email);
      return res.status(500).json({ error: 'Không thể gửi email OTP. Vui lòng thử lại.' });
    }

    console.log('OTP gửi thành công cho admin:', { email, otp: '***', resetToken: '***' });
    res.status(200).json({ message: 'Mã OTP đã được gửi đến email của bạn. OTP hết hạn sau 5 phút.' });
  } catch (error) {
    console.error('Lỗi gửi OTP quên mật khẩu cho admin:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Lỗi server khi gửi OTP', details: error.message });
  }
});

// POST /verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('Xác thực OTP cho admin:', { email, otp: '***' });

    if (!email || !otp) {
      return res.status(400).json({ error: 'Thiếu email hoặc OTP' });
    }

    const [[request]] = await pool.query(
      'SELECT * FROM otp_requests WHERE email = ? AND otp = ? AND type = "forgot-password" AND expires_at > NOW()',
      [email, otp]
    );

    if (!request) {
      return res.status(400).json({ error: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    const resetToken = request.token;
    if (!resetToken) {
      return res.status(400).json({ error: 'Token reset không hợp lệ' });
    }

    await pool.query(
      'INSERT INTO password_resets_admin (email, token, expires_at, used) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), FALSE) ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at), used = FALSE',
      [email, resetToken]
    );

    await pool.query('DELETE FROM otp_requests WHERE id = ?', [request.id]);

    console.log('OTP xác thực thành công cho admin:', { email, resetToken: '***' });
    res.status(200).json({
      message: 'Xác thực OTP thành công. Bạn có 30 phút để đặt lại mật khẩu.',
      resetToken,
      email
    });
  } catch (error) {
    console.error('Lỗi xác thực OTP cho admin:', { error: error.message, stack: error.stack, email: req.body.email || 'undefined', otp: '***' });
    res.status(500).json({ error: 'Lỗi server khi xác thực OTP', details: error.message });
  }
});
// POST /reset-password
router.post('/reset-password', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Body request không hợp lệ' });
    }

    const { email, resetToken, newPassword, confirmPassword } = req.body;
    console.log('Reset mật khẩu cho admin:', { email, resetToken: '***', newPassword: '***', confirmPassword: '***' });

    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Thiếu thông tin yêu cầu (email, resetToken, newPassword, confirmPassword)' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Mật khẩu xác nhận không khớp' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const [[resetRecord]] = await pool.query(
      'SELECT * FROM password_resets_admin WHERE email = ? AND token = ? AND expires_at > NOW() AND used = FALSE',
      [email, resetToken]
    );

    if (!resetRecord) {
      return res.status(400).json({ error: 'Token reset không hợp lệ, đã hết hạn hoặc đã sử dụng' });
    }

    const [[user]] = await pool.query('SELECT MaNV, TenNV FROM nhanvien WHERE Email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy admin với email này' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Kiểm tra và tạo/ cập nhật tài khoản nếu không tồn tại
    const [[existingAccount]] = await pool.query(
      'SELECT MaTK FROM taikhoan WHERE TenTK = ?',
      [user.MaNV] // Thử với MaNV
    );

    let updateResult;
    if (!existingAccount) {
      // Tạo mới tài khoản nếu không tồn tại
      const [insertResult] = await pool.query(
        'INSERT INTO taikhoan (TenTK, MatKhau, MaQuyen, NgayTao) VALUES (?, ?, 1, CURDATE())',
        [user.MaNV, hashedPassword]
      );
      if (insertResult.affectedRows === 0) {
        return res.status(500).json({ error: 'Không thể tạo tài khoản mới' });
      }
    } else {
      // Cập nhật mật khẩu nếu tài khoản đã tồn tại
      [updateResult] = await pool.query(
        'UPDATE taikhoan SET MatKhau = ? WHERE TenTK = ?',
        [hashedPassword, user.MaNV]
      );
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Không tìm thấy tài khoản để cập nhật mật khẩu' });
      }
    }

    await pool.query('UPDATE password_resets_admin SET used = TRUE WHERE id = ?', [resetRecord.id]);

    console.log('Reset mật khẩu thành công cho admin:', { email });
    res.status(200).json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
  } catch (error) {
    console.error('Lỗi reset mật khẩu cho admin:', {
      error: error.message,
      stack: error.stack,
      email: req.body.email || 'undefined',
      resetToken: req.body.resetToken ? '***' : 'undefined'
    });
    res.status(500).json({ error: 'Lỗi server khi đặt lại mật khẩu', details: error.message });
  }
});
export default router;