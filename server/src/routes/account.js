import express from 'express';
import pool from '../config/connectDatabase.js';
import { authenticateToken } from '../utils/generateToken.js';
const router = express.Router();

// account.js
router.get('/', async (req, res) => {
  try {
    const [accounts] = await pool.query('SELECT * FROM taikhoan');
    const formatted = accounts.map(acc => ({
      ...acc,
      TinhTrang: Buffer.isBuffer(acc.TinhTrang) ? acc.TinhTrang[0] : acc.TinhTrang
    }));
    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách tài khoản', details: error.message });
  }
});



// API lấy tài khoản theo ID
router.get('/:id', async (req, res) => {
  try {
    const [account] = await pool.query('SELECT * FROM taikhoan WHERE MaTK = ?', [req.params.id]);
    if (account.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }
    res.status(200).json(account[0]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy tài khoản', details: error.message });
  }
});

// API thêm mới tài khoản
router.post('/', async (req, res) => {
  try {
    const { TenTK, MatKhau, MaQuyen, NgayTao, TinhTrang } = req.body;
    if (!TenTK || !MatKhau || !MaQuyen || !NgayTao) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin' });
    }

    // Kiểm tra MaQuyen có tồn tại trong nhomquyen
    const [quyenCheck] = await pool.query('SELECT MaNQ FROM nhomquyen WHERE MaNQ = ? AND TinhTrang = 1', [MaQuyen]);
    if (quyenCheck.length === 0) {
      return res.status(400).json({ error: 'Quyền không hợp lệ hoặc đã bị vô hiệu hóa' });
    }

    const result = await pool.query(
      'INSERT INTO taikhoan (TenTK, MatKhau, MaQuyen, NgayTao, TinhTrang) VALUES (?, ?, ?, ?, ?)',
      [TenTK, MatKhau, MaQuyen, NgayTao, TinhTrang ? 1 : 0]
    );
    res.status(201).json({ message: 'Thêm tài khoản thành công', MaTK: result[0].insertId });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm tài khoản', details: error.message });
  }
});

// API sửa tài khoản
router.put('/:id', async (req, res) => {
  try {
    const { TenTK, MatKhau, MaQuyen, TinhTrang } = req.body;
    if (!TenTK || !MatKhau || !MaQuyen) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin' });
    }

    // Kiểm tra MaQuyen có tồn tại trong nhomquyen
    const [quyenCheck] = await pool.query('SELECT MaNQ FROM nhomquyen WHERE MaNQ = ? AND TinhTrang = 1', [MaQuyen]);
    if (quyenCheck.length === 0) {
      return res.status(400).json({ error: 'Quyền không hợp lệ hoặc đã bị vô hiệu hóa' });
    }

    const tinhTrangValue = TinhTrang === 1 || TinhTrang === true ? 1 : 0;
    const result = await pool.query(
      'UPDATE taikhoan SET TenTK = ?, MatKhau = ?, MaQuyen = ?, TinhTrang = ? WHERE MaTK = ?',
      [TenTK, MatKhau, MaQuyen, tinhTrangValue, req.params.id]
    );
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản để cập nhật' });
    }
    res.status(200).json({ message: 'Cập nhật tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật tài khoản', details: error.message });
  }
});

// API xóa tài khoản
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM taikhoan WHERE MaTK = ?', [req.params.id]);
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản để xóa' });
    }
    res.status(200).json({ message: 'Xóa tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa tài khoản', details: error.message });
  }
});


// API đổi mật khẩu
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId; // Lấy userId từ token

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