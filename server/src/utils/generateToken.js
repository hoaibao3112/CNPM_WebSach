import jwt from 'jsonwebtoken';

// Hàm tạo access token
export function generateToken(makh, userType = 'customer') {
  if (!makh) {
    throw new Error('makh là bắt buộc');
  }

  const payload = {
    makh, // Thay userId bằng makh để đồng bộ với orderRoutes.js
    userType
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h'
  });
  console.log('Generated Token:', { makh, userType, token }); // Log để debug
  return token;
}

// Hàm tạo refresh token
export function generateRefreshToken(makh, userType = 'customer') {
  if (!makh) {
    throw new Error('makh là bắt buộc');
  }

  const payload = {
    makh,
    userType
  };

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'your_default_refresh_secret_key', {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  });
  console.log('Generated Refresh Token:', { makh, userType, refreshToken });
  return refreshToken;
}

// Hàm xác thực token
export function authenticateToken(req, res, next) {
  // Bỏ qua xác thực trong môi trường development nếu cần test
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.warn('BYPASS_AUTH enabled: Skipping token authentication');
    req.user = { makh: '19', userType: 'customer' }; // Giả lập user để test
    return next();
  }

  // Ưu tiên lấy token từ cookie, sau đó từ header Authorization
  const token = req.cookies.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

  if (!token) {
    console.error('No token provided');
    return res.status(401).json({ error: 'Không tìm thấy token. Vui lòng đăng nhập.' });
  }

  console.log('Received Token:', token);
  console.log('JWT_SECRET used:', process.env.JWT_SECRET);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
    console.log('Decoded Token:', decoded);
    req.user = decoded; // Lưu toàn bộ payload vào req.user để hỗ trợ cả MaQuyen, MaTK, TenTK và makh, userType
    next();
  } catch (error) {
    console.error('JWT Verify Error:', error.message, error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    return res.status(403).json({ error: 'Token không hợp lệ.' });
  }
}
