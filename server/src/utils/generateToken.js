import jwt from 'jsonwebtoken';

// Hàm tạo access token
export function generateToken(userId, userType = 'customer') {
  if (!userId) {
    throw new Error('userId là bắt buộc');
  }

  const payload = {
    userId,
    userType
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
}

// Hàm tạo refresh token
export function generateRefreshToken(userId, userType = 'customer') {
  if (!userId) {
    throw new Error('userId là bắt buộc');
  }

  const payload = {
    userId,
    userType
  };

  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'your_default_refresh_secret_key', {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  });
}

// Hàm xác thực token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Lấy token từ "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Không tìm thấy token. Vui lòng đăng nhập.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
    req.user = decoded; // Gắn thông tin user (userId, userType) vào req.user
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    return res.status(403).json({ error: 'Token không hợp lệ.' });
  }
}