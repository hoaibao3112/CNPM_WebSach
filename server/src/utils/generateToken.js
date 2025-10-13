import jwt from 'jsonwebtoken';

// Hàm tạo access token - SỬA DEFAULT FALLBACK
export function generateToken(makh, userType = 'customer') {
  if (!makh) {
    throw new Error('makh là bắt buộc');
  }

  const payload = {
    makh, // Thay userId bằng makh để đồng bộ với orderRoutes.js
    userType
  };

  // SỬA: Tăng default từ '2h' lên '4h'
  const expiresIn = process.env.JWT_EXPIRES_IN || '4h';
  
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret_key', {
    expiresIn
  });
  
  // THÊM DEBUG THỜI GIAN
  console.log('Generated Token:', { 
    makh, 
    userType, 
    expiresIn,
    tokenPreview: token.substring(0, 30) + '...' 
  });
  return token;
}

// Hàm tạo refresh token - SỬA DEFAULT FALLBACK
export function generateRefreshToken(makh, userType = 'customer') {
  if (!makh) {
    throw new Error('makh là bắt buộc');
  }

  const payload = {
    makh,
    userType
  };

  // SỬA: Tăng default từ '7d' lên '14d'
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '14d';

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'your_default_refresh_secret_key', {
    expiresIn
  });
  
  console.log('Generated Refresh Token:', { 
    makh, 
    userType, 
    expiresIn,
    refreshTokenPreview: refreshToken.substring(0, 30) + '...' 
  });
  return refreshToken;
}

// Hàm xác thực token - THÊM DEBUG CHI TIẾT
export function authenticateToken(req, res, next) {
  // Bỏ qua xác thực trong môi trường development nếu cần test
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.warn('🚨 BYPASS_AUTH enabled: Skipping token authentication');
    req.user = { makh: '19', userType: 'customer' }; 
    return next();
  }

  // Ưu tiên lấy token từ cookie, sau đó từ header Authorization
  const token = req.cookies.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

  if (!token) {
    console.error('❌ No token provided');
    return res.status(401).json({ error: 'Không tìm thấy token. Vui lòng đăng nhập.' });
  }

  console.log('🔍 Received Token (first 30 chars):', token.substring(0, 30) + '...');
  console.log('🔑 JWT_SECRET used:', process.env.JWT_SECRET ? 'Present' : 'Missing');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
    
    // THÊM DEBUG THỜI GIAN CHI TIẾT
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    const hoursLeft = Math.floor(timeUntilExpiry / 3600);
    const minutesLeft = Math.floor((timeUntilExpiry % 3600) / 60);
    
    console.log('✅ Token verified successfully:', {
      user: decoded.makh,
      userType: decoded.userType,
      issuedAt: new Date(decoded.iat * 1000).toLocaleString('vi-VN'),
      expiresAt: new Date(decoded.exp * 1000).toLocaleString('vi-VN'),
      timeLeft: timeUntilExpiry > 0 ? `${hoursLeft}h ${minutesLeft}m` : 'EXPIRED'
    });
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ JWT Verify Error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      const expiredAt = new Date(error.expiredAt).toLocaleString('vi-VN');
      console.error('🕐 Token expired at:', expiredAt);
      console.error('🔄 Please login again to get a new 4h token');
      
      return res.status(401).json({ 
        error: 'Token đã hết hạn. Vui lòng đăng nhập lại để lấy token 4h mới.',
        expiredAt: expiredAt,
        action: 'login_required'
      });
    }
    return res.status(403).json({ error: 'Token không hợp lệ.' });
  }
}