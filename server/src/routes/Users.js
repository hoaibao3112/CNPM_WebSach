// src/routes/userRoutes.js
import express from 'express';
import pool from '../config/connectDatabase.js';
import { authenticateToken } from '../utils/generateToken.js'; // Điều chỉnh đường dẫn nếu cần
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const router = express.Router();

// Setup upload directory and multer
const uploadDir = path.join(process.cwd(), 'uploads', 'nhanvien');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.warn('Could not create upload directory:', err.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif)$/i;
    if (!allowed.test(path.extname(file.originalname))) return cb(new Error('Chỉ cho phép ảnh (jpg, jpeg, png, gif)'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Ensure the image column exists (MySQL 8+ supports IF NOT EXISTS)
(async () => {
  try {
    await pool.query("ALTER TABLE nhanvien ADD COLUMN IF NOT EXISTS Anh VARCHAR(255) NULL");
  } catch (err) {
    console.warn('Could not ensure Anh column exists (ignore if older MySQL):', err.message);
  }
})();

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
router.post('/', upload.single('Anh'), async (req, res) => {
  try {
    const { MaNV, TenNV, SDT, GioiTinh, DiaChi, Email, TinhTrang } = req.body;
    const imagePath = req.file ? `/uploads/nhanvien/${req.file.filename}` : null;

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
      'INSERT INTO nhanvien (MaNV, TenNV, SDT, GioiTinh, DiaChi, Email, TinhTrang, Anh) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [MaNV, TenNV, SDT, GioiTinh, DiaChi, Email, TinhTrang, imagePath]
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

// Update user (allow partial updates; image-only updates supported)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // accept multipart/form-data for image uploads
    if (!req.file && req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/')) {
      await new Promise((resolve, reject) => {
        upload.single('Anh')(req, res, (err) => (err ? reject(err) : resolve()));
      });
    }

    const { TenNV, SDT, GioiTinh, DiaChi, Email, TinhTrang } = req.body;
    const imagePath = req.file ? `/uploads/nhanvien/${req.file.filename}` : null;

    // fetch existing row
    const [rows] = await pool.query('SELECT * FROM nhanvien WHERE MaNV = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy nhân viên để cập nhật!' });
    const existing = rows[0];

    // Merge values - if a field is not provided, keep existing
    const newTenNV = (typeof TenNV !== 'undefined' && TenNV !== null && TenNV !== '') ? TenNV : existing.TenNV;
    const newSDT = (typeof SDT !== 'undefined' && SDT !== null && SDT !== '') ? SDT : existing.SDT;
    const newGioiTinh = (typeof GioiTinh !== 'undefined' && GioiTinh !== null && GioiTinh !== '') ? GioiTinh : existing.GioiTinh;
    const newDiaChi = (typeof DiaChi !== 'undefined' && DiaChi !== null && DiaChi !== '') ? DiaChi : existing.DiaChi;
    const newEmail = (typeof Email !== 'undefined' && Email !== null && Email !== '') ? Email : existing.Email;
    const newTinhTrang = (typeof TinhTrang !== 'undefined' && TinhTrang !== null && TinhTrang !== '') ? TinhTrang : existing.TinhTrang;
    const newAnh = imagePath || existing.Anh;

    // Validate only if fields were provided (or are going to be updated)
    if (typeof SDT !== 'undefined' && SDT !== null && SDT !== '') {
      if (!/^\d{10,11}$/.test(newSDT)) {
        return res.status(400).json({ error: 'Số điện thoại không hợp lệ!' });
      }
    }
    if (typeof Email !== 'undefined' && Email !== null && Email !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return res.status(400).json({ error: 'Email không hợp lệ!' });
      }
    }

    const [result] = await pool.query(
      'UPDATE nhanvien SET TenNV = ?, SDT = ?, GioiTinh = ?, DiaChi = ?, Email = ?, TinhTrang = ?, Anh = ? WHERE MaNV = ?',
      [newTenNV, newSDT, newGioiTinh, newDiaChi, newEmail, newTinhTrang, newAnh, id]
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
    // First get existing image path so we can remove the file from disk
    const [rows] = await pool.query('SELECT Anh FROM nhanvien WHERE MaNV = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy nhân viên để xóa!' });

    const image = rows[0].Anh;
    // Delete DB record
    const [result] = await pool.query('DELETE FROM nhanvien WHERE MaNV = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên để xóa!' });
    }

    // Remove image file if exists and stored as an uploads path
    if (image) {
      try {
        // image is expected like /uploads/nhanvien/filename
        const imgPath = image.startsWith('/') ? path.join(process.cwd(), image) : path.join(process.cwd(), 'uploads', 'nhanvien', path.basename(image));
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      } catch (err) {
        console.warn('Failed to remove image file for deleted user:', err.message);
      }
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
      `SELECT tk.*, nv.TenNV, nv.SDT, nv.GioiTinh, nv.DiaChi, nv.Email, nv.Anh, nq.TenNQ
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
              nv.MaNV, nv.TenNV, nv.SDT, nv.GioiTinh, nv.DiaChi, nv.Email, nv.Anh, nq.TenNQ
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