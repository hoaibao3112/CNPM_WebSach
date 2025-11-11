import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

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

// Tạo pool kết nối với xử lý lỗi
const pool = mysql.createPool(dbConfig);

// Kiểm tra kết nối khi khởi động
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Đã kết nối thành công đến MySQL database');
    connection.release();
  } catch (err) {
    console.error('❌ Lỗi kết nối database:', err.message);
    process.exit(1); // Thoát nếu không kết nối được
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