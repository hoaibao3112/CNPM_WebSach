import express from 'express';
import pool from '../config/connectDatabase.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // dùng bcrypt để so sánh mật khẩu đã hash

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
    
    // 3. Kiểm tra mật khẩu
    // Nếu mật khẩu trong DB đã được hash (bcrypt), dùng bcrypt.compare.
    // Nếu mật khẩu là plaintext (dữ liệu cũ), so sánh trực tiếp và
    // - nếu đúng, upgrade bằng cách hash mật khẩu rồi cập nhật DB (giúp di chuyển dần dữ liệu cũ).
    let passwordMatch = false;
    const stored = account.MatKhau || '';

    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
      // bcrypt hash
      passwordMatch = await bcrypt.compare(MatKhau, stored);
    } else {
      // Plain-text fallback (migrate to bcrypt on successful auth)
      passwordMatch = stored === MatKhau;
      if (passwordMatch) {
        try {
          const newHash = await bcrypt.hash(MatKhau, 10);
          await pool.query('UPDATE taikhoan SET MatKhau = ? WHERE MaTK = ?', [newHash, account.MaTK]);
          // update local object so we don't accidentally leak plain password
          account.MatKhau = newHash;
        } catch (err) {
          console.error('Lỗi khi nâng cấp mật khẩu sang hash:', err);
          // không block login nếu cập nhật hash thất bại; người dùng vẫn được đăng nhập
        }
      }
    }

    if (!passwordMatch) {
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