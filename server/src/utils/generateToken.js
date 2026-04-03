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

// NOTE: Token verification middleware is centralized in src/middlewares/auth.js