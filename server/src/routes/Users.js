// src/routes/userRoutes.js
import express from 'express';
import pool from '../config/connectDatabase.js';
import { authenticateToken } from '../utils/generateToken.js'; // Điều chỉnh đường dẫn nếu cần
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM nhanvien');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách nhân viên', details: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const [user] = await pool.query('SELECT * FROM nhanvien WHERE MaNV = ?', [req.params.id]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    }
    res.status(200).json(user[0]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy thông tin nhân viên', details: error.message });
  }
});

// Add new user
router.post('/', async (req, res) => {
  try {
    const { MaNV, TenNV, SDT, GioiTinh, DiaChi, Email, TinhTrang } = req.body;

    // Input validation
    if (!MaNV || !TenNV || !SDT || !Email) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc!' });
    }

    // Validate phone number format
    if (!/^\d{10,11}$/.test(SDT)) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ!' });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) {
      return res.status(400).json({ error: 'Email không hợp lệ!' });
    }

    const [result] = await pool.query(
      'INSERT INTO nhanvien (MaNV, TenNV, SDT, GioiTinh, DiaChi, Email, TinhTrang) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [MaNV, TenNV, SDT, GioiTinh, DiaChi, Email, TinhTrang]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Không thể thêm nhân viên!' });
    }

    res.status(201).json({ message: 'Thêm nhân viên thành công!', MaNV });
  } catch (error) {
    console.error('Lỗi khi thêm nhân viên:', error);
    res.status(500).json({ 
      error: 'Lỗi khi thêm nhân viên', 
      details: error.message,
      sqlMessage: error.sqlMessage 
    });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { TenNV, SDT, GioiTinh, DiaChi, Email, TinhTrang } = req.body;

    if (!TenNV || !SDT || !Email) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc!' });
    }

    // Validate phone number format
    if (!/^\d{10,11}$/.test(SDT)) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ!' });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) {
      return res.status(400).json({ error: 'Email không hợp lệ!' });
    }

    const [result] = await pool.query(
      'UPDATE nhanvien SET TenNV = ?, SDT = ?, GioiTinh = ?, DiaChi = ?, Email = ?, TinhTrang = ? WHERE MaNV = ?',
      [TenNV, SDT, GioiTinh, DiaChi, Email, TinhTrang, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên để cập nhật!' });
    }

    res.status(200).json({ message: 'Cập nhật nhân viên thành công!', MaNV: id });
  } catch (error) {
    console.error('Lỗi khi cập nhật nhân viên:', error);
    res.status(500).json({ 
      error: 'Lỗi khi cập nhật nhân viên', 
      details: error.message,
      sqlMessage: error.sqlMessage
    });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM nhanvien WHERE MaNV = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên để xóa!' });
    }

    res.status(200).json({ message: 'Xóa nhân viên thành công!', MaNV: id });
  } catch (error) {
    console.error('Lỗi khi xóa nhân viên:', error);
    res.status(500).json({ 
      error: 'Lỗi khi xóa nhân viên', 
      details: error.message,
      sqlMessage: error.sqlMessage
    });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    let results;

    if (!keyword) {
      [results] = await pool.query('SELECT * FROM nhanvien');
    } else {
      const searchTerm = `%${keyword}%`;
      [results] = await pool.query(
        `SELECT * FROM nhanvien 
         WHERE MaNV LIKE ? OR TenNV LIKE ? OR Email LIKE ? OR SDT LIKE ?`,
        [searchTerm, searchTerm, searchTerm, searchTerm]
      );
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Lỗi khi tìm kiếm nhân viên:', error);
    res.status(500).json({ error: 'Lỗi khi tìm kiếm nhân viên', details: error.message });
  }
});
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const maQuyen = req.user.MaQuyen; // Lấy từ token (giả định middleware authenticateToken cung cấp)
    const [permissions] = await pool.query(
      `SELECT ctq.*, cn.TenCN 
       FROM chitietquyen ctq 
       JOIN chucnang cn ON ctq.MaCN = cn.MaCN 
       WHERE ctq.MaQuyen = ? AND CAST(ctq.TinhTrang AS UNSIGNED) = 1`,
      [maQuyen]
    );
    res.json({
      success: true,
      data: permissions.map(p => ({
        MaCN: p.MaCN,
        TenCN: p.TenCN,
        HanhDong: p.HanhDong
      }))
    });
  } catch (error) {
    console.error('Lỗi khi lấy quyền người dùng:', error);
    res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});
// Get authenticated user's account and personal info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const maTK = req.user.MaTK; // Extract MaTK from token
    const [userInfo] = await pool.query(
      `SELECT tk.*, nv.TenNV, nv.SDT, nv.GioiTinh, nv.DiaChi, nv.Email, nq.TenNQ
       FROM taikhoan tk
       LEFT JOIN nhanvien nv ON tk.MaTK = nv.MaNV
       LEFT JOIN nhomquyen nq ON tk.MaQuyen = nq.MaNQ
       WHERE tk.MaTK = ?`,
      [maTK]
    );

    if (userInfo.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin người dùng' });
    }

    res.status(200).json(userInfo[0]);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});
// Get account and employee info by MaTK
router.get('/by-matk/:maTK', authenticateToken, async (req, res) => {
  try {
    const { maTK } = req.params;
    // Ensure the authenticated user can only access their own data
    if (req.user.MaTK !== parseInt(maTK)) {
      return res.status(403).json({ error: 'Không có quyền truy cập thông tin này' });
    }

    const [userInfo] = await pool.query(
      `SELECT tk.MaTK, tk.TenTK, tk.MaQuyen, tk.NgayTao, tk.TinhTrang, 
              nv.MaNV, nv.TenNV, nv.SDT, nv.GioiTinh, nv.DiaChi, nv.Email, nq.TenNQ
       FROM taikhoan tk
       LEFT JOIN nhanvien nv ON tk.MaTK = nv.MaNV
       LEFT JOIN nhomquyen nq ON tk.MaQuyen = nq.MaNQ
       WHERE tk.MaTK = ?`,
      [maTK]
    );

    if (userInfo.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản' });
    }

    res.status(200).json(userInfo[0]);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin tài khoản và nhân viên:', error);
    res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});
router.put('/change-password', authenticateToken, async (req, res) => {
    console.log('BODY:', req.body);
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.MaTK; // Sửa lại đúng trường

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' });
    }

    // Lấy thông tin tài khoản hiện tại
    const [accounts] = await pool.query('SELECT * FROM taikhoan WHERE MaTK = ?', [userId]);
    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    const account = accounts[0];

    // Kiểm tra mật khẩu cũ
    if (account.MatKhau !== oldPassword) {
      return res.status(400).json({ error: 'Mật khẩu cũ không đúng' });
    }

    // Cập nhật mật khẩu mới
    await pool.query('UPDATE taikhoan SET MatKhau = ? WHERE MaTK = ?', [newPassword, userId]);
    res.status(200).json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi đổi mật khẩu', details: error.message });
  }
});
export default router;