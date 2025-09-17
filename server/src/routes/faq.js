import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// GET: Lấy tất cả FAQ hoặc lọc theo danh mục/từ khóa
router.get('/faq', async (req, res) => {
  try {
    const { category, keyword } = req.query;
    let query = 'SELECT * FROM faqs';
    const queryParams = [];

    if (category) {
      query += ' WHERE category = ?';
      queryParams.push(category);
    } else if (keyword) {
      // Tách từ khóa từ câu hỏi (split theo khoảng trắng)
      const keywordsFromQuery = keyword.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      
      if (keywordsFromQuery.length === 0) {
        return res.json({ faqs: [] });
      }

      // Xây dựng query động để tìm khớp bất kỳ từ khóa nào
      // Tìm trong question (LIKE cho từng từ)
      let whereClause = ' WHERE (';
      keywordsFromQuery.forEach((word, index) => {
        if (index > 0) whereClause += ' OR ';
        whereClause += `LOWER(question) LIKE ?`;
        queryParams.push(`%${word}%`);
      });
      whereClause += ')';

      // Tìm trong keywords (parse JSON và kiểm tra từng từ)
      whereClause += ' OR (';
      keywordsFromQuery.forEach((word, index) => {
        if (index > 0) whereClause += ' OR ';
        whereClause += `LOWER(keywords) LIKE ?`;
        queryParams.push(`%"${word}"%`);  // Tìm từ khóa trong JSON string, ví dụ: "%\"mua sách\"%"
      });
      whereClause += ')';

      query += whereClause;
    }

    console.log('FAQ Query:', query, 'Params:', queryParams);  // Debug log

    const [faqs] = await pool.query(query, queryParams);
    res.json({ faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Lỗi khi lấy FAQ' });
  }
});

// POST: Thêm FAQ mới (dành cho admin, cần xác thực)
router.post('/faq', async (req, res) => {
  const { question, answer, category, keywords } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'Vui lòng cung cấp câu hỏi và câu trả lời' });
  }

  try {
    await pool.query(
      'INSERT INTO faqs (question, answer, category, keywords) VALUES (?, ?, ?, ?)',
      [question, answer, category || null, keywords ? JSON.stringify(keywords) : null]
    );
    res.status(201).json({ message: 'FAQ đã được thêm' });
  } catch (error) {
    console.error('Error adding FAQ:', error);
    res.status(500).json({ error: 'Lỗi khi thêm FAQ' });
  }
});

// PUT: Cập nhật FAQ (dành cho admin)
router.put('/faq/:id', async (req, res) => {
  const { id } = req.params;
  const { question, answer, category, keywords } = req.body;

  try {
    await pool.query(
      'UPDATE faqs SET question = ?, answer = ?, category = ?, keywords = ? WHERE id = ?',
      [question, answer, category || null, keywords ? JSON.stringify(keywords) : null, id]
    );
    res.json({ message: 'FAQ đã được cập nhật' });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật FAQ' });
  }
});

// DELETE: Xóa FAQ (dành cho admin)
router.delete('/faq/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM faqs WHERE id = ?', [id]);
    res.json({ message: 'FAQ đã được xóa' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Lỗi khi xóa FAQ' });
  }
});

export default router;