import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// ✅ API lấy danh sách thể loại
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM theloai');
    res.status(200).json(categories); // ← Trả mảng trực tiếp
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách thể loại', details: error.message });
  }
});

// ✅ API lấy 1 thể loại theo MaTL
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM theloai WHERE MaTL = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Thể loại không tồn tại' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy thể loại', details: error.message });
  }
});

// ✅ API thêm thể loại
router.post('/', async (req, res) => {
  const { TenTL, TinhTrang = 1 } = req.body;
  if (!TenTL) {
    return res.status(400).json({ error: 'Tên thể loại là bắt buộc' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO theloai (TenTL, TinhTrang) VALUES (?, ?)',
      [TenTL, TinhTrang]
    );
    res.status(201).json({ message: 'Thêm thể loại thành công!', MaTL: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm thể loại', details: error.message });
  }
});

// ✅ API cập nhật thể loại
// ✅ API cập nhật thể loại
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { TenTL, TinhTrang } = req.body;

  // Kiểm tra nếu không có trường nào được cung cấp
  if (TenTL === undefined && TinhTrang === undefined) {
    return res.status(400).json({ error: 'Cần cung cấp ít nhất Tên thể loại hoặc Trạng thái để cập nhật' });
  }

  try {
    // Lấy thông tin hiện tại
    const [current] = await pool.query('SELECT TenTL, TinhTrang FROM theloai WHERE MaTL = ?', [id]);
    
    if (current.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy thể loại' });
    }

    const currentData = current[0];
    
    // Xác định giá trị mới (nếu không có thì giữ nguyên giá trị cũ)
    const finalTenTL = TenTL !== undefined ? TenTL : currentData.TenTL;
    const finalTinhTrang = TinhTrang !== undefined ? TinhTrang : currentData.TinhTrang;

    // Kiểm tra xem có thay đổi không
    if (finalTenTL === currentData.TenTL && finalTinhTrang === currentData.TinhTrang) {
      return res.status(200).json({ message: 'Không có thay đổi nào' });
    }

    // Thực hiện cập nhật
    await pool.query(
      'UPDATE theloai SET TenTL = ?, TinhTrang = ? WHERE MaTL = ?',
      [finalTenTL, finalTinhTrang, id]
    );

    res.status(200).json({ message: 'Cập nhật thành công!' });
  } catch (error) {
    console.error('Lỗi khi cập nhật:', error);
    res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});

// ✅ API xóa thể loại
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM theloai WHERE MaTL = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy thể loại để xóa' });
    }
    res.status(200).json({ message: 'Xóa thể loại thành công!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa thể loại', details: error.message });
  }
});

export default router;
