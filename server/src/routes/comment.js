import express from 'express';
import pool from '../config/connectDatabase.js';
import { authenticateToken } from '../utils/generateToken.js';

const router = express.Router();

// Quy tắc xác thực bình luận
const validateComment = (commentData) => {
  const errors = [];
  if (!commentData.noidung?.trim()) {
    errors.push('Nội dung bình luận là bắt buộc');
  } else if (commentData.noidung.trim().length > 500) {
    errors.push('Nội dung bình luận không được vượt quá 500 ký tự');
  }
  return errors;
};

// Gửi bình luận mới
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { masp, noidung } = req.body;
    const makh = req.user.userId;

    const validationErrors = validateComment({ noidung });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const [{ insertId }] = await pool.query(
      `INSERT INTO binhluan (makh, masp, noidung) VALUES (?, ?, ?)`,
      [makh, masp, noidung.trim()]
    );

    const [[newComment]] = await pool.query(
      `SELECT bl.*, kh.tenkh 
       FROM binhluan bl 
       JOIN khachhang kh ON bl.makh = kh.makh 
       WHERE bl.mabl = ?`,
      [insertId]
    );

    res.status(201).json({
      message: 'Gửi bình luận thành công!',
      data: newComment
    });
  } catch (error) {
    console.error('Lỗi khi gửi bình luận:', error);
    res.status(500).json({
      error: 'Lỗi khi gửi bình luận',
      details: error.message
    });
  }
});

// Lấy danh sách bình luận theo sản phẩm
router.get('/product/:masp', async (req, res) => {
  try {
    const { masp } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [comments] = await pool.query(
      `SELECT bl.*, kh.tenkh 
       FROM binhluan bl 
       JOIN khachhang kh ON bl.makh = kh.makh 
       WHERE bl.masp = ? AND bl.trangthai = 'Hiển thị' 
       ORDER BY bl.ngaybinhluan DESC 
       LIMIT ? OFFSET ?`,
      [masp, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM binhluan 
       WHERE masp = ? AND trangthai = 'Hiển thị'`,
      [masp]
    );

    res.status(200).json({
      data: comments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy bình luận:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy bình luận',
      details: error.message
    });
  }
});

export default router;