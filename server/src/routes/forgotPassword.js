import express from 'express';
import pool from '../config/connectDatabase.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const router = express.Router();

// Cấu hình email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-email-password'
  }
});

// Lưu trữ tạm thời các mã OTP
const otpStorage = new Map();

// Gửi mã OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Kiểm tra email có tồn tại trong database không
    const [users] = await pool.query('SELECT * FROM nhanvien WHERE Email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Email không tồn tại trong hệ thống' });
    }

    // Tạo mã OTP 6 chữ số
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Hết hạn sau 15 phút

    // Lưu OTP vào bộ nhớ tạm
    otpStorage.set(email, { otp, expiresAt });

    // Gửi email 
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Mã OTP để đặt lại mật khẩu',
      text: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 15 phút.`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Mã OTP đã được gửi đến email của bạn' });
  } catch (error) {
    console.error('Lỗi khi gửi OTP:', error);
    res.status(500).json({ error: 'Lỗi khi gửi OTP', details: error.message });
  }
});

// Xác thực OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Kiểm tra OTP có tồn tại và còn hiệu lực không
    const storedOtp = otpStorage.get(email);
    
    if (!storedOtp) {
      return res.status(400).json({ error: 'Không tìm thấy yêu cầu OTP cho email này' });
    }
    
    if (storedOtp.otp !== otp) {
      return res.status(400).json({ error: 'Mã OTP không chính xác' });
    }
    
    if (new Date() > storedOtp.expiresAt) {
      otpStorage.delete(email);
      return res.status(400).json({ error: 'Mã OTP đã hết hạn' });
    }

    // Nếu OTP hợp lệ, tạo token để đặt lại mật khẩu
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // Hết hạn sau 30 phút

    otpStorage.set(email, { ...storedOtp, resetToken, tokenExpiresAt });

    res.status(200).json({ 
      message: 'Xác thực OTP thành công', 
      resetToken,
      email
    });
  } catch (error) {
    console.error('Lỗi khi xác thực OTP:', error);
    res.status(500).json({ error: 'Lỗi khi xác thực OTP', details: error.message });
  }
});

// Đặt lại mật khẩu
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    
    // Kiểm tra token
    const storedData = otpStorage.get(email);
    
    if (!storedData || !storedData.resetToken) {
      return res.status(400).json({ error: 'Token đặt lại mật khẩu không hợp lệ' });
    }
    
    if (storedData.resetToken !== resetToken) {
      return res.status(400).json({ error: 'Token đặt lại mật khẩu không khớp' });
    }
    
    if (new Date() > storedData.tokenExpiresAt) {
      otpStorage.delete(email);
      return res.status(400).json({ error: 'Token đặt lại mật khẩu đã hết hạn' });
    }

    // Cập nhật mật khẩu mới trong database
    // Lưu ý: Trong thực tế, bạn nên mã hóa mật khẩu trước khi lưu
    const [result] = await pool.query(
      'UPDATE taikhoan SET MatKhau = ? WHERE MaNV IN (SELECT MaNV FROM nhanvien WHERE Email = ?)',
      [newPassword, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản để cập nhật' });
    }

    // Xóa OTP và token sau khi đã sử dụng
    otpStorage.delete(email);

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi khi đặt lại mật khẩu:', error);
    res.status(500).json({ error: 'Lỗi khi đặt lại mật khẩu', details: error.message });
  }
});

export default router;