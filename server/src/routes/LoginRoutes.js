import express from 'express';
import pool from '../config/connectDatabase.js';
import jwt from 'jsonwebtoken';
//import bcrypt from 'bcryptjs'; // Thêm thư viện mã hóa mật khẩu

const router = express.Router();

// API đăng nhập
router.post('/', async (req, res) => {
  // Validate input
  if (!req.body.TenTK || !req.body.MatKhau) {
    return res.status(400).json({
      success: false,
      error: 'Thiếu thông tin đăng nhập',
      message: 'Vui lòng cung cấp tên tài khoản và mật khẩu'
    });
  }

  const { TenTK, MatKhau } = req.body;

  try {
    // 1. Tìm tài khoản theo tên đăng nhập
    const [accounts] = await pool.query(
      'SELECT * FROM taikhoan WHERE TenTK = ? AND TinhTrang = 1',
      [TenTK]
    );

    // 2. Kiểm tra tài khoản tồn tại
    if (accounts.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Tài khoản không tồn tại',
        message: 'Tên đăng nhập không chính xác hoặc tài khoản đã bị khóa'
      });
    }

    const account = accounts[0];
    
    // 3. Kiểm tra mật khẩu (nên dùng bcrypt.compare nếu mật khẩu được hash)
    // Nếu chưa hash mật khẩu, so sánh trực tiếp
    if (account.MatKhau !== MatKhau) {
      return res.status(401).json({
        success: false,
        error: 'Sai mật khẩu',
        message: 'Mật khẩu không chính xác'
      });
    }

    // 4. Tạo JWT token
    const token = jwt.sign(
      {
        MaTK: account.MaTK,
        TenTK: account.TenTK,
        MaQuyen: account.MaQuyen
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // 5. Loại bỏ mật khẩu trước khi trả về client
    const { MatKhau: _, ...userWithoutPassword } = account;

    // 6. Trả về response thành công
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: userWithoutPassword,
      expiresIn: 3600 // Thời gian hết hạn token (giây)
    });

  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi hệ thống', 
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Đã xảy ra lỗi khi xử lý yêu cầu đăng nhập'
    });
  }
});

export default router;