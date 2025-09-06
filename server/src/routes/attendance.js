import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { MaTK, thang, nam } = req.query;
    let sql = 'SELECT * FROM cham_cong WHERE 1=1';
    const params = [];
    if (MaTK) {
      sql += ' AND MaTK = ?';
      params.push(MaTK);
    }
    if (thang) {
      sql += ' AND MONTH(ngay) = ?';
      params.push(thang);
    }
    if (nam) {
      sql += ' AND YEAR(ngay) = ?';
      params.push(nam);
    }
    sql += ' ORDER BY ngay DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách chấm công', details: error.message });
  }
});

// Chấm công (thêm mới)
router.post('/', async (req, res) => {
  try {
    const { MaTK, ngay, gio_vao, gio_ra, trang_thai, ghi_chu } = req.body;
    if (!MaTK || !ngay) {
      return res.status(400).json({ error: 'Thiếu mã tài khoản hoặc ngày!' });
    }

    // Kiểm tra đã chấm công ngày này chưa
    const [rows] = await pool.query(
      'SELECT id FROM cham_cong WHERE MaTK = ? AND ngay = ?',
      [MaTK, ngay]
    );
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Bạn đã chấm công hôm nay rồi!' });
    }

    await pool.query(
      `INSERT INTO cham_cong (MaTK, ngay, gio_vao, gio_ra, trang_thai, ghi_chu)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [MaTK, ngay, gio_vao || null, gio_ra || null, trang_thai || 'Di_lam', ghi_chu || null]
    );
    res.json({ message: 'Chấm công thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi chấm công', details: error.message });
  }
});

// Sửa chấm công
router.put('/:id', async (req, res) => {
  try {
    const { gio_vao, gio_ra, trang_thai, ghi_chu } = req.body;
    await pool.query(
      `UPDATE cham_cong SET gio_vao=?, gio_ra=?, trang_thai=?, ghi_chu=? WHERE id=?`,
      [gio_vao, gio_ra, trang_thai, ghi_chu, req.params.id]
    );
    res.json({ message: 'Cập nhật chấm công thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật chấm công', details: error.message });
  }
});

// Xóa chấm công
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cham_cong WHERE id=?', [req.params.id]);
    res.json({ message: 'Xóa chấm công thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa chấm công', details: error.message });
  }
});

// Lấy tổng số ngày công theo tháng của một tài khoản
router.get('/summary/:MaTK/:nam', async (req, res) => {
  try {
    const { MaTK, nam } = req.params;
    const [rows] = await pool.query(
      `SELECT 
          MONTH(ngay) AS thang, 
          COUNT(*) AS so_ngay_lam
        FROM cham_cong
        WHERE MaTK = ? AND YEAR(ngay) = ? AND trang_thai = 'Di_lam'
        GROUP BY thang
        ORDER BY thang`
      , [MaTK, nam]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy tổng ngày công', details: error.message });
  }
});

// Lấy chi tiết chấm công của 1 tài khoản theo tháng/năm
router.get('/detail/:MaTK/:thang/:nam', async (req, res) => {
  try {
    const { MaTK, thang, nam } = req.params;
    const [rows] = await pool.query(
      `SELECT ngay, trang_thai
       FROM cham_cong
       WHERE MaTK = ? AND MONTH(ngay) = ? AND YEAR(ngay) = ?
       ORDER BY ngay`,
      [MaTK, thang, nam]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết chấm công', details: error.message });
  }
});

export default router;