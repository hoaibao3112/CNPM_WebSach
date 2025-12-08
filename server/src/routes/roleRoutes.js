import express from 'express';
import pool from '../config/connectDatabase.js';
import { authenticateToken } from '../utils/generateToken.js'; // Điều chỉnh đường dẫn nếu cần
const router = express.Router();

// Hàm validate hành động
const isValidAction = (action) => ['Đọc', 'Thêm', 'Xóa', 'Sửa'].includes(action);

// API to get list of active functions (chucnang)
router.get('/functions', async (req, res) => {
  try {
    const [functions] = await pool.query('SELECT MaCN, TenCN FROM chucnang WHERE CAST(TinhTrang AS UNSIGNED) = 1');
    res.status(200).json(functions);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chức năng:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách chức năng', details: error.message });
  }
});

// Thêm nhóm quyền
router.post('/', async (req, res) => {
  const { TenNQ, MoTa, chitietquyen } = req.body;

  if (!TenNQ || !Array.isArray(chitietquyen) || chitietquyen.length === 0) {
    return res.status(400).json({ error: 'Tên nhóm quyền và ít nhất một chi tiết quyền là bắt buộc' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Validate từng chi tiết quyền
    for (const { MaCN, HanhDong } of chitietquyen) {
      const [cnExists] = await connection.query(
        'SELECT MaCN FROM chucnang WHERE MaCN = ? AND CAST(TinhTrang AS UNSIGNED) = 1',
        [MaCN]
      );
      if (!cnExists.length || !isValidAction(HanhDong)) {
        await connection.rollback();
        return res.status(400).json({
          error: `Mã chức năng ${MaCN} không hợp lệ hoặc hành động '${HanhDong}' không được hỗ trợ`
        });
      }
    }

    // Thêm nhóm quyền
    const [result] = await connection.query(
      'INSERT INTO nhomquyen (TenNQ, MoTa, TinhTrang) VALUES (?, ?, 1)',
      [TenNQ, MoTa || '']
    );
    const MaQuyen = result.insertId;

    // Thêm chi tiết quyền
    await Promise.all(
      chitietquyen.map(({ MaCN, HanhDong }) =>
        connection.query(
          'INSERT INTO chitietquyen (MaQuyen, MaCN, HanhDong, TinhTrang) VALUES (?, ?, ?, 1)',
          [MaQuyen, MaCN, HanhDong]
        )
      )
    );

    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Thêm nhóm quyền thành công',
      data: { MaQuyen }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi thêm nhóm quyền:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi thêm nhóm quyền',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// Lấy chi tiết nhóm quyền
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [role] = await pool.query(
      'SELECT * FROM nhomquyen WHERE MaNQ = ? AND CAST(TinhTrang AS UNSIGNED) = 1',
      [id]
    );

    if (!role.length) {
      return res.status(404).json({ error: 'Nhóm quyền không tồn tại' });
    }

    const [permissions] = await pool.query(
      `SELECT ctq.*, cn.TenCN 
       FROM chitietquyen ctq 
       JOIN chucnang cn ON ctq.MaCN = cn.MaCN 
       WHERE ctq.MaQuyen = ? AND CAST(ctq.TinhTrang AS UNSIGNED) = 1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...role[0],
        chiTietQuyen: permissions.map(p => ({
          MacTQ: p.MacTQ,
          MaCN: p.MaCN,
          TenCN: p.TenCN,
          HanhDong: p.HanhDong
        }))
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết nhóm quyền:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi lấy chi tiết nhóm quyền',
      details: error.message
    });
  }
});

// Cập nhật nhóm quyền
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { TenNQ, MoTa, chitietquyen } = req.body;
  // Chuyển đổi TinhTrang thành số 0 hoặc 1
  let TinhTrang = req.body.TinhTrang;
  if (TinhTrang === undefined || TinhTrang === null) {
    TinhTrang = 1;
  } else {
    TinhTrang = TinhTrang ? 1 : 0;
  }

  if (!TenNQ || !Array.isArray(chitietquyen) || chitietquyen.length === 0) {
    return res.status(400).json({ error: 'Tên nhóm quyền và ít nhất một chi tiết quyền là bắt buộc' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Validate chi tiết quyền
    for (const { MaCN, HanhDong } of chitietquyen) {
      const [cnExists] = await connection.query(
        'SELECT MaCN FROM chucnang WHERE MaCN = ? AND CAST(TinhTrang AS UNSIGNED) = 1',
        [MaCN]
      );
      if (!cnExists.length || !isValidAction(HanhDong)) {
        await connection.rollback();
        return res.status(400).json({
          error: `Mã chức năng ${MaCN} không hợp lệ hoặc hành động '${HanhDong}' không được hỗ trợ`
        });
      }
    }

    // Cập nhật nhóm quyền
    await connection.query(
      'UPDATE nhomquyen SET TenNQ = ?, MoTa = ?, TinhTrang = ? WHERE MaNQ = ?',
      [TenNQ, MoTa || '', TinhTrang, id]
    );

    // Xóa chi tiết quyền cũ
    await connection.query(
      'UPDATE chitietquyen SET TinhTrang = 0 WHERE MaQuyen = ?',
      [id]
    );

    // Thêm chi tiết quyền mới
    await Promise.all(
      chitietquyen.map(({ MaCN, HanhDong }) =>
        connection.query(
          'INSERT INTO chitietquyen (MaQuyen, MaCN, HanhDong, TinhTrang) VALUES (?, ?, ?, 1)',
          [id, MaCN, HanhDong]
        )
      )
    );

    await connection.commit();
    res.json({
      success: true,
      message: 'Cập nhật nhóm quyền thành công'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi cập nhật nhóm quyền:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi cập nhật nhóm quyền',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// Lấy danh sách nhóm quyền (có phân trang)
router.get('/', async (req, res) => {
  const { page = 1, pageSize = 10, search = '' } = req.query;
  const offset = (page - 1) * pageSize;

  try {
    // Lấy tổng số bản ghi
    const [totalResult] = await pool.query(
      'SELECT COUNT(*) as total FROM nhomquyen WHERE CAST(TinhTrang AS UNSIGNED) = 1 AND TenNQ LIKE ?',
      [`%${search}%`]
    );
    const total = totalResult[0].total;

    // Lấy dữ liệu phân trang
    const [roles] = await pool.query(
      `SELECT nq.*, 
              (SELECT COUNT(*) FROM taikhoan WHERE MaQuyen = nq.MaNQ AND CAST(TinhTrang AS UNSIGNED) = 1) as SoNguoiDung
       FROM nhomquyen nq
       WHERE CAST(nq.TinhTrang AS UNSIGNED) = 1 AND nq.TenNQ LIKE ?
       ORDER BY nq.MaNQ DESC
       LIMIT ? OFFSET ?`,
      [`%${search}%`, parseInt(pageSize), offset]
    );

    res.json({
      success: true,
      data: {
        items: roles,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhóm quyền:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi lấy danh sách nhóm quyền',
      details: error.message
    });
  }
});

// Xóa nhóm quyền (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Kiểm tra xem nhóm quyền có đang được sử dụng bởi tài khoản nào không
    const [accounts] = await connection.query(
      'SELECT COUNT(*) as count FROM taikhoan WHERE MaQuyen = ? AND CAST(TinhTrang AS UNSIGNED) = 1',
      [id]
    );

    if (accounts[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Không thể xóa nhóm quyền đang được sử dụng bởi tài khoản'
      });
    }

    // Thực hiện soft delete
    await connection.query(
      'UPDATE nhomquyen SET TinhTrang = 0 WHERE MaNQ = ?',
      [id]
    );

    // Cập nhật trạng thái các chi tiết quyền liên quan
    await connection.query(
      'UPDATE chitietquyen SET TinhTrang = 0 WHERE MaQuyen = ?',
      [id]
    );

    await connection.commit();
    res.json({
      success: true,
      message: 'Xóa nhóm quyền thành công'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi xóa nhóm quyền:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi xóa nhóm quyền',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// Tìm kiếm nhóm quyền nâng cao
router.get('/search/advanced', async (req, res) => {
  const {
    keyword = '',
    status = 1,
    page = 1,
    pageSize = 10,
    sortField = 'MaNQ',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * pageSize;
  const validSortFields = ['MaNQ', 'TenNQ', 'SoNguoiDung'];
  const validStatus = [0, 1, 'all'];

  // Validate input
  if (!validSortFields.includes(sortField)) {
    return res.status(400).json({
      success: false,
      error: 'Trường sắp xếp không hợp lệ'
    });
  }

  if (!validStatus.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Trạng thái không hợp lệ'
    });
  }

  try {
    // Build base query
    let baseQuery = `
      FROM nhomquyen nq
      LEFT JOIN (
        SELECT MaQuyen, COUNT(*) as SoNguoiDung 
        FROM taikhoan 
        WHERE CAST(TinhTrang AS UNSIGNED) = 1
        GROUP BY MaQuyen
      ) tk ON nq.MaNQ = tk.MaQuyen
      WHERE 1=1
    `;

    // Add conditions
    const queryParams = [];
    if (keyword) {
      baseQuery += ' AND (nq.TenNQ LIKE ? OR nq.MoTa LIKE ?)';
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (status !== 'all') {
      baseQuery += ' AND CAST(nq.TinhTrang AS UNSIGNED) = ?';
      queryParams.push(status);
    }

    // Get total count
    const [totalResult] = await pool.query(
      `SELECT COUNT(*) as total ${baseQuery}`,
      queryParams
    );
    const total = totalResult[0].total;

    // Get data
    const [roles] = await pool.query(
      `SELECT nq.*, IFNULL(tk.SoNguoiDung, 0) as SoNguoiDung 
       ${baseQuery}
       ORDER BY ${sortField} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(pageSize), offset]
    );

    res.json({
      success: true,
      data: {
        items: roles,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm nhóm quyền:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi tìm kiếm nhóm quyền',
      details: error.message
    });
  }
});

// Lấy tất cả nhóm quyền đang hoạt động (dành cho dropdown)
router.get('/list/active', async (req, res) => {
  try {
    const [roles] = await pool.query(
      'SELECT MaNQ, TenNQ FROM nhomquyen WHERE CAST(TinhTrang AS UNSIGNED) = 1 ORDER BY TenNQ'
    );

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhóm quyền active:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi lấy danh sách nhóm quyền',
      details: error.message
    });
  }
});
// phần này để láy 
// Thêm vào roleRoutes.js
router.get('/user/permissions', authenticateToken, async (req, res) => {
  console.log('Endpoint /user/permissions called with MaQuyen:', req.user.MaQuyen);
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
export default router;