import express from 'express';
import pool from '../config/connectDatabase.js';
const router = express.Router();

// Lấy danh sách lương
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.*, nv.TenNV FROM luong l JOIN nhanvien nv ON l.MaNV = nv.MaNV`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách lương', details: error.message });
  }
});

// Thêm bản ghi lương mới
router.post('/', async (req, res) => {
  try {
    const { MaNV, thang, nam, luong_co_ban, phu_cap, thuong, phat, tong_luong, trang_thai } = req.body;
    await pool.query(
      `INSERT INTO luong (MaNV, thang, nam, luong_co_ban, phu_cap, thuong, phat, tong_luong, trang_thai)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [MaNV, thang, nam, luong_co_ban, phu_cap, thuong, phat, tong_luong, trang_thai]
    );
    res.json({ message: 'Thêm lương thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm lương', details: error.message });
  }
});
router.get('/by-manv/:MaNV', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM luong WHERE MaNV = ? ORDER BY nam DESC, thang DESC`,
      [req.params.MaNV]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy lương nhân viên', details: error.message });
  }
});
export default router;