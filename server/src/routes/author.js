import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// Validation rules
const validateAuthor = (authorData, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || authorData.tenTG !== undefined) {
    if (!authorData.tenTG?.trim()) {
      errors.push('Tên tác giả là bắt buộc');
    } else if (authorData.tenTG.trim().length > 255) {
      errors.push('Tên tác giả không được vượt quá 255 ký tự');
    }
  }

  if (authorData.quocTich && authorData.quocTich.length > 100) {
    errors.push('Quốc tịch không được vượt quá 100 ký tự');
  }

  if (authorData.anhTG && authorData.anhTG.length > 255) {
    errors.push('Đường dẫn ảnh không được vượt quá 255 ký tự');
  }

  if (authorData.ngaySinh) {
    const date = new Date(authorData.ngaySinh);
    if (isNaN(date.getTime()) || date > new Date()) {
      errors.push('Ngày sinh không hợp lệ');
    }
  }

  return errors;
};

// Get all authors with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const searchTerm = `%${search}%`;

    const [authors] = await pool.query(
      `SELECT * FROM tacgia 
       WHERE tenTG LIKE ? OR quocTich LIKE ?
       ORDER BY MaTG DESC
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM tacgia
       WHERE tenTG LIKE ? OR quocTich LIKE ?`,
      [searchTerm, searchTerm]
    );

    res.status(200).json({
      data: authors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching authors:', error);
    res.status(500).json({ 
      error: 'Lỗi khi lấy danh sách tác giả',
      details: error.message
    });
  }
});

// Get author by ID
router.get('/:id', async (req, res) => {
  try {
    const [[author]] = await pool.query(
      'SELECT * FROM tacgia WHERE MaTG = ?', 
      [req.params.id]
    );

    if (!author) {
      return res.status(404).json({ error: 'Không tìm thấy tác giả' });
    }

    res.status(200).json(author);
  } catch (error) {
    console.error('Error fetching author:', error);
    res.status(500).json({ 
      error: 'Lỗi khi lấy thông tin tác giả',
      details: error.message
    });
  }
});

// Create new author
router.post('/', async (req, res) => {
  try {
    const { tenTG, ngaySinh, quocTich, tieuSu, anhTG } = req.body;

    const validationErrors = validateAuthor(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const [{ insertId }] = await pool.query(
      `INSERT INTO tacgia 
       (tenTG, ngaySinh, quocTich, tieuSu, anhTG) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        tenTG.trim(),
        ngaySinh || null,
        quocTich ? quocTich.trim() : null,
        tieuSu ? tieuSu.trim() : null,
        anhTG ? anhTG.trim() : null
      ]
    );

    const [[newAuthor]] = await pool.query(
      'SELECT * FROM tacgia WHERE MaTG = ?',
      [insertId]
    );

    res.status(201).json({ 
      message: 'Thêm tác giả thành công!',
      data: newAuthor
    });
  } catch (error) {
    console.error('Error creating author:', error);
    res.status(500).json({ 
      error: 'Lỗi khi thêm tác giả',
      details: error.message
    });
  }
});

// Update author
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenTG, ngaySinh, quocTich, tieuSu, anhTG } = req.body;

    // Fetch existing author
    const [[existing]] = await pool.query(
      'SELECT * FROM tacgia WHERE MaTG = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy tác giả' });
    }

    // If no fields are provided, reject the request
    if (!tenTG && !ngaySinh && quocTich === undefined && tieuSu === undefined && anhTG === undefined) {
      return res.status(400).json({ error: 'Phải cung cấp ít nhất một trường để cập nhật' });
    }

    // Validate provided fields
    const validationErrors = validateAuthor({ tenTG, ngaySinh, quocTich, tieuSu, anhTG }, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Build dynamic query
    const fields = [];
    const values = [];

    if (tenTG !== undefined) {
      fields.push('tenTG = ?');
      values.push(tenTG.trim());
    }
    if (ngaySinh !== undefined) {
      fields.push('ngaySinh = ?');
      values.push(ngaySinh || null);
    }
    if (quocTich !== undefined) {
      fields.push('quocTich = ?');
      values.push(quocTich ? quocTich.trim() : null);
    }
    if (tieuSu !== undefined) {
      fields.push('tieuSu = ?');
      values.push(tieuSu ? tieuSu.trim() : null);
    }
    if (anhTG !== undefined) {
      fields.push('anhTG = ?');
      values.push(anhTG ? anhTG.trim() : null);
    }

    values.push(id);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Không có trường hợp lệ để cập nhật' });
    }

    const query = `UPDATE tacgia SET ${fields.join(', ')} WHERE MaTG = ?`;
    await pool.query(query, values);

    const [[updatedAuthor]] = await pool.query(
      'SELECT * FROM tacgia WHERE MaTG = ?',
      [id]
    );

    res.status(200).json({ 
      message: 'Cập nhật tác giả thành công!',
      data: updatedAuthor
    });
  } catch (error) {
    console.error('Error updating author:', error);
    res.status(500).json({ 
      error: 'Lỗi khi cập nhật tác giả',
      details: error.message
    });
  }
});

// Delete author
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [[existing]] = await pool.query(
      'SELECT * FROM tacgia WHERE MaTG = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy tác giả' });
    }

    await pool.query('DELETE FROM tacgia WHERE MaTG = ?', [id]);

    res.status(200).json({ 
      message: 'Xóa tác giả thành công!',
      deletedAuthor: existing
    });
  } catch (error) {
    console.error('Error deleting author:', error);

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'Không thể xóa tác giả',
        details: 'Tác giả đang được tham chiếu trong bảng sản phẩm'
      });
    }

    res.status(500).json({ 
      error: 'Lỗi khi xóa tác giả',
      details: error.message
    });
  }
});

export default router;