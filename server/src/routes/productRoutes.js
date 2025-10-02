import express from 'express';
import pool from '../config/connectDatabase.js';
import multer from 'multer';
import { authenticateToken } from '../utils/generateToken.js';

const router = express.Router();

// Config multer để lưu file vào thư mục product
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'C:/Users/PC/Desktop/CNPM/server/backend/product/';
    console.log(`📂 Attempting to save file to: ${dir}`);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    console.log(`📄 Filename generated: ${uniqueName}`);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Middleware để log file nhận được
const logFileMiddleware = (req, res, next) => {
  console.log('📤 Received file:', req.file);
  console.log('📋 Request body:', req.body);
  next();
};

// Middleware kiểm tra quyền admin/staff (SỬA ĐỂ CHO PHÉP NV004 VÀ NV007)
const checkAdminPermission = (req, res, next) => {
  console.log('🔍 Checking permissions for user:', req.user);
  
  if (!req.user) {
    return res.status(403).json({ 
      error: 'Không tìm thấy thông tin user trong token.' 
    });
  }
  
  // Lấy identifier từ token (có thể là makh, MaTK, hoặc userId)
  const identifier = req.user.makh || req.user.MaTK || req.user.userId;
  const userType = req.user.userType;
  
  // Danh sách user được phép (bao gồm cả string và number)
  const allowedUsers = ['NV004', 'NV007', '4', '7', 4, 7];
  const allowedTypes = ['admin'];
  
  // Kiểm tra quyền
  const hasUserPermission = allowedUsers.includes(identifier);
  const hasTypePermission = allowedTypes.includes(userType);
  
  console.log('🔍 Permission details:', {
    identifier,
    userType,
    hasUserPermission,
    hasTypePermission,
    fullUser: req.user
  });
  
  if (!hasUserPermission && !hasTypePermission) {
    console.log('❌ Access denied');
    return res.status(403).json({ 
      error: `Không có quyền truy cập. User: ${identifier}, Type: ${userType}`,
      debug: {
        receivedUser: req.user,
        allowedUsers: ['NV004', 'NV007'],
        allowedTypes: ['admin', 'staff']
      }
    });
  }
  
  console.log('✅ Access granted for user:', identifier, 'Type:', userType);
  next();
};

// =============================================================================
// ROUTES KHÔNG CẦN TOKEN (PUBLIC) - GIỮ NGUYÊN
// =============================================================================

// Tim kiem san pham theo ten hoac theo tac gia /search-product?q=keyWordSearch
router.get('/search-product', async (req, res) => {
  const keyWordSearch = req.query.search

  const sql = `
    SELECT sp.*
    FROM SanPham sp
    JOIN TacGia tg ON sp.MaTG = tg.MaTG
    WHERE sp.TenSP LIKE CONCAT('%', ?, '%')
       OR tg.TenTG LIKE CONCAT('%', ?, '%')
    LIMIT 0, 50;
  `;
  try {
    const [results] = await pool.query(sql, [keyWordSearch, keyWordSearch]);
    res.status(200).json(results);
  } catch (err) {
    console.error("Lỗi truy vấn:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Route tìm sản phẩm bằng tên (case-insensitive, partial match)
router.get('/search', async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'Vui lòng cung cấp tên sản phẩm' });
  }
  
  try {
    const [products] = await pool.query(
      `SELECT s.*, m.TenTG AS TacGia 
       FROM sanpham s 
       LEFT JOIN tacgia m ON s.MaTG = m.MaTG 
       WHERE LOWER(s.TenSP) LIKE LOWER(?)`,
      [`%${name}%`]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    res.status(200).json(products[0]);
  } catch (error) {
    console.error('Lỗi search sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi tìm sản phẩm', details: error.message });
  }
});

// Route lấy danh sách tác giả cho dropdown
router.get('/authors', async (req, res) => {
  try {
    const [authors] = await pool.query('SELECT MaTG, TenTG FROM tacgia ORDER BY TenTG');
    res.status(200).json(authors);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tác giả:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách tác giả' });
  }
});

// Route lấy danh sách thể loại cho dropdown  
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT MaTL, TenTL FROM theloai ORDER BY TenTL');
    res.status(200).json(categories);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thể loại:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách thể loại' });
  }
});
// Route lấy danh sách sản phẩm
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT s.*, m.TenTG AS TacGia 
      FROM sanpham s 
      LEFT JOIN tacgia m ON s.MaTG = m.MaTG
    `;
    let params = [];
    let conditions = [];

    if (req.query.MaTL) {
      conditions.push('s.MaTL = ?');
      params.push(req.query.MaTL);
    }

    if (req.query.priceRange) {
      const [minPrice, maxPrice] = req.query.priceRange.split('-').map(Number);
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        conditions.push('s.DonGia BETWEEN ? AND ?');
        params.push(minPrice, maxPrice);
      } else if (!isNaN(minPrice) && req.query.priceRange.includes('200000')) {
        conditions.push('s.DonGia >= ?');
        params.push(minPrice);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const [products] = await pool.query(query, params);
    console.log('Danh sách sản phẩm trả về:', products);
    res.status(200).json(products);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách sản phẩm', details: error.message });
  }
});

// Route lấy sản phẩm theo ID
router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT s.*, m.TenTG AS TacGia 
      FROM sanpham s 
      LEFT JOIN tacgia m ON s.MaTG = m.MaTG 
      WHERE s.MaSP = ?
    `;
    const [product] = await pool.query(query, [req.params.id]);
    res.status(200).json(product[0]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy sản phẩm', details: error.message });
  }
});

// =============================================================================
// ROUTES CẦN TOKEN VÀ QUYỀN ADMIN/STAFF (PROTECTED)
// =============================================================================

// Route thêm sản phẩm - YÊU CẦU TOKEN VÀ QUYỀN ADMIN/STAFF/NV004/NV007
router.post('/', authenticateToken, checkAdminPermission, upload.single('HinhAnh'), logFileMiddleware, async (req, res) => {
  try {
    const { MaTL, TenSP, MaTG, NamXB, TinhTrang, DonGia, SoLuong } = req.body;
    console.log('🔍 User adding product:', req.user);
    console.log('🔍 Raw request body:', req.body);
    console.log('🔍 Received file:', req.file);

    const HinhAnh = req.file ? req.file.filename : null;

    const maTLNumber = parseInt(MaTL);
    const maTGNumber = parseInt(MaTG);
    const tenSPTrimmed = TenSP ? TenSP.trim() : '';

    if (isNaN(maTLNumber) || !tenSPTrimmed) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc (Mã TL, Tên SP)!' });
    }

    const namXBNumber = parseInt(NamXB);
    if (!isNaN(namXBNumber) && (namXBNumber < 1900 || namXBNumber > new Date().getFullYear())) {
      return res.status(400).json({ error: 'Năm xuất bản phải nằm trong khoảng từ 1900 đến năm hiện tại!' });
    }

    if (!isNaN(maTGNumber)) {
      const [existingTacGia] = await pool.query('SELECT MaTG FROM tacgia WHERE MaTG = ?', [maTGNumber]);
      if (existingTacGia.length === 0) {
        return res.status(400).json({ error: `Mã tác giả (MaTG: ${maTGNumber}) không tồn tại trong bảng tacgia!` });
      }
    }

    const tinhTrangValue = TinhTrang === '1' || TinhTrang === 1 ? 1 : 0;
    const donGiaValue = parseFloat(DonGia) || 0;
    const soLuongValue = parseInt(SoLuong) || 0;

    const [result] = await pool.query(
      'INSERT INTO sanpham (MaTL, TenSP, HinhAnh, MaTG, NamXB, TinhTrang, DonGia, SoLuong) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [maTLNumber, tenSPTrimmed, HinhAnh, isNaN(maTGNumber) ? null : maTGNumber, isNaN(namXBNumber) ? null : namXBNumber, tinhTrangValue, donGiaValue, soLuongValue]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Không thể thêm sản phẩm. Vui lòng kiểm tra lại dữ liệu hoặc cơ sở dữ liệu!' });
    }

    res.status(201).json({ 
      message: 'Thêm sản phẩm thành công!', 
      MaSP: result.insertId,
      createdBy: req.user.makh || req.user.MaTK || req.user.userId
    });
  } catch (error) {
    console.error('Lỗi khi thêm sản phẩm:', error.message || error);
    res.status(500).json({ error: 'Lỗi khi thêm sản phẩm', details: error.message || 'Không xác định' });
  }
});

// Route cập nhật sản phẩm - YÊU CẦU TOKEN VÀ QUYỀN ADMIN/STAFF/NV004/NV007
router.put('/:id', authenticateToken, checkAdminPermission, upload.single('HinhAnh'), async (req, res) => {
  try {
    const { id } = req.params;
    const { MaTL, TenSP, MaTG, NamXB, TinhTrang, DonGia, SoLuong } = req.body;
    const HinhAnh = req.file ? req.file.filename : undefined;

    console.log('🔄 User updating product:', req.user);

    const maTLNumber = parseInt(MaTL);
    const maTGNumber = parseInt(MaTG);
    const tenSPTrimmed = TenSP ? TenSP.trim() : '';

    if (isNaN(maTLNumber) || !tenSPTrimmed) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc (Mã TL, Tên SP)!' });
    }

    const namXBNumber = parseInt(NamXB);
    if (!isNaN(namXBNumber) && (namXBNumber < 1900 || namXBNumber > new Date().getFullYear())) {
      return res.status(400).json({ error: 'Năm xuất bản phải nằm trong khoảng từ 1900 đến năm hiện tại!' });
    }

    if (!isNaN(maTGNumber)) {
      const [existingTacGia] = await pool.query('SELECT MaTG FROM tacgia WHERE MaTG = ?', [maTGNumber]);
      if (existingTacGia.length === 0) {
        return res.status(400).json({ error: `Mã tác giả (MaTG: ${maTGNumber}) không tồn tại trong bảng tacgia!` });
      }
    }

    const tinhTrangValue = TinhTrang === '1' || TinhTrang === 1 ? 1 : 0;
    const donGiaValue = parseFloat(DonGia) || 0;
    const soLuongValue = parseInt(SoLuong) || 0;

    let updateQuery = 'UPDATE sanpham SET MaTL = ?, TenSP = ?';
    const updateParams = [maTLNumber, tenSPTrimmed];

    if (HinhAnh !== undefined) {
      updateQuery += ', HinhAnh = ?';
      updateParams.push(HinhAnh);
    }

    if (isNaN(maTGNumber)) {
      updateQuery += ', MaTG = NULL';
    } else {
      updateQuery += ', MaTG = ?';
      updateParams.push(maTGNumber);
    }

    if (isNaN(namXBNumber)) {
      updateQuery += ', NamXB = NULL';
    } else {
      updateQuery += ', NamXB = ?';
      updateParams.push(namXBNumber);
    }

    updateQuery += ', TinhTrang = ?, DonGia = ?, SoLuong = ? WHERE MaSP = ?';
    updateParams.push(tinhTrangValue, donGiaValue, soLuongValue, id);

    const [result] = await pool.query(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc không có thay đổi!' });
    }

    res.status(200).json({ 
      message: 'Cập nhật sản phẩm thành công!',
      updatedBy: req.user.makh || req.user.MaTK || req.user.userId
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error.message || error);
    res.status(500).json({ error: 'Lỗi khi cập nhật sản phẩm', details: error.message || 'Không xác định' });
  }
});

// Route xóa sản phẩm - YÊU CẦU TOKEN VÀ QUYỀN ADMIN/STAFF/NV004/NV007
router.delete('/:id', authenticateToken, checkAdminPermission, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ User deleting product:', req.user);

    // Kiểm tra sản phẩm tồn tại trước khi xóa
    const [existingProduct] = await pool.query('SELECT MaSP, TenSP FROM sanpham WHERE MaSP = ?', [id]);
    
    if (existingProduct.length === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại!' });
    }

    const [result] = await pool.query('DELETE FROM sanpham WHERE MaSP = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Không thể xóa sản phẩm!' });
    }

    res.status(200).json({ 
      message: `Xóa sản phẩm "${existingProduct[0].TenSP}" thành công!`,
      deletedBy: req.user.makh || req.user.MaTK || req.user.userId,
      deletedProduct: existingProduct[0]
    });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    
    // Kiểm tra lỗi foreign key constraint
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'Không thể xóa sản phẩm này vì đang được sử dụng trong đơn hàng hoặc bảng khác!',
        details: 'Vui lòng xóa các tham chiếu trước khi xóa sản phẩm.'
      });
    }
    
    res.status(500).json({ error: 'Lỗi khi xóa sản phẩm', details: error.message });
  }
});
// Route cập nhật trạng thái hàng loạt - YÊU CẦU TOKEN VÀ QUYỀN ADMIN
router.patch('/bulk-update-status', authenticateToken, checkAdminPermission, async (req, res) => {
  try {
    const { status, productIds } = req.body;
    
    console.log('🔄 User bulk updating status:', req.user);
    console.log('📋 Update data:', { status, productIds });

    // Validate status (0 = Hết hàng, 1 = Còn hàng)
    if (status !== 0 && status !== 1) {
      return res.status(400).json({ 
        error: 'Trạng thái không hợp lệ! Chỉ chấp nhận 0 (Hết hàng) hoặc 1 (Còn hàng)' 
      });
    }

    let query;
    let params;
    let updateCount = 0;

    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
      // Cập nhật các sản phẩm được chọn
      const placeholders = productIds.map(() => '?').join(',');
      query = `UPDATE sanpham SET TinhTrang = ? WHERE MaSP IN (${placeholders})`;
      params = [status, ...productIds];
    } else {
      // Cập nhật tất cả sản phẩm
      query = 'UPDATE sanpham SET TinhTrang = ?';
      params = [status];
    }

    const [result] = await pool.query(query, params);
    updateCount = result.affectedRows;

    if (updateCount === 0) {
      return res.status(404).json({ 
        error: 'Không có sản phẩm nào được cập nhật!' 
      });
    }

    // Lấy thống kê sau khi cập nhật
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as TongSanPham,
        SUM(CASE WHEN TinhTrang = 1 THEN 1 ELSE 0 END) as ConHang,
        SUM(CASE WHEN TinhTrang = 0 THEN 1 ELSE 0 END) as HetHang
      FROM sanpham
    `);

    res.status(200).json({ 
      message: `Cập nhật trạng thái ${status === 1 ? 'Còn hàng' : 'Hết hàng'} cho ${updateCount} sản phẩm thành công!`,
      updatedCount: updateCount,
      updatedBy: req.user.makh || req.user.MaTK || req.user.userId,
      statistics: stats[0]
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái hàng loạt:', error);
    res.status(500).json({ 
      error: 'Lỗi khi cập nhật trạng thái sản phẩm', 
      details: error.message 
    });
  }
});

// Route lấy thống kê trạng thái sản phẩm
router.get('/status-stats', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as TongSanPham,
        SUM(CASE WHEN TinhTrang = 1 THEN 1 ELSE 0 END) as ConHang,
        SUM(CASE WHEN TinhTrang = 0 THEN 1 ELSE 0 END) as HetHang,
        SUM(CASE WHEN TinhTrang IS NULL THEN 1 ELSE 0 END) as ChuaXacDinh
      FROM sanpham
    `);

    res.status(200).json(stats[0]);
  } catch (error) {
    console.error('Lỗi khi lấy thống kê:', error);
    res.status(500).json({ 
      error: 'Lỗi khi lấy thống kê trạng thái sản phẩm', 
      details: error.message 
    });
  }
});


export default router;