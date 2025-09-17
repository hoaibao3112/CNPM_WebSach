// src/routes/company.js
import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// Helper function để convert Buffer fields
const convertBufferFields = (rows) => {
  return rows.map(row => {
    const converted = { ...row };
    if (row.TinhTrang && row.TinhTrang.type === 'Buffer') {
      converted.TinhTrang = row.TinhTrang.data[0].toString(); // Convert Buffer to string '1' or '0'
    }
    return converted;
  });
};

// Helper để kiểm tra MaNCC tồn tại
const checkMaNCCExists = async (maNCC) => {
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM nhacungcap WHERE MaNCC = ?', [maNCC]);
  return rows[0].count > 0;
};

// Get all companies
router.get('/', async (req, res) => {
  try {
    const [companies] = await pool.query('SELECT * FROM nhacungcap');
    const processedCompanies = convertBufferFields(companies);
    res.status(200).json(processedCompanies);
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
    const processedCompany = convertBufferFields([company[0]])[0];
    res.status(200).json(processedCompany);
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

    // Kiểm tra MaNCC tồn tại
    const exists = await checkMaNCCExists(MaNCC);
    if (exists) {
      return res.status(409).json({ error: 'Mã NCC đã tồn tại! Vui lòng chọn mã khác.' });
    }

    // Validate phone number format
    if (!/^\d{10,11}$/.test(SDT)) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ!' });
    }

    // Ensure TinhTrang is number 1 or 0
    const tinhTrangNum = TinhTrang === '1' ? 1 : (TinhTrang === '0' ? 0 : 1);

    const [result] = await pool.query(
      'INSERT INTO nhacungcap (MaNCC, TenNCC, SDT, DiaChi, TinhTrang) VALUES (?, ?, ?, ?, ?)',
      [MaNCC, TenNCC, SDT, DiaChi, tinhTrangNum]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Không thể thêm nhà cung cấp!' });
    }

    res.status(201).json({ message: 'Thêm nhà cung cấp thành công!', MaNCC });
  } catch (error) {
    console.error('Lỗi khi thêm nhà cung cấp:', error);
    // Handle duplicate entry cụ thể
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Mã NCC đã tồn tại! Vui lòng chọn mã khác.' });
    }
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

    // Ensure TinhTrang is number 1 or 0
    const tinhTrangNum = TinhTrang === '1' ? 1 : (TinhTrang === '0' ? 0 : 1);

    const [result] = await pool.query(
      'UPDATE nhacungcap SET TenNCC = ?, SDT = ?, DiaChi = ?, TinhTrang = ? WHERE MaNCC = ?',
      [TenNCC, SDT, DiaChi, tinhTrangNum, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhà cung cấp để cập nhật!' });
    }

    res.status(200).json({ message: 'Cập nhật nhà cung cấp thành công!', MaNCC: id });
  } catch (error) {
    console.error('Lỗi khi cập nhật nhà cung cấp:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Mã NCC đã tồn tại! Vui lòng chọn mã khác.' });
    }
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

// Search companies (API cũ: tìm fuzzy theo keyword trên tất cả trường)
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

    const processedResults = convertBufferFields(results);
    res.status(200).json(processedResults);
  } catch (error) {
    console.error('Lỗi khi tìm kiếm nhà cung cấp:', error);
    res.status(500).json({ 
      error: 'Lỗi khi tìm kiếm nhà cung cấp', 
      details: error.message 
    });
  }
});

// NEW: Advanced search API - Tìm kiếm nâng cao theo từng trường riêng biệt (có thể kết hợp)
router.get('/search/advanced', async (req, res) => {
  try {
    const { ten, ma, sdt, diachi } = req.query;

    // Validation: Phải có ít nhất một param tìm kiếm
    if (!ten && !ma && !sdt && !diachi) {
      return res.status(400).json({ error: 'Vui lòng cung cấp ít nhất một tiêu chí tìm kiếm (ten, ma, sdt, hoặc diachi)!' });
    }

    // Xây dựng dynamic SQL với WHERE conditions (AND giữa các param)
    let query = 'SELECT * FROM nhacungcap WHERE 1=1';
    const params = [];

    if (ten) {
      query += ' AND TenNCC LIKE ?';
      params.push(`%${ten}%`);
    }
    if (ma) {
      query += ' AND MaNCC LIKE ?';
      params.push(`%${ma}%`);
    }
    if (sdt) {
      query += ' AND SDT LIKE ?';
      params.push(`%${sdt}%`);
    }
    if (diachi) {
      query += ' AND DiaChi LIKE ?';
      params.push(`%${diachi}%`);
    }

    const [results] = await pool.query(query, params);
    const processedResults = convertBufferFields(results);

    res.status(200).json({
      message: 'Tìm kiếm thành công!',
      count: processedResults.length,
      data: processedResults
    });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm nâng cao nhà cung cấp:', error);
    res.status(500).json({ 
      error: 'Lỗi khi tìm kiếm nâng cao nhà cung cấp', 
      details: error.message 
    });
  }
});

export default router;