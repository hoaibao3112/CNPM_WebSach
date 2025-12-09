import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

// Load biến môi trường
dotenv.config();

// Cấu hình kết nối với giá trị mặc định an toàn hơn
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1', // Sử dụng 127.0.0.1 thay vì localhost để tránh DNS lookup
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'bansach',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Giới hạn số connection đồng thời
  queueLimit: 0,
  enableKeepAlive: true, // Giữ kết nối ổn định
  keepAliveInitialDelay: 10000, // 10 giây
  timezone: '+07:00' // Múi giờ Việt Nam
};

// TLS/SSL: support raw PEM or base64-encoded PEM via env vars
const sslCaRaw = process.env.DB_SSL_CA || null;
const sslCaB64 = process.env.DB_SSL_CA_BASE64 || null;
if (sslCaB64) {
  try {
    const caBuf = Buffer.from(sslCaB64, 'base64');
    dbConfig.ssl = {
      ca: caBuf,
      rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== 'false'
    };
    console.log('DB SSL: using DB_SSL_CA_BASE64');
  } catch (err) {
    console.warn('DB SSL: failed to parse DB_SSL_CA_BASE64, falling back', err.message);
  }
} else if (sslCaRaw) {
  dbConfig.ssl = {
    ca: sslCaRaw,
    rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== 'false'
  };
  console.log('DB SSL: using DB_SSL_CA (raw PEM)');
} else if (process.env.DB_REQUIRE_SSL === 'true') {
  dbConfig.ssl = { rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== 'false' };
  console.log('DB SSL: required but no CA provided (attempting TLS without CA)');
}

// Tạo pool kết nối với xử lý lỗi
const pool = mysql.createPool(dbConfig);

// Kiểm tra kết nối khi khởi động và xử lý lỗi chứng chỉ nếu cần
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Đã kết nối thành công đến MySQL database');
    connection.release();
  } catch (err) {
    console.error('❌ Lỗi kết nối database:', err.message);
    // Nếu lỗi liên quan đến chứng chỉ, thử fallback tạm thời bằng cách cho phép
    // không kiểm tra chứng chỉ (rejectUnauthorized = false). Điều này KHÔNG an toàn
    // cho production nhưng hữu ích để debug và cho service chạy trong giai đoạn
    // cấu hình. Cách đúng là cung cấp CA chain chính xác vào `DB_SSL_CA`.
    if (err.message && err.message.toLowerCase().includes('unable to get local issuer certificate')) {
      console.warn('⚠️ Certificate verification failed. Retrying with relaxed TLS settings (rejectUnauthorized=false).');
      try {
        // Recreate pool with relaxed TLS
        if (!dbConfig.ssl) dbConfig.ssl = {};
        dbConfig.ssl.rejectUnauthorized = false;
        const fallbackPool = mysql.createPool(dbConfig);
        const connection2 = await fallbackPool.getConnection();
        console.warn('⚠️ Connected to DB with relaxed TLS verification. Please fix DB_SSL_CA to enable strict verification.');
        connection2.release();
        // Replace original pool with fallback so app can continue running
        // Note: we intentionally do not export fallbackPool here; instead mutate existing pool variable by closing old and assigning new.
        try { await pool.end(); } catch (e) { /* ignore */ }
        // assign fallback pool to export
        // eslint-disable-next-line no-global-assign
        pool = fallbackPool; // replace pool for exported default
      } catch (err2) {
        console.error('❌ Fallback DB connection also failed:', err2.message);
        process.exit(1);
      }
    } else {
      process.exit(1); // Thoát nếu lỗi khác
    }
  }
})();

// Xử lý sự kiện đóng kết nối khi ứng dụng tắt
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('Database connection pool closed');
    process.exit(0);
  } catch (err) {
    console.error('Error closing connection pool:', err);
    process.exit(1);
  }
});

export default pool;