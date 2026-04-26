/**
 * App Config - Validate environment variables khi startup
 * Import ở đầu server.js: import './src/config/app.config.js';
 */
import dotenv from 'dotenv';
dotenv.config();

const required = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET'
];

const optional = [
  'PORT',
  'NODE_ENV',
  'DB_PORT',
  'JWT_EXPIRES_IN',
  'REFRESH_TOKEN_EXPIRES_IN',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'VNP_TMNCODE',
  'VNP_HASHSECRET',
  'VNP_URL',
  'VNP_RETURN_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'CLIENT_ADMIN_URL',
  'CLIENT_CUSTOMER_URL'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ FATAL: Thiếu biến môi trường bắt buộc:');
  missing.forEach(key => console.error(`   - ${key}`));
  console.error('Vui lòng cấu hình trong file .env');
  process.exit(1);
}

// Warn about unset optional vars
const unset = optional.filter(key => !process.env[key]);
if (unset.length > 0) {
  console.warn('⚠️  Biến môi trường tùy chọn chưa được cấu hình:', unset.join(', '));
}

console.log('✅ App config validated successfully');
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
// Only log DB details in development to avoid leaking host info in production logs
if (process.env.NODE_ENV !== 'production') {
  console.log(`   Database: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`);
}
