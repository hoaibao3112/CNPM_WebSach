// permissionRoutes.js
import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// Thêm quyền
router.post('/permissions', async (req, res) => {
  try {
    const { MaQuyen, MaCN, HanhDong, TinhTrang } = req.body;

    const [result] = await pool.query(
      `INSERT INTO chitietquyen (MaQuyen, MaCN, HanhDong, TinhTrang) 
       VALUES (?, ?, ?, ?)`,
      [MaQuyen, MaCN, HanhDong, TinhTrang]
    );

    res.status(201).json({ message: 'Thêm quyền thành công', MaCTQ: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Sửa quyền
router.put('/permissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { MaQuyen, MaCN, HanhDong, TinhTrang } = req.body;

    const [result] = await pool.query(
      `UPDATE chitietquyen 
       SET MaQuyen = ?, MaCN = ?, HanhDong = ?, TinhTrang = ?
       WHERE MaCTQ = ?`,
      [MaQuyen, MaCN, HanhDong, TinhTrang, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy quyền để cập nhật' });
    }

    res.json({ message: 'Cập nhật quyền thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Xóa quyền
router.delete('/permissions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM chitietquyen WHERE MaCTQ = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy quyền để xóa' });
    }

    res.json({ message: 'Xóa quyền thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Tìm kiếm quyền
router.get('/permissions', async (req, res) => {
  try {
    const { keyword } = req.query; // tìm kiếm theo HanhDong hoặc TenNQ

    let query = `
      SELECT ctq.*, nq.TenNQ, cn.TenCN
      FROM chitietquyen ctq
      LEFT JOIN nhomquyen nq ON ctq.MaQuyen = nq.MaNQ
      LEFT JOIN chucnang cn ON ctq.MaCN = cn.MaCN
      WHERE 1=1
    `;

    const params = [];

    if (keyword) {
      query += ` AND (ctq.HanhDong LIKE ? OR nq.TenNQ LIKE ? OR cn.TenCN LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const [permissions] = await pool.query(query, params);

    res.json(permissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Hiển thị tất cả quyền
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
    res.status(500).json({ error: 'Lỗi server' });
  }
});
// Thêm API lấy danh sách nhóm quyền (roles)
router.get('/roles', async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT * FROM nhomquyen');
    res.json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Thêm API lấy danh sách chức năng (features)
router.get('/features', async (req, res) => {
  try {
    const [features] = await pool.query('SELECT * FROM chucnang');
    res.json(features);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});
export default router;
