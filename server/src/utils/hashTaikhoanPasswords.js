import bcrypt from 'bcryptjs';
import pool from '../config/connectDatabase.js';
import { fileURLToPath } from 'url';

async function hashAllTaikhoanPasswords() {
  try {
    const [accounts] = await pool.query('SELECT MaTK, TenTK, MatKhau FROM taikhoan');
    console.log('Total taikhoan rows:', accounts.length);

    for (const acc of accounts) {
      const { MaTK, TenTK, MatKhau } = acc;
      if (!MatKhau) {
        console.log(`MaTK ${MaTK} (${TenTK}) - empty password, skipping.`);
        continue;
      }

      // Skip already hashed bcrypt (prefix $2a$ or $2b$ or $2y$)
      if (MatKhau.startsWith('$2a$') || MatKhau.startsWith('$2b$') || MatKhau.startsWith('$2y$')) {
        console.log(`MaTK ${MaTK} (${TenTK}) - already hashed.`);
        continue;
      }

      try {
        const hashed = await bcrypt.hash(MatKhau, 10);
        const [result] = await pool.query('UPDATE taikhoan SET MatKhau = ? WHERE MaTK = ?', [hashed, MaTK]);
        console.log(`MaTK ${MaTK} (${TenTK}) - password hashed. Updated rows: ${result.affectedRows}`);
      } catch (err) {
        console.error(`Error hashing MaTK ${MaTK} (${TenTK}):`, err.message || err);
      }
    }

    console.log('Finished processing taikhoan passwords.');
  } catch (error) {
    console.error('Error in hashAllTaikhoanPasswords:', error);
  } finally {
    try {
      await pool.end();
    } catch (e) {
      // ignore
    }
  }
}

// Run when executed directly (ESM-safe)
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  hashAllTaikhoanPasswords();
}

export default hashAllTaikhoanPasswords;
