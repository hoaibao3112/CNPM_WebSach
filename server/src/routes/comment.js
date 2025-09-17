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

// Gửi bình luận mới (hỗ trợ reply - chỉ giữ 1 version này)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { masp, noidung, mabl_cha } = req.body;
    const makh = req.user.makh;  // FIX: Dùng req.user.makh thay vì req.user.userId

    console.log('=== DEBUG POST /comments ===');
    console.log('Debug - makh from req.user:', makh);  // Phải in ra: 19
    console.log('Debug - req.user full:', req.user);   // { makh: '19', userType: 'customer' }
    console.log('Debug - body:', { masp, noidung, mabl_cha });

    // Kiểm tra makh có tồn tại không
    if (!makh) {
      console.error('Error: makh is null/undefined');
      return res.status(400).json({ errors: ['Không xác định được người dùng (makh null)'] });
    }

    // Kiểm tra makh có tồn tại trong DB không
    const [[userExists]] = await pool.query('SELECT makh FROM khachhang WHERE makh = ?', [makh]);
    if (!userExists) {
      return res.status(404).json({ errors: ['Người dùng không tồn tại trong hệ thống'] });
    }

    const validationErrors = validateComment({ noidung });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Kiểm tra nếu là reply thì comment cha có tồn tại không
    if (mabl_cha) {
      const [[parentComment]] = await pool.query(
        `SELECT mabl FROM binhluan WHERE mabl = ? AND masp = ?`,
        [mabl_cha, masp]
      );
      
      if (!parentComment) {
        return res.status(404).json({ errors: ['Bình luận cha không tồn tại'] });
      }
    }

    const [{ insertId }] = await pool.query(
      `INSERT INTO binhluan (makh, masp, noidung, mabl_cha, trangthai) VALUES (?, ?, ?, ?, 'Hiển thị')`,
      [makh, masp, noidung.trim(), mabl_cha || null]
    );

    console.log('Insert success, new mabl:', insertId);

    const [[newComment]] = await pool.query(
      `SELECT bl.*, kh.tenkh, 
              (SELECT COUNT(*) FROM binhluan_like WHERE mabl = bl.mabl) as like_count,
              (SELECT COUNT(*) FROM binhluan WHERE mabl_cha = bl.mabl) as reply_count
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
// Gửi bình luận mới (có hỗ trợ reply)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { masp, noidung, mabl_cha } = req.body;
    const makh = req.user.userId;

    // Kiểm tra makh có tồn tại không
    if (!makh) {
      return res.status(400).json({ errors: ['Không xác định được người dùng'] });
    }

    const validationErrors = validateComment({ noidung });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Kiểm tra nếu là reply thì comment cha có tồn tại không
    if (mabl_cha) {
      const [[parentComment]] = await pool.query(
        `SELECT mabl FROM binhluan WHERE mabl = ? AND masp = ?`,
        [mabl_cha, masp]
      );
      
      if (!parentComment) {
        return res.status(404).json({ errors: ['Bình luận cha không tồn tại'] });
      }
    }

    const [{ insertId }] = await pool.query(
      `INSERT INTO binhluan (makh, masp, noidung, mabl_cha) VALUES (?, ?, ?, ?)`,
      [makh, masp, noidung.trim(), mabl_cha || null]
    );

    const [[newComment]] = await pool.query(
      `SELECT bl.*, kh.tenkh, 
              (SELECT COUNT(*) FROM binhluan_like WHERE mabl = bl.mabl) as like_count,
              (SELECT COUNT(*) FROM binhluan WHERE mabl_cha = bl.mabl) as reply_count
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

// API để like/unlike bình luận
router.post('/:mabl/like', authenticateToken, async (req, res) => {
  try {
    const { mabl } = req.params;
    const makh = req.user.makh;  // FIX: Dùng req.user.makh thay vì req.user.userId

    console.log('Debug - makh:', makh);  // Thêm log để kiểm tra
    console.log('Debug - req.user:', req.user);  // Log toàn bộ req.user

    // Kiểm tra bình luận có tồn tại không
    const [[comment]] = await pool.query(
      `SELECT mabl FROM binhluan WHERE mabl = ?`,
      [mabl]
    );

    if (!comment) {
      return res.status(404).json({ error: 'Bình luận không tồn tại' });
    }

    // Kiểm tra đã like chưa
    const [[existingLike]] = await pool.query(
      `SELECT mabl_like FROM binhluan_like WHERE mabl = ? AND makh = ?`,
      [mabl, makh]
    );

    let action;
    if (existingLike) {
      // Unlike
      await pool.query(
        `DELETE FROM binhluan_like WHERE mabl = ? AND makh = ?`,
        [mabl, makh]
      );
      action = 'unliked';
    } else {
      // Like
      await pool.query(
        `INSERT INTO binhluan_like (mabl, makh) VALUES (?, ?)`,
        [mabl, makh]
      );
      action = 'liked';
    }

    // Lấy số like mới
    const [[{ like_count }]] = await pool.query(
      `SELECT COUNT(*) as like_count FROM binhluan_like WHERE mabl = ?`,
      [mabl]
    );

    res.status(200).json({
      action,
      like_count
    });
  } catch (error) {
    console.error('Lỗi khi like bình luận:', error);
    res.status(500).json({
      error: 'Lỗi khi like bình luận',
      details: error.message
    });
  }
});
// Lấy danh sách bình luận theo sản phẩm (hỗ trợ phân cấp - chỉ giữ 1 version này)
router.get('/product/:masp', async (req, res) => {
  try {
    const { masp } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Lấy comments cha (không phải reply)
    const [comments] = await pool.query(
      `SELECT bl.*, kh.tenkh, 
              (SELECT COUNT(*) FROM binhluan_like WHERE mabl = bl.mabl) as like_count,
              (SELECT COUNT(*) FROM binhluan WHERE mabl_cha = bl.mabl) as reply_count
       FROM binhluan bl 
       JOIN khachhang kh ON bl.makh = kh.makh 
       WHERE bl.masp = ? AND bl.mabl_cha IS NULL AND bl.trangthai = 'Hiển thị' 
       ORDER BY bl.ngaybinhluan DESC 
       LIMIT ? OFFSET ?`,
      [masp, parseInt(limit), parseInt(offset)]
    );

    // Lấy replies cho từng comment
    for (let comment of comments) {
      const [replies] = await pool.query(
        `SELECT bl.*, kh.tenkh,
                (SELECT COUNT(*) FROM binhluan_like WHERE mabl = bl.mabl) as like_count
         FROM binhluan bl 
         JOIN khachhang kh ON bl.makh = kh.makh 
         WHERE bl.mabl_cha = ? AND bl.trangthai = 'Hiển thị' 
         ORDER BY bl.ngaybinhluan ASC`,
        [comment.mabl]
      );
      comment.replies = replies;
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM binhluan 
       WHERE masp = ? AND mabl_cha IS NULL AND trangthai = 'Hiển thị'`,
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