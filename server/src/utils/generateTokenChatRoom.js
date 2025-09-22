import jwt from 'jsonwebtoken';
import db from '../config/connectDatabase.js'; // Import DB để query user info

// Hàm tạo access token
export async function generateToken(identifier, userType = 'customer') {
  if (!identifier) {
    throw new Error(`${userType} ID là bắt buộc`);
  }

  let payload = {};
  try {
    if (userType === 'staff') {
      // Query taikhoan cho staff
      const [user] = await db.query('SELECT MaTK, TenTK FROM taikhoan WHERE MaTK = ? OR TenTK = ?', [identifier, identifier]);
      if (!user.length) throw new Error('Staff not found');
      payload = {
        MaTK: user[0].MaTK,
        TenTK: user[0].TenTK,
        userType: 'staff'
      };
    } else {
      // Query khachhang cho customer
      const [user] = await db.query('SELECT makh FROM khachhang WHERE makh = ?', [identifier]);
      if (!user.length) throw new Error('Customer not found');
      payload = {
        makh: user[0].makh,
        userType: 'customer'
      };
    }
  } catch (dbError) {
    throw new Error(`Database error: ${dbError.message}`);
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
  console.log('Generated Token:', { identifier, userType, payload, token });
  return token;
}

// Hàm tạo refresh token (tương tự, nhưng dùng REFRESH_TOKEN_SECRET)
export async function generateRefreshToken(identifier, userType = 'customer') {
  // Tương tự generateToken, nhưng với REFRESH_TOKEN_SECRET
  let payload = {};
  // ... (copy logic từ generateToken)
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'your_default_refresh_secret_key', {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  });
  return refreshToken;
}

// Hàm xác thực token (giữ nguyên, nhưng thêm log)
export function authenticateToken(req, res, next) {
  // Bỏ qua trong development nếu BYPASS_AUTH=true
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.warn('BYPASS_AUTH enabled');
    req.user = { makh: '19', userType: 'customer' };
    return next();
  }

  const token = req.cookies.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

  if (!token) {
    console.error('No token provided');
    return res.status(401).json({ error: 'Không tìm thấy token. Vui lòng đăng nhập.' });
  }

  console.log('Received Token:', token.substring(0, 20) + '...'); // Log ngắn để tránh spam

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
    console.log('Decoded Token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verify Error:', error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token không hợp lệ (malformed hoặc sai định dạng).' });
    }
    return res.status(403).json({ error: 'Token không hợp lệ.' });
  }
}