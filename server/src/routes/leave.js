import express from 'express';
import pool from '../config/connectDatabase.js';
const router = express.Router();

// Lấy danh sách đơn nghỉ phép
router.get('/', async (req, res) => {
  try {
   const [rows] = await pool.query('SELECT * FROM xin_nghi_phep');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách nghỉ phép', details: error.message });
  }
});

// Gửi đơn nghỉ phép
router.post('/', async (req, res) => {
  try {
    const { MaTK, ngay_bat_dau, ngay_ket_thuc, ly_do } = req.body;
    await pool.query(
      `INSERT INTO xin_nghi_phep (MaTK, ngay_bat_dau, ngay_ket_thuc, ly_do, trang_thai)
       VALUES (?, ?, ?, ?, 'Cho_duyet')`,
      [MaTK, ngay_bat_dau, ngay_ket_thuc, ly_do]
    );
    res.json({ message: 'Gửi đơn nghỉ phép thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi gửi đơn nghỉ phép', details: error.message });
  }
});

// Duyệt đơn nghỉ phép
router.put('/:id/approve', async (req, res) => {
  try {
    const { nguoi_duyet } = req.body;
    await pool.query(
      `UPDATE xin_nghi_phep SET trang_thai = 'Da_duyet', nguoi_duyet = ?, ngay_duyet = NOW() WHERE id = ?`,
      [nguoi_duyet, req.params.id]
    );
    res.json({ message: 'Đã duyệt đơn nghỉ phép' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi duyệt đơn', details: error.message });
  }
});

// Từ chối đơn nghỉ phép
router.put('/:id/reject', async (req, res) => {
  try {
    const { nguoi_duyet } = req.body;
    await pool.query(
      `UPDATE xin_nghi_phep SET trang_thai = 'Tu_choi', nguoi_duyet = ?, ngay_duyet = NOW() WHERE id = ?`,
      [nguoi_duyet, req.params.id]
    );
    res.json({ message: 'Đã từ chối đơn nghỉ phép' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi từ chối đơn', details: error.message });
  }
});

export default router;