import bcrypt from 'bcryptjs';
import pool from '../config/connectDatabase.js';

async function hashAllPasswords() {
  try {
    // Lấy tất cả khách hàng từ bảng khachhang
    const [customers] = await pool.query('SELECT makh, matkhau FROM khachhang');

    console.log('Total customers:', customers.length);

    // Duyệt qua từng khách hàng
    for (const customer of customers) {
      const { makh, matkhau } = customer;

      // Kiểm tra xem mật khẩu có phải plaintext không
      // Nếu mật khẩu không bắt đầu bằng $2a$ (chuỗi mã hóa của bcrypt), thì mã hóa lại
      if (!matkhau.startsWith('$2a$')) {
        console.log(`Hashing password for makh ${makh}...`);

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(matkhau, 10);

        // Cập nhật mật khẩu trong cơ sở dữ liệu
        await pool.query(
          'UPDATE khachhang SET matkhau = ? WHERE makh = ?',
          [hashedPassword, makh]
        );

        console.log(`Updated password for makh ${makh}: ${hashedPassword}`);
      } else {
        console.log(`Password for makh ${makh} is already hashed.`);
      }
    }

    console.log('All passwords have been processed.');
  } catch (error) {
    console.error('Error hashing passwords:', error);
  } finally {
    // Đóng kết nối cơ sở dữ liệu
    await pool.end();
  }
}

// Gọi hàm để chạy
hashAllPasswords();