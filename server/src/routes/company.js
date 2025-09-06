// src/routes/company.js
import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// Get all companies
router.get('/', async (req, res) => {
  try {
    const [companies] = await pool.query('SELECT * FROM nhacungcap');
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ 
      error: 'Lỗi khi lấy danh sách nhà cung cấp', 
      details: error.message 
    });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const [company] = await pool.query('SELECT * FROM nhacungcap WHERE MaNCC = ?', [req.params.id]);
    if (company.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhà cung cấp' });
    }
    res.status(200).json(company[0]);
  } catch (error) {
    res.status(500).json({ 
      error: 'Lỗi khi lấy thông tin nhà cung cấp', 
      details: error.message 
    });
  }
});

// Add new company
router.post('/', async (req, res) => {
  try {
    const { MaNCC, TenNCC, SDT, DiaChi, TinhTrang } = req.body;

    // Input validation
    if (!MaNCC || !TenNCC || !SDT || !DiaChi) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc!' });
    }

    // Validate phone number format
    if (!/^\d{10,11}$/.test(SDT)) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ!' });
    }

    const [result] = await pool.query(
      'INSERT INTO nhacungcap (MaNCC, TenNCC, SDT, DiaChi, TinhTrang) VALUES (?, ?, ?, ?, ?)',
      [MaNCC, TenNCC, SDT, DiaChi, TinhTrang || 1]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Không thể thêm nhà cung cấp!' });
    }

    res.status(201).json({ message: 'Thêm nhà cung cấp thành công!', MaNCC });
  } catch (error) {
    console.error('Lỗi khi thêm nhà cung cấp:', error);
    res.status(500).json({ 
      error: 'Lỗi khi thêm nhà cung cấp', 
      details: error.message,
      sqlMessage: error.sqlMessage 
    });
  }
});

// Update company
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { TenNCC, SDT, DiaChi, TinhTrang } = req.body;

    if (!TenNCC || !SDT || !DiaChi) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc!' });
    }

    // Validate phone number format
    if (!/^\d{10,11}$/.test(SDT)) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ!' });
    }

    const [result] = await pool.query(
      'UPDATE nhacungcap SET TenNCC = ?, SDT = ?, DiaChi = ?, TinhTrang = ? WHERE MaNCC = ?',
      [TenNCC, SDT, DiaChi, TinhTrang, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhà cung cấp để cập nhật!' });
    }

    res.status(200).json({ message: 'Cập nhật nhà cung cấp thành công!', MaNCC: id });
  } catch (error) {
    console.error('Lỗi khi cập nhật nhà cung cấp:', error);
    res.status(500).json({ 
      error: 'Lỗi khi cập nhật nhà cung cấp', 
      details: error.message,
      sqlMessage: error.sqlMessage
    });
  }
});

// Delete company
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM nhacungcap WHERE MaNCC = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhà cung cấp để xóa!' });
    }

    res.status(200).json({ message: 'Xóa nhà cung cấp thành công!', MaNCC: id });
  } catch (error) {
    console.error('Lỗi khi xóa nhà cung cấp:', error);
    res.status(500).json({ 
      error: 'Lỗi khi xóa nhà cung cấp', 
      details: error.message,
      sqlMessage: error.sqlMessage
    });
  }
});

// Search companies
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    let results;

    if (!keyword) {
      [results] = await pool.query('SELECT * FROM nhacungcap');
    } else {
      const searchTerm = `%${keyword}%`;
      [results] = await pool.query(
        `SELECT * FROM nhacungcap 
         WHERE MaNCC LIKE ? OR TenNCC LIKE ? OR SDT LIKE ? OR DiaChi LIKE ?`,
        [searchTerm, searchTerm, searchTerm, searchTerm]
      );
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Lỗi khi tìm kiếm nhà cung cấp:', error);
    res.status(500).json({ 
      error: 'Lỗi khi tìm kiếm nhà cung cấp', 
      details: error.message 
    });
  }
});

export default router;