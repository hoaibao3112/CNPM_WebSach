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
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Lỗi xác minh token:', error);
    res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

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

  // if (requirePassword && (!isUpdate || customerData.matkhau !== undefined)) {
  //   if (!customerData.matkhau || customerData.matkhau.trim() === '') {
  //     errors.push('Mật khẩu là bắt buộc');
  //   } else if (customerData.matkhau.length > 100) {
  //     errors.push('Mật khẩu không được vượt quá 100 ký tự');
  //   }
  // }

  // if (customerData.diachi && customerData.diachi.length > 255) {
  //   errors.push('Địa chỉ không được vượt quá 255 ký tự');
  // }

  // if (customerData.sdt && !/^\d{10,11}$/.test(customerData.sdt)) {
  //   errors.push('Số điện thoại không hợp lệ (phải có 10-11 số)');
  // }
console.log('Kết quả kiểm tra:', errors); // Debug
  return errors;
};

router.post('/register/send-otp', async (req, res) => {
  try {
    const { tenkh, email } = req.body;
console.log('Nhận yêu cầu OTP:', { tenkh, email }); // Debug
    const validationErrors = validateCustomer({ tenkh, email }, false, false); // Không yêu cầu mật khẩu
    if (validationErrors.length > 0) {
      console.log('Lỗi kiểm tra:', validationErrors); // Debug
      return res.status(400).json({ errors: validationErrors });
    }

    const [[existingUser]] = await pool.query(
      'SELECT * FROM khachhang WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    const [recentRequests] = await pool.query(
      `SELECT COUNT(*) as count FROM otp_verifications 
       WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [email]
    );

    if (recentRequests[0].count >= 5) {
      return res.status(429).json({ error: 'Bạn đã yêu cầu quá nhiều OTP. Vui lòng đợi 1 tiếng' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO otp_verifications (email, otp, expires_at, ip_address) VALUES (?, ?, ?, ?)',
      [email, otp, expiresAt, req.ip]
    );

    const sent = await sendOTPEmail(email, otp);

    if (!sent) {
      return res.status(500).json({ error: 'Không thể gửi OTP' });
    }

    res.json({ 
      success: true, 
      message: 'Mã OTP đã được gửi đến email của bạn' 
    });
  } catch (error) {
    console.error('Lỗi gửi OTP đăng ký:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Xác nhận OTP cho đăng ký
router.post('/register/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const [[otpRecord]] = await pool.query(
      `SELECT * FROM otp_verifications 
       WHERE email = ? AND otp = ? 
       AND expires_at > NOW() 
       AND is_used = FALSE
       AND attempt_count < 5
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (!otpRecord) {
      await pool.query(
        'UPDATE otp_verifications SET attempt_count = attempt_count + 1 WHERE email = ?',
        [email]
      );
      return res.status(400).json({ error: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    await pool.query(
      'UPDATE otp_verifications SET is_used = TRUE WHERE id = ?',
      [otpRecord.id]
    );

    const resetToken = generateResetToken();
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)',
      [email, resetToken, tokenExpires]
    );

    res.json({ 
      success: true, 
      message: 'Xác nhận OTP thành công',
      resetToken
    });
  } catch (error) {
    console.error('Lỗi xác nhận OTP:', error);
    res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});

// Đặt mật khẩu và hoàn tất đăng ký
router.post('/register/set-password', async (req, res) => {
    try {
        const { email, tenkh, matkhau, token } = req.body;

        const [[tokenRecord]] = await pool.query(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (!tokenRecord) {
            return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
        }

        const validationErrors = validateCustomer({ tenkh, email, matkhau });
        if (validationErrors.length > 0) {
            return res.status(400).json({ errors: validationErrors });
        }

        const hashedPassword = await bcrypt.hash(matkhau.trim(), 10);

        // Thêm sdt và diachi với giá trị NULL
        const [{ insertId }] = await pool.query(
            `INSERT INTO khachhang 
             (tenkh, email, matkhau, tinhtrang, sdt, diachi) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tenkh.trim(), email.trim(), hashedPassword, 'Hoạt động', null, null]
        );

        await pool.query(
            'DELETE FROM password_reset_tokens WHERE token = ?',
            [token]
        );

        const [[newCustomer]] = await pool.query(
            'SELECT * FROM khachhang WHERE makh = ?',
            [insertId]
        );

        res.status(201).json({ 
            message: 'Đăng ký thành công!',
            data: newCustomer
        });
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                errors: ['Email đã tồn tại']
            });
        }
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy tất cả khách hàng với phân trang
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const searchTerm = `%${search}%`;

    const [customers] = await pool.query(
      `SELECT * FROM khachhang 
       WHERE 
         makh LIKE ? OR 
         tenkh LIKE ? OR 
         sdt LIKE ? OR 
         email LIKE ? OR 
         diachi LIKE ?
       ORDER BY makh DESC
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM khachhang
       WHERE 
         makh LIKE ? OR 
         tenkh LIKE ? OR 
         sdt LIKE ? OR 
         email LIKE ? OR 
         diachi LIKE ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.status(200).json({
      data: customers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách hàng:', error);
    res.status(500).json({ 
      error: 'Lỗi khi lấy danh sách khách hàng',
      details: error.message
    });
  }
});

// Lấy khách hàng theo ID
router.get('/:id', async (req, res) => {
  try {
    const [[customer]] = await pool.query(
      'SELECT * FROM khachhang WHERE makh = ?', 
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    res.status(200).json(customer);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin khách hàng:', error);
    res.status(500).json({ 
      error: 'Lỗi khi lấy thông tin khách hàng',
      details: error.message
    });
  }
});

// Tạo khách hàng mới
router.post('/', async (req, res) => {
  try {
    const { tenkh, sdt, email, diachi, tinhtrang, matkhau } = req.body;

    const validationErrors = validateCustomer(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const hashedPassword = await bcrypt.hash(matkhau.trim(), 10);

    const [{ insertId }] = await pool.query(
      `INSERT INTO khachhang 
       (tenkh, sdt, email, diachi, tinhtrang, matkhau) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tenkh.trim(),
        sdt,
        email ? email.trim() : null,
        diachi ? diachi.trim() : null,
        tinhtrang || 'Hoạt động',
        hashedPassword
      ]
    );

    const [[newCustomer]] = await pool.query(
      'SELECT * FROM khachhang WHERE makh = ?',
      [insertId]
    );

    res.status(201).json({ 
      message: 'Thêm khách hàng thành công!',
      data: newCustomer
    });
  } catch (error) {
    console.error('Lỗi khi thêm khách hàng:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        errors: [error.sqlMessage.includes('email') 
          ? 'Email đã tồn tại' 
          : 'Số điện thoại đã tồn tại']
      });
    }

    res.status(500).json({ 
      error: 'Lỗi khi thêm khách hàng',
      details: error.message
    });
  }
});

// Cập nhật khách hàng
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenkh, sdt, email, diachi, tinhtrang, matkhau } = req.body;

    const [[existing]] = await pool.query(
      'SELECT * FROM khachhang WHERE makh = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    const validationErrors = validateCustomer(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const hashedPassword = matkhau ? await bcrypt.hash(matkhau.trim(), 10) : existing.matkhau;

    await pool.query(
      `UPDATE khachhang 
       SET 
         tenkh = ?, 
         sdt = ?, 
         email = ?, 
         diachi = ?, 
         tinhtrang = ?,
         matkhau = ?
       WHERE makh = ?`,
      [
        tenkh ? tenkh.trim() : existing.tenkh,
        sdt || existing.sdt,
        email ? email.trim() : existing.email,
        diachi ? diachi.trim() : existing.diachi,
        tinhtrang || existing.tinhtrang,
        hashedPassword,
        id
      ]
    );

    const [[updatedCustomer]] = await pool.query(
      'SELECT * FROM khachhang WHERE makh = ?',
      [id]
    );

    res.status(200).json({ 
      message: 'Cập nhật khách hàng thành công!',
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật khách hàng:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        errors: [error.sqlMessage.includes('email') 
          ? 'Email đã tồn tại' 
          : 'Số điện thoại đã tồn tại']
      });
    }

    res.status(500).json({ 
      error: 'Lỗi khi cập nhật khách hàng',
      details: error.message
    });
  }
});

// Xóa khách hàng
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [[existing]] = await pool.query(
      'SELECT * FROM khachhang WHERE makh = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    await pool.query('DELETE FROM khachhang WHERE makh = ?', [id]);

    res.status(200).json({ 
      message: 'Xóa khách hàng thành công!',
      deletedCustomer: existing
    });
  } catch (error) {
    console.error('Lỗi khi xóa khách hàng:', error);

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'Không thể xóa khách hàng',
        details: 'Đang được tham chiếu trong các giao dịch khác'
      });
    }

    res.status(500).json({ 
      error: 'Lỗi khi xóa khách hàng',
      details: error.message
    });
  }
});

// Chuyển đổi trạng thái
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;

    const [customer] = await pool.query(
      'SELECT tinhtrang FROM khachhang WHERE makh = ?',
      [id]
    );

    if (customer.length === 0) {
      return res.status(404).json({ error: 'Khách hàng không tồn tại' });
    }

    const newStatus = customer[0].tinhtrang === 'Hoạt động' 
      ? 'Ngừng hoạt động' 
      : 'Hoạt động';

    const [result] = await pool.query(
      'UPDATE khachhang SET tinhtrang = ? WHERE makh = ?',
      [newStatus, id]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Cập nhật thất bại' });
    }

    res.json({
      message: 'Đã đổi trạng thái!',
      newStatus,
      makh: id
    });
  } catch (error) {
    console.error('Lỗi chuyển đổi trạng thái:', error);
    res.status(500).json({
      error: 'Lỗi server',
      details: error.message
    });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { email, matkhau } = req.body;

    if (!email || !matkhau) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ email và mật khẩu' });
    }

    const [[user]] = await pool.query(
      'SELECT * FROM khachhang WHERE email = ?',
      [email.trim()]
    );

    if (!user || !(await bcrypt.compare(matkhau.trim(), user.matkhau))) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const token = generateToken(user.makh);
    const refreshToken = generateRefreshToken(user.makh);

    res.status(200).json({ 
      message: 'Đăng nhập thành công',
      user: {
        makh: user.makh,
        tenkh: user.tenkh,
        email: user.email,
        sdt: user.sdt
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập', details: error.message });
  }
});

// Làm mới token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Không có refresh token' });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = generateToken(decoded.userId);

    res.status(200).json({ token: newAccessToken });
  } catch (error) {
    console.error('Lỗi làm mới token:', error);
    res.status(403).json({ error: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }
});

// Quên mật khẩu - Gửi OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const [[user]] = await pool.query(
      'SELECT * FROM khachhang WHERE email = ?',
      [email]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Email không tồn tại trong hệ thống' });
    }
    
    const [recentRequests] = await pool.query(
      `SELECT COUNT(*) as count FROM otp_verifications 
       WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [email]
    );
    
    if (recentRequests[0].count >= 5) {
      return res.status(429).json({ error: 'Bạn đã yêu cầu quá nhiều OTP. Vui lòng đợi 1 tiếng' });
    }
    
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO otp_verifications (email, otp, expires_at, ip_address) VALUES (?, ?, ?, ?)',
      [email, otp, expiresAt, req.ip]
    );
    
    const sent = await sendOTPEmail(email, otp);
    
    if (!sent) {
      return res.status(500).json({ error: 'Không thể gửi OTP' });
    }
    
    res.json({ 
      success: true, 
      message: 'Mã OTP đã được gửi đến email của bạn' 
    });
  } catch (error) {
    console.error('Lỗi quên mật khẩu:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Xác nhận OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const [[otpRecord]] = await pool.query(
      `SELECT * FROM otp_verifications 
       WHERE email = ? AND otp = ? 
       AND expires_at > NOW() 
       AND is_used = FALSE
       AND attempt_count < 5
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (!otpRecord) {
      await pool.query(
        'UPDATE otp_verifications SET attempt_count = attempt_count + 1 WHERE email = ?',
        [email]
      );
      return res.status(400).json({ error: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    await pool.query(
      'UPDATE otp_verifications SET is_used = TRUE WHERE id = ?',
      [otpRecord.id]
    );

    const resetToken = generateResetToken();
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    
    await pool.query(
      'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)',
      [email, resetToken, tokenExpires]
    );
    
    res.json({ 
      success: true, 
      message: 'Xác nhận OTP thành công',
      resetToken
    });
  } catch (error) {
    console.error('Lỗi xác nhận OTP:', error);
    res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});

// Đặt lại mật khẩu
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Mật khẩu không khớp' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }
    
    const [[tokenRecord]] = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    
    if (!tokenRecord) {
      return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE khachhang SET matkhau = ? WHERE email = ?',
      [hashedPassword, tokenRecord.email]
    );
    
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE token = ?',
      [token]
    );
    
    res.json({ 
      success: true, 
      message: 'Đặt lại mật khẩu thành công' 
    });
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Đổi mật khẩu
router.post('/change-password/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Mật khẩu mới và xác nhận mật khẩu không khớp' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
    }

    if (id !== req.user.userId) {
      return res.status(403).json({ error: 'Không có quyền đổi mật khẩu này' });
    }

    const [[customer]] = await pool.query(
      'SELECT * FROM khachhang WHERE makh = ?',
      [id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    const isMatch = await bcrypt.compare(oldPassword, customer.matkhau);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mật khẩu cũ không đúng' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE khachhang SET matkhau = ? WHERE makh = ?',
      [hashedPassword, id]
    );

    res.status(200).json({ 
      message: 'Đổi mật khẩu thành công' 
    });
  } catch (error) {
    console.error('Lỗi khi đổi mật khẩu:', error);
    res.status(500).json({ error: 'Lỗi server khi đổi mật khẩu', details: error.message });
  }
});

// Lấy hồ sơ khách hàng
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [[customer]] = await pool.query(
      'SELECT makh, tenkh, sdt, email, diachi, tinhtrang FROM khachhang WHERE makh = ?',
      [req.user.userId]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ khách hàng' });
    }

    res.status(200).json({
      message: 'Lấy thông tin hồ sơ thành công',
      data: customer
    });
  } catch (error) {
    console.error('Lỗi khi lấy hồ sơ:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy thông tin hồ sơ',
      details: error.message
    });
  }
});

// Cập nhật hồ sơ khách hàng
router.put('/profile/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tenkh, sdt, email, diachi } = req.body;

    if (id !== req.user.userId) {
      return res.status(403).json({ error: 'Không có quyền cập nhật hồ sơ này' });
    }

    const [[existing]] = await pool.query(
      'SELECT * FROM khachhang WHERE makh = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ khách hàng' });
    }

   

 const customerData = { tenkh, sdt, email, diachi };
    const validationErrors = validateCustomer(customerData, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    await pool.query(
      `UPDATE khachhang 
       SET 
         tenkh = ?, 
         sdt = ?, 
         email = ?, 
         diachi = ?
       WHERE makh = ?`,
      [
        tenkh ? tenkh.trim() : existing.tenkh,
        sdt || existing.sdt,
        email ? email.trim() : existing.email,
        diachi ? diachi.trim() : existing.diachi,
        id
      ]
    );

    const [[updatedCustomer]] = await pool.query(
      'SELECT makh, tenkh, sdt, email, diachi, tinhtrang FROM khachhang WHERE makh = ?',
      [id]
    );

    res.status(200).json({
      message: 'Cập nhật hồ sơ thành công',
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật hồ sơ:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        errors: [error.sqlMessage.includes('email') 
          ? 'Email đã tồn tại' 
          : 'Số điện thoại đã tồn tại']
      });
    }

    res.status(500).json({
      error: 'Lỗi khi cập nhật hồ sơ',
      details: error.message
    });
  }
});

export default router;