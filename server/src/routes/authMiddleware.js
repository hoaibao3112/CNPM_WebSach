import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// Lấy tất cả quyền (permissions) - bao gồm join với nhomquyen và chucnang
router.get('/', async (req, res) => {
  try {
    const [permissions] = await pool.query(`
      SELECT ctq.*, nq.TenNQ, cn.TenCN
      FROM chitietquyen ctq
      LEFT JOIN nhomquyen nq ON ctq.MaQuyen = nq.MaNQ
      LEFT JOIN chucnang cn ON ctq.MaCN = cn.MaCN
    `);
    res.json(permissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi lấy tất cả quyền' });
  }
});

router.get('/roles/:maQuyen', async (req, res) => {
  try {
    const { maQuyen } = req.params;
    const [permissions] = await pool.query(`
      SELECT ctq.*, nq.TenNQ, cn.TenCN
      FROM chitietquyen ctq
      LEFT JOIN nhomquyen nq ON ctq.MaQuyen = nq.MaNQ
      LEFT JOIN chucnang cn ON ctq.MaCN = cn.MaCN
      WHERE ctq.MaQuyen = ?
    `, [maQuyen]);

    // Xử lý TinhTrang: Nếu null, gán mặc định là 1
    const formattedPermissions = permissions.map(permission => ({
      ...permission,
      TinhTrang: permission.TinhTrang === null ? 1 : Number(permission.TinhTrang)
    }));

    if (formattedPermissions.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy quyền cho nhóm này' });
    }

    res.json(formattedPermissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi lấy quyền theo nhóm' });
  }
});

// Tìm kiếm quyền (theo keyword, có thể lọc theo MaQuyen nếu cần)
router.get('/search', async (req, res) => {
  try {
    const { keyword, maQuyen } = req.query;
    let query = `
      SELECT ctq.*, nq.TenNQ, cn.TenCN
      FROM chitietquyen ctq
      LEFT JOIN nhomquyen nq ON ctq.MaQuyen = nq.MaNQ
      LEFT JOIN chucnang cn ON ctq.MaCN = cn.MaCN
      WHERE 1=1
    `;
    const params = [];

    if (maQuyen) {
      query += ` AND ctq.MaQuyen = ?`;
      params.push(maQuyen);
    }
    if (keyword) {
      query += ` AND (ctq.HanhDong LIKE ? OR nq.TenNQ LIKE ? OR cn.TenCN LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const [permissions] = await pool.query(query, params);
    res.json(permissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi tìm kiếm quyền' });
  }
});

// Thêm quyền mới (cho một nhóm quyền cụ thể)
router.post('/', async (req, res) => {
  try {
    const { MaQuyen, MaCN, HanhDong, TinhTrang } = req.body;
    if (!MaQuyen || !MaCN || !HanhDong) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ MaQuyen, MaCN, HanhDong' });
    }

    const [result] = await pool.query(
      `INSERT INTO chitietquyen (MaQuyen, MaCN, HanhDong, TinhTrang) 
       VALUES (?, ?, ?, ?)`,
      [MaQuyen, MaCN, HanhDong, TinhTrang || 1]
    );

    res.status(201).json({ message: 'Thêm quyền thành công', MaCTQ: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi thêm quyền' });
  }
});

// Sửa quyền
router.put('/:maCTQ', async (req, res) => {
  try {
    const { maCTQ } = req.params;
    const { MaQuyen, MaCN, HanhDong, TinhTrang } = req.body;

    const [result] = await pool.query(
      `UPDATE chitietquyen 
       SET MaQuyen = ?, MaCN = ?, HanhDong = ?, TinhTrang = ?
       WHERE MaCTQ = ?`,
      [MaQuyen, MaCN, HanhDong, TinhTrang, maCTQ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy quyền để cập nhật' });
    }

    res.json({ message: 'Cập nhật quyền thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi sửa quyền' });
  }
});

// Xóa quyền
router.delete('/:maCTQ', async (req, res) => {
  try {
    const { maCTQ } = req.params;

    const [result] = await pool.query(
      `DELETE FROM chitietquyen WHERE MaCTQ = ?`,
      [maCTQ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy quyền để xóa' });
    }

    res.json({ message: 'Xóa quyền thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi xóa quyền' });
  }
});

// Lấy danh sách nhóm quyền (roles)
router.get('/roles', async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM nhomquyen');
    res.json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách nhóm quyền' });
  }
});

// Lấy danh sách chức năng (features)
router.get('/features', async (req, res) => {
  try {
    const [features] = await pool.query('SELECT * FROM chucnang');
    res.json(features);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách chức năng' });
  }
});

export default router;