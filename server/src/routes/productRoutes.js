import express from 'express';
import pool from '../config/connectDatabase.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
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
    ;
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

// Route lấy danh sách nhà cung cấp cho dropdown
router.get('/suppliers', async (req, res) => {
  try {
    const [suppliers] = await pool.query('SELECT MaNCC, TenNCC FROM nhacungcap ORDER BY TenNCC');
    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhà cung cấp:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách nhà cung cấp' });
  }
});
// Route lấy sản phẩm theo thể loại - thêm route này
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Validate categoryId
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json({ error: 'ID thể loại không hợp lệ' });
    }

    // Build query and params. For category 6 (sách giáo khoa) limit to 20 items as requested.
    let query = `
      SELECT s.*, m.TenTG AS TacGia 
      FROM sanpham s 
      LEFT JOIN tacgia m ON s.MaTG = m.MaTG 
      WHERE s.MaTL = ?
    `;
    const params = [parseInt(categoryId)];

      const cid = parseInt(categoryId);
      if (cid === 6) {
        query += ' LIMIT 20';
        console.log('Applying LIMIT 20 for category 6 (textbooks)');
      } else if (cid === 2 || cid === 4) {
        // For politics (2) and science (4) return only 10 items as requested
        query += ' LIMIT 10';
        console.log(`Applying LIMIT 10 for category ${cid}`);
    }

    const [products] = await pool.query(query, params);
    
    console.log(`Sản phẩm thể loại ${categoryId}:`, products.length);
    res.status(200).json(products);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo thể loại:', error);
    res.status(500).json({ 
      error: 'Lỗi khi lấy sản phẩm theo thể loại', 
      details: error.message 
    });
  }
});
// Route lấy danh sách sản phẩm - SỬA QUERY TƯƠNG TỰ
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT s.*, tg.TenTG AS TacGia 
      FROM sanpham s 
      LEFT JOIN tacgia tg ON s.MaTG = tg.MaTG
    `;
    let params = [];
    let conditions = [];

    if (req.query.MaTL) {
      conditions.push('s.MaTL = ?');
      params.push(req.query.MaTL);
    }

    // Filter by supplier(s) - supports single id or comma-separated ids
    if (req.query.MaNCC) {
      const suppliers = String(req.query.MaNCC).split(',').map(s => s.trim()).filter(Boolean);
      if (suppliers.length === 1) {
        conditions.push('s.MaNCC = ?');
        params.push(suppliers[0]);
      } else if (suppliers.length > 1) {
        const placeholders = suppliers.map(() => '?').join(',');
        conditions.push(`s.MaNCC IN (${placeholders})`);
        params.push(...suppliers);
      }
    }

    // Filter by HinhThuc (format/type) - supports single value or comma-separated values
    if (req.query.HinhThuc) {
      const types = String(req.query.HinhThuc).split(',').map(t => t.trim()).filter(Boolean);
      if (types.length === 1) {
        conditions.push('s.HinhThuc = ?');
        params.push(types[0]);
      } else if (types.length > 1) {
        const placeholders = types.map(() => '?').join(',');
        conditions.push(`s.HinhThuc IN (${placeholders})`);
        params.push(...types);
      }
    }

    // Filter by author(s) - supports single id or comma-separated ids
    if (req.query.MaTG) {
      const authors = String(req.query.MaTG).split(',').map(a => a.trim()).filter(Boolean);
      if (authors.length === 1) {
        const mtg = parseInt(authors[0]);
        if (!isNaN(mtg)) {
          conditions.push('s.MaTG = ?');
          params.push(mtg);
        }
      } else if (authors.length > 1) {
        const ids = authors.map(v => parseInt(v)).filter(v => !isNaN(v));
        if (ids.length) {
          const placeholders = ids.map(() => '?').join(',');
          conditions.push(`s.MaTG IN (${placeholders})`);
          params.push(...ids);
        }
      }
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
    console.log('🔍 Products returned from DB count:', products.length);
    if (products.length > 0) {
      console.log('🔍 First product TacGia:', products[0].TacGia);
    }
    res.status(200).json(products);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách sản phẩm', details: error.message });
  }
});

// Route lấy sản phẩm theo ID - SỬA QUERY
// Route: lấy sản phẩm dưới mức tồn kho (public)
// NOTE: must be declared BEFORE '/:id' so the literal path 'low-stock' isn't interpreted as an id
router.get('/low-stock', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const fallbackThreshold = parseInt(req.query.defaultThreshold, 10) || parseInt(process.env.DEFAULT_MIN_STOCK, 10) || 5;

    const sql = `
      SELECT MaSP, TenSP, SoLuong, DonGia,
             COALESCE(MinSoLuong, 0) AS MinSoLuong,
             (COALESCE(NULLIF(MinSoLuong,0), ?) - COALESCE(SoLuong,0)) AS Needed
      FROM sanpham
      WHERE COALESCE(NULLIF(MinSoLuong,0), ?) >= COALESCE(SoLuong,0)
      ORDER BY Needed DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(sql, [fallbackThreshold, fallbackThreshold, limit]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Lỗi khi lấy low-stock:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// --- RECOMMENDATIONS: helper + route ---
async function getRecommendationsBySearch(makh) {
  const [searchRows] = await pool.query(
    "SELECT search_query FROM hanh_dong_user WHERE makhachhang = ? AND loaihanhdong = 'search' ORDER BY timestamp DESC LIMIT 5",
    [makh]
  );
  if (searchRows.length === 0) {
    return [];
  }
  const searchConditions = searchRows.map(() => 
    `(MATCH(TenSP, MoTa) AGAINST(? IN NATURAL LANGUAGE MODE))`
  ).join(' OR ');

  let searchValues = searchRows.map(row => row.search_query);

  const productSql = `
    SELECT MaSP, TenSP, HinhAnh, DonGia 
    FROM sanpham 
    WHERE ${searchConditions}  -- Đã bỏ dấu ngoặc bao quanh
    LIMIT 10
  `;
  const [products] = await pool.query(productSql, searchValues);
  return products;
}


router.get('/recommendations', async (req, res) => {
  const { makh } = req.query;

  if (!makh) {
    return res.status(400).json({ message: "Thiếu makh" });
  }

  try {
    const sqlGetViewed = `
      SELECT masanpham 
      FROM hanh_dong_user 
      WHERE makhachhang = ? AND loaihanhdong = 'view'
      GROUP BY masanpham
      ORDER BY MAX(timestamp) DESC 
      LIMIT 100
    `;
        
    const [viewedRows] = await pool.query(sqlGetViewed, [makh]);
    const viewedIds = viewedRows.map(row => row.masanpham);
        
    let exclusionSql = '';
    const queryParams = [makh]; 

    if (viewedIds.length > 0) {
      exclusionSql = 'AND p2.MaSP NOT IN (?)';
      queryParams.push(viewedIds); 
    }

    const viewSql = `
      SELECT
        p2.MaSP, p2.TenSP, p2.HinhAnh, p2.DonGia,
        COUNT(p2.MaSP) AS view_frequency
      FROM
        (
          SELECT masanpham, timestamp
          FROM hanh_dong_user
          WHERE makhachhang = ? 
          AND loaihanhdong = 'view'
          ORDER BY timestamp DESC
          LIMIT 100
        ) AS ua
      JOIN
        sanpham AS p1 ON ua.masanpham = p1.MaSP 
      JOIN
        sanpham AS p2 ON p1.MaTL = p2.MaTL 
      WHERE
        p1.MaSP != p2.MaSP 
        ${exclusionSql}
      GROUP BY
        p2.MaSP, p2.TenSP, p2.HinhAnh, p2.DonGia 
      ORDER BY
        view_frequency DESC,
        MAX(ua.timestamp) DESC
      LIMIT 10;
    `;
        
    const [viewRecommendations] = await pool.query(viewSql, queryParams); 
        
    if (viewRecommendations.length > 0) {
      console.log(`(makh: ${makh}) Đề xuất theo 'view': ${viewRecommendations.length} sản phẩm.`);
      return res.json(viewRecommendations);
    }

    console.log(`(makh: ${makh}) Không có 'view', thử đề xuất theo 'search'.`);
        
    const searchRecommendations = await getRecommendationsBySearch(makh); 

    if (searchRecommendations.length > 0) {
      console.log(`(makh: ${makh}) Đề xuất theo 'search': ${searchRecommendations.length} sản phẩm.`);
      return res.json(searchRecommendations);
    }
        
    console.log(`(makh: ${makh}) Không có dữ liệu để đề xuất.`);
    return res.json([]); 

  } catch (error) {
    console.error("Lỗi lấy đề xuất:", error);
    res.status(500).send("Lỗi server");
  }
});


// Route: 20 sản phẩm sắp xếp theo Năm xuất bản (thấp -> cao).
// URL: GET /sorted/year
// Optional query: MaTL (category id) to filter by category
router.get('/sorted/year', async (req, res) => {
  try {
    const { MaTL } = req.query;
    let sql = `
      SELECT s.*, tg.TenTG AS TacGia
      FROM sanpham s
      LEFT JOIN tacgia tg ON s.MaTG = tg.MaTG
    `;
    const params = [];
    if (MaTL && !isNaN(MaTL)) {
      sql += ' WHERE s.MaTL = ?';
      params.push(parseInt(MaTL));
    }

    // Put NULL NamXB last, then order ascending and limit 20
    sql += ` ORDER BY (s.NamXB IS NULL), s.NamXB ASC LIMIT 20`;

    const [rows] = await pool.query(sql, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo năm (sorted/year):', error);
    res.status(500).json({ error: 'Lỗi server khi lấy sản phẩm theo năm', details: error.message });
  }
});

// Route: 20 sản phẩm sắp xếp theo số lượng tồn kho (cao -> thấp).
// URL: GET /sorted/stock
// Optional query: MaTL (category id) to filter by category
router.get('/sorted/stock', async (req, res) => {
  try {
    const { MaTL } = req.query;
    let sql = `
      SELECT s.*, tg.TenTG AS TacGia
      FROM sanpham s
      LEFT JOIN tacgia tg ON s.MaTG = tg.MaTG
    `;
    const params = [];
    if (MaTL && !isNaN(MaTL)) {
      sql += ' WHERE s.MaTL = ?';
      params.push(parseInt(MaTL));
    }

    // Order by SoLuong (NULLs treated as 0) descending and limit 20
    sql += ` ORDER BY COALESCE(s.SoLuong, 0) DESC LIMIT 20`;

    const [rows] = await pool.query(sql, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo tồn kho (sorted/stock):', error);
    res.status(500).json({ error: 'Lỗi server khi lấy sản phẩm theo tồn kho', details: error.message });
  }
});

// Route lấy sản phẩm theo ID - SỬA QUERY
// Route lấy chi tiết sản phẩm (kết hợp thông tin nhà cung cấp, tác giả và các trường sách có trong `sanpham`)
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const query = `
      SELECT s.*, tg.TenTG AS TacGia, ncc.TenNCC AS NhaCungCap
      FROM sanpham s
      LEFT JOIN tacgia tg ON s.MaTG = tg.MaTG
      LEFT JOIN nhacungcap ncc ON s.MaNCC = ncc.MaNCC
      WHERE s.MaSP = ?
      LIMIT 1;
    `;

    const [rows] = await pool.query(query, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    const s = rows[0];

    // Normalize bit(1) / boolean field TinhTrang which may come back as Buffer for some MySQL drivers
    let tinhTrangValue = null;
    if (s.TinhTrang === null || s.TinhTrang === undefined) tinhTrangValue = null;
    else if (typeof s.TinhTrang === 'number') tinhTrangValue = s.TinhTrang ? 1 : 0;
    else if (Buffer.isBuffer(s.TinhTrang)) tinhTrangValue = s.TinhTrang[0] ? 1 : 0;
    else tinhTrangValue = s.TinhTrang ? 1 : 0;

    const product = {
      MaSP: s.MaSP,
      MaTL: s.MaTL,
      TenSP: s.TenSP,
      MoTa: s.MoTa,
      HinhAnh: s.HinhAnh,
      DonGia: s.DonGia,
      SoLuong: s.SoLuong,
      NamXB: s.NamXB,
      TinhTrang: tinhTrangValue,
      MaTG: s.MaTG,
      TacGia: s.TacGia || null,
      MaNCC: s.MaNCC,
      NhaCungCap: s.NhaCungCap || null,
      TrongLuong: s.TrongLuong,
      KichThuoc: s.KichThuoc,
      SoTrang: s.SoTrang,
      HinhThuc: s.HinhThuc
    };

    // --- Lấy ảnh phụ từ bảng sanpham_anh và đính kèm vào response ---
    try {
      const [imgs] = await pool.query(
        'SELECT Id, MaSP, FileName, SortOrder, CreatedAt, UpdatedAt FROM sanpham_anh WHERE MaSP = ? ORDER BY SortOrder ASC, Id ASC',
        [id]
      );

      // Build public URL for each image. The server serves product images at /product-images/<filename>
      const baseUrl = process.env.IMG_BASE_URL || (req.protocol + '://' + req.get('host'));
      // Map DB rows to image objects
      const imagesFromTable = imgs.map(r => ({
        id: r.Id,
        filename: r.FileName,
        sortOrder: r.SortOrder,
        createdAt: r.CreatedAt,
        updatedAt: r.UpdatedAt,
        url: r.FileName ? `${baseUrl}/product-images/${r.FileName}` : null,
        isPrimary: false
      }));

      // Ensure the main image stored in sanpham.HinhAnh is preserved as primary
      const mainFilename = s.HinhAnh && s.HinhAnh.toString().trim();
      let images = [];
      if (mainFilename) {
        // Find if mainFilename already exists in sanpham_anh
        const matchIndex = imagesFromTable.findIndex(x => x.filename === mainFilename);
        if (matchIndex !== -1) {
          imagesFromTable[matchIndex].isPrimary = true;
          // move matched to front
          const [mainImg] = imagesFromTable.splice(matchIndex, 1);
          images.push(mainImg);
        } else {
          // prepend main image object (it may be stored in sanpham.HinhAnh only)
          images.push({ id: null, filename: mainFilename, sortOrder:  -1, createdAt: null, updatedAt: null, url: `${baseUrl}/product-images/${mainFilename}`, isPrimary: true });
        }
      }

      // append other images sorted by sortOrder
      images = images.concat(imagesFromTable);

      product.images = images;
    } catch (imgErr) {
      console.warn('Không thể lấy ảnh phụ cho sản phẩm', id, imgErr.message || imgErr);
      product.images = [];
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết sản phẩm', details: error.message });
  }
});

// Route trả về thông tin chi tiết rút gọn theo yêu cầu (TacGia, NhaCungCap, TrongLuong, KichThuoc, SoTrang, HinhThuc, NamXB)
// Đặt trước route '/:id' để tránh conflict
router.get('/:id/info', async (req, res) => {
  try {
    const id = req.params.id;

    const query = `
      SELECT s.MaSP, s.TenSP, s.NamXB AS NamXB, tg.TenTG AS TacGia, ncc.TenNCC AS NhaCungCap,
             s.TrongLuong AS TrongLuong,
             s.KichThuoc AS KichThuoc,
             s.SoTrang AS SoTrang,
             s.HinhThuc AS HinhThuc
      FROM sanpham s
      LEFT JOIN tacgia tg ON s.MaTG = tg.MaTG
      LEFT JOIN nhacungcap ncc ON s.MaNCC = ncc.MaNCC
      WHERE s.MaSP = ?
      LIMIT 1;
    `;

    const [rows] = await pool.query(query, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    const r = rows[0];

    const response = {
      MaSP: r.MaSP,
      TenSP: r.TenSP,
      TacGia: r.TacGia || null,
      NhaCungCap: r.NhaCungCap || null,
      TrongLuong: r.TrongLuong == null ? null : Number(r.TrongLuong),
      KichThuoc: r.KichThuoc || null,
      SoTrang: r.SoTrang == null ? null : Number(r.SoTrang),
      HinhThuc: r.HinhThuc || null,
      NamXB: r.NamXB == null ? null : Number(r.NamXB)
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Lỗi khi lấy info sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi lấy info sản phẩm', details: error.message });
  }
});

// Route lấy sản phẩm theo thể loại và năm xuất bản hiện tại
router.get('/category-current-year/:categoryId?', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const currentYear = new Date().getFullYear(); // năm hiện tại

    let query;
    let params;

    if (!categoryId || categoryId.toLowerCase() === 'all') {
      // Lấy tất cả sản phẩm năm hiện tại
      query = `
        SELECT *
        FROM sanpham
        WHERE NamXB = ?
      `;
      params = [currentYear];
    } else if (!isNaN(categoryId)) {
      // Lấy sản phẩm theo thể loại + năm hiện tại
      query = `
        SELECT *
        FROM sanpham
        WHERE MaTL = ? AND NamXB = ?
      `;
      params = [parseInt(categoryId), currentYear];
    } else {
      return res.status(400).json({ error: 'ID thể loại không hợp lệ' });
    }

    const [products] = await pool.query(query, params);

    res.status(200).json(products);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo thể loại và năm hiện tại:', error);
    res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
});


// =============================================================================
// ROUTES CẦN TOKEN VÀ QUYỀN ADMIN/STAFF (PROTECTED)
// =============================================================================
router.post(
  '/',
  authenticateToken,
  checkAdminPermission,
  upload.fields([
    { name: 'HinhAnh', maxCount: 1 },       // ảnh chính
    { name: 'ExtraImages', maxCount: 20 }   // ảnh phụ
  ]),
  logFileMiddleware,
  async (req, res) => {
    let connection;
    try {
      const {
        MaTL, TenSP, MaTG, NamXB, TinhTrang, DonGia, SoLuong, MoTa,
        MaNCC, TrongLuong, KichThuoc, SoTrang, HinhThuc, MinSoLuong
      } = req.body;

      const mainFile = req.files?.HinhAnh?.[0] || null;
      const extraFiles = req.files?.ExtraImages || [];

      const maTLNumber = parseInt(MaTL);
      const maTGNumber = parseInt(MaTG);
      const namXBNumber = parseInt(NamXB);
      const maNCCNumber = parseInt(MaNCC);

      if (isNaN(maTLNumber) || !TenSP?.trim()) {
        return res.status(400).json({ error: 'Thiếu Mã thể loại hoặc Tên sản phẩm!' });
      }

      const tinhTrangValue = TinhTrang === '1' || TinhTrang === 1 ? 1 : 0;
      const donGiaValue = parseFloat(DonGia) || 0;
      const soLuongValue = parseInt(SoLuong) || 0;
      const minSoLuongValue = parseInt(MinSoLuong) || 0;

      const mainFilename = mainFile ? mainFile.filename : null;

      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 1️⃣ Thêm sản phẩm vào bảng sanpham
      const [result] = await connection.query(
        `INSERT INTO sanpham
         (MaTL, TenSP, MoTa, HinhAnh, MaTG, NamXB, TinhTrang, DonGia, SoLuong,
          MinSoLuong, MaNCC, TrongLuong, KichThuoc, SoTrang, HinhThuc)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          maTLNumber,
          TenSP.trim(),
          MoTa || null,
          mainFilename,
          isNaN(maTGNumber) ? null : maTGNumber,
          isNaN(namXBNumber) ? null : namXBNumber,
          tinhTrangValue,
          donGiaValue,
          soLuongValue,
          minSoLuongValue,
          isNaN(maNCCNumber) ? null : maNCCNumber,
          isNaN(parseInt(TrongLuong)) ? null : parseInt(TrongLuong),
          KichThuoc || null,
          isNaN(parseInt(SoTrang)) ? null : parseInt(SoTrang),
          HinhThuc || null
        ]
      );

      const newProductId = result.insertId;

      // 2️⃣ Thêm ảnh phụ vào sanpham_anh
      if (extraFiles.length > 0) {
        const values = extraFiles.map((f, idx) => [newProductId, f.filename, idx]);
        await connection.query('INSERT INTO sanpham_anh (MaSP, FileName, SortOrder) VALUES ?', [values]);
      }

      await connection.commit();
      connection.release();

      res.status(201).json({
        message: 'Thêm sản phẩm thành công!',
        MaSP: newProductId,
        PrimaryImage: mainFilename,
        ExtraImages: extraFiles.map(f => f.filename)
      });
    } catch (error) {
      console.error('❌ Lỗi khi thêm sản phẩm:', error.message || error);
      if (connection) {
        try { await connection.rollback(); connection.release(); } catch (e) {}
      }
      res.status(500).json({ error: 'Lỗi server khi thêm sản phẩm', details: error.message });
    }
  }
);

// Route cập nhật sản phẩm - YÊU CẦU TOKEN VÀ QUYỀN ADMIN/STAFF/NV004/NV007
router.put('/:id', authenticateToken, checkAdminPermission, upload.fields([
  { name: 'HinhAnh', maxCount: 1 },
  { name: 'ExtraImages', maxCount: 20 }
]), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const {
      MaTL, TenSP, MaTG, NamXB, TinhTrang, DonGia, SoLuong, MoTa,
      MaNCC, TrongLuong, KichThuoc, SoTrang, HinhThuc, MinSoLuong
    } = req.body;

    // files (if any)
    const mainFile = req.files?.HinhAnh?.[0] || null;
    const extraFiles = req.files?.ExtraImages || [];

    const maTLNumber = parseInt(MaTL);
    const maTGNumber = parseInt(MaTG);
    const namXBNumber = parseInt(NamXB);
    const maNCCNumber = parseInt(MaNCC);

    if (isNaN(maTLNumber) || !TenSP?.trim()) {
      return res.status(400).json({ error: 'Thiếu Mã thể loại hoặc Tên sản phẩm!' });
    }

    const tinhTrangValue = TinhTrang === '1' || TinhTrang === 1 ? 1 : 0;
    const donGiaValue = parseFloat(DonGia) || 0;
    const soLuongValue = parseInt(SoLuong) || 0;
    const minSoLuongValue = parseInt(MinSoLuong) || 0;

    // Decide HinhAnh to set: uploaded file preferred; if not, check body HinhAnh (string) else undefined (=no change)
    const bodyHinhAnh = req.body.HinhAnh || null;
    const newHinhAnh = mainFile ? mainFile.filename : (bodyHinhAnh ? bodyHinhAnh.toString().trim() : undefined);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Build update query dynamically
    let updateQuery = 'UPDATE sanpham SET MaTL = ?, TenSP = ?, MoTa = ?';
    const updateParams = [maTLNumber, TenSP.trim(), MoTa || null];

    if (newHinhAnh !== undefined) {
      updateQuery += ', HinhAnh = ?';
      updateParams.push(newHinhAnh);
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

    if (isNaN(maNCCNumber)) {
      updateQuery += ', MaNCC = NULL';
    } else {
      updateQuery += ', MaNCC = ?';
      updateParams.push(maNCCNumber);
    }

    updateQuery += ', TinhTrang = ?, DonGia = ?, SoLuong = ?, MinSoLuong = ?, TrongLuong = ?';
    updateParams.push(tinhTrangValue, donGiaValue, soLuongValue, minSoLuongValue, isNaN(parseInt(TrongLuong)) ? null : parseInt(TrongLuong));

    updateQuery += ', KichThuoc = ?, SoTrang = ?, HinhThuc = ? WHERE MaSP = ?';
    updateParams.push(KichThuoc || null, isNaN(parseInt(SoTrang)) ? null : parseInt(SoTrang), HinhThuc || null, id);

    const [result] = await connection.query(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc không có thay đổi!' });
    }

    // If new extra files uploaded, insert into sanpham_anh
    if (extraFiles.length > 0) {
      const values = extraFiles.map((f, idx) => [id, f.filename, idx]);
      await connection.query('INSERT INTO sanpham_anh (MaSP, FileName, SortOrder) VALUES ?', [values]);
    }

    await connection.commit();
    connection.release();

    res.status(200).json({ message: 'Cập nhật sản phẩm thành công!', updatedBy: req.user.makh || req.user.MaTK || req.user.userId });
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error.message || error);
    if (connection) {
      try { await connection.rollback(); connection.release(); } catch (e) {}
    }
    res.status(500).json({ error: 'Lỗi khi cập nhật sản phẩm', details: error.message || 'Không xác định' });
  }
});

// Route xóa một ảnh (ảnh phụ trong sanpham_anh hoặc ảnh chính nếu muốn)
router.delete('/images/:imageId', authenticateToken, checkAdminPermission, async (req, res) => {
  let connection;
  try {
    const { imageId } = req.params;
    if (!imageId) return res.status(400).json({ error: 'Thiếu imageId' });

    // tìm ảnh trong bảng sanpham_anh
    const [[imgRow]] = await pool.query('SELECT Id, MaSP, FileName FROM sanpham_anh WHERE Id = ?', [imageId]);
    if (!imgRow) {
      return res.status(404).json({ error: 'Không tìm thấy ảnh' });
    }

    const filename = imgRow.FileName;
    const maSP = imgRow.MaSP;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Xóa bản ghi khỏi sanpham_anh
    await connection.query('DELETE FROM sanpham_anh WHERE Id = ?', [imageId]);

    // Nếu file tồn tại trên disk, xóa nó
    try {
      const uploadDir = 'C:/Users/PC/Desktop/CNPM/server/backend/product/';
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Deleted file from disk:', filePath);
      } else {
        console.warn('⚠️ File not found on disk:', filePath);
      }
    } catch (fsErr) {
      console.warn('Không thể xóa file trên disk:', fsErr.message || fsErr);
      // continue - we already deleted DB row
    }

    // Nếu filename trùng với ảnh chính trong sanpham.HinhAnh, reset HinhAnh về NULL hoặc chọn 1 ảnh khác
    const [prodRows] = await connection.query('SELECT HinhAnh FROM sanpham WHERE MaSP = ? LIMIT 1', [maSP]);
    if (prodRows && prodRows.length > 0) {
      const currentMain = prodRows[0].HinhAnh;
      if (currentMain && currentMain.toString().trim() === filename) {
        // tìm 1 ảnh còn lại trong sanpham_anh để đặt làm ảnh chính
        const [remaining] = await connection.query('SELECT FileName FROM sanpham_anh WHERE MaSP = ? ORDER BY SortOrder ASC LIMIT 1', [maSP]);
        if (remaining && remaining.length > 0) {
          await connection.query('UPDATE sanpham SET HinhAnh = ? WHERE MaSP = ?', [remaining[0].FileName, maSP]);
        } else {
          await connection.query('UPDATE sanpham SET HinhAnh = NULL WHERE MaSP = ?', [maSP]);
        }
      }
    }

    await connection.commit();
    connection.release();

    res.status(200).json({ message: 'Xóa ảnh thành công', imageId, filename });
  } catch (error) {
    console.error('Lỗi khi xóa ảnh:', error.message || error);
    if (connection) try { await connection.rollback(); connection.release(); } catch (e) {}
    res.status(500).json({ error: 'Lỗi khi xóa ảnh', details: error.message });
  }
});

// Route cập nhật MinSoLuong (ngưỡng tồn tối thiểu) - YÊU CẦU TOKEN VÀ QUYỀN ADMIN/STAFF
router.patch('/:id/min-stock', authenticateToken, checkAdminPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const { MinSoLuong } = req.body;
    const minValue = Number.isNaN(parseInt(MinSoLuong)) ? 0 : parseInt(MinSoLuong);

    const [result] = await pool.query('UPDATE sanpham SET MinSoLuong = ? WHERE MaSP = ?', [minValue, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    res.status(200).json({ message: 'Cập nhật ngưỡng tồn tối thiểu thành công', MinSoLuong: minValue });
  } catch (error) {
    console.error('Lỗi khi cập nhật MinSoLuong:', error);
    res.status(500).json({ error: 'Lỗi server' });
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




// Route lấy sản phẩm theo ID - SỬA QUERY
// Route lấy chi tiết sản phẩm (kết hợp thông tin nhà cung cấp, tác giả và các trường sách có trong `sanpham`)
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const query = `
      SELECT s.*, tg.TenTG AS TacGia, ncc.TenNCC AS NhaCungCap
      FROM sanpham s
      LEFT JOIN tacgia tg ON s.MaTG = tg.MaTG
      LEFT JOIN nhacungcap ncc ON s.MaNCC = ncc.MaNCC
      WHERE s.MaSP = ?
      LIMIT 1;
    `;

    const [rows] = await pool.query(query, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    const s = rows[0];

    // Normalize bit(1) / boolean field TinhTrang which may come back as Buffer for some MySQL drivers
    let tinhTrangValue = null;
    if (s.TinhTrang === null || s.TinhTrang === undefined) tinhTrangValue = null;
    else if (typeof s.TinhTrang === 'number') tinhTrangValue = s.TinhTrang ? 1 : 0;
    else if (Buffer.isBuffer(s.TinhTrang)) tinhTrangValue = s.TinhTrang[0] ? 1 : 0;
    else tinhTrangValue = s.TinhTrang ? 1 : 0;

    const product = {
      MaSP: s.MaSP,
      MaTL: s.MaTL,
      TenSP: s.TenSP,
      MoTa: s.MoTa,
      HinhAnh: s.HinhAnh,
      DonGia: s.DonGia,
      SoLuong: s.SoLuong,
      NamXB: s.NamXB,
      TinhTrang: tinhTrangValue,
      MaTG: s.MaTG,
      TacGia: s.TacGia || null,
      MaNCC: s.MaNCC,
      NhaCungCap: s.NhaCungCap || null,
      TrongLuong: s.TrongLuong,
      KichThuoc: s.KichThuoc,
      SoTrang: s.SoTrang,
      HinhThuc: s.HinhThuc
    };

    // Attach images from sanpham_anh if any
    try {
      const [imgs] = await pool.query(
        'SELECT Id, MaSP, FileName, SortOrder, CreatedAt, UpdatedAt FROM sanpham_anh WHERE MaSP = ? ORDER BY SortOrder ASC, Id ASC',
        [id]
      );
      const baseUrl = process.env.IMG_BASE_URL || (req.protocol + '://' + req.get('host'));
      const imagesFromTable = imgs.map(r => ({
        id: r.Id,
        filename: r.FileName,
        sortOrder: r.SortOrder,
        createdAt: r.CreatedAt,
        updatedAt: r.UpdatedAt,
        url: r.FileName ? `${baseUrl}/product-images/${r.FileName}` : null,
        isPrimary: false
      }));

      const mainFilename = s.HinhAnh && s.HinhAnh.toString().trim();
      let images = [];
      if (mainFilename) {
        const matchIndex = imagesFromTable.findIndex(x => x.filename === mainFilename);
        if (matchIndex !== -1) {
          imagesFromTable[matchIndex].isPrimary = true;
          const [mainImg] = imagesFromTable.splice(matchIndex, 1);
          images.push(mainImg);
        } else {
          images.push({ id: null, filename: mainFilename, sortOrder: -1, createdAt: null, updatedAt: null, url: `${baseUrl}/product-images/${mainFilename}`, isPrimary: true });
        }
      }
      images = images.concat(imagesFromTable);
      product.images = images;
    } catch (errImgs) {
      console.warn('Lỗi lấy sanpham_anh cho MaSP=', id, errImgs.message || errImgs);
      product.images = [];
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết sản phẩm', details: error.message });
  }
});

// Route trả về thông tin chi tiết rút gọn theo yêu cầu (TacGia, NhaCungCap, TrongLuong, KichThuoc, SoTrang, HinhThuc, NamXB)
// Đặt trước route '/:id' để tránh conflict
router.get('/:id/info', async (req, res) => {
  try {
    const id = req.params.id;

    const query = `
      SELECT s.MaSP, s.TenSP, s.NamXB AS NamXB, tg.TenTG AS TacGia, ncc.TenNCC AS NhaCungCap,
             s.TrongLuong AS TrongLuong,
             s.KichThuoc AS KichThuoc,
             s.SoTrang AS SoTrang,
             s.HinhThuc AS HinhThuc
      FROM sanpham s
      LEFT JOIN tacgia tg ON s.MaTG = tg.MaTG
      LEFT JOIN nhacungcap ncc ON s.MaNCC = ncc.MaNCC
      WHERE s.MaSP = ?
      LIMIT 1;
    `;

    const [rows] = await pool.query(query, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    const r = rows[0];

    const response = {
      MaSP: r.MaSP,
      TenSP: r.TenSP,
      TacGia: r.TacGia || null,
      NhaCungCap: r.NhaCungCap || null,
      TrongLuong: r.TrongLuong == null ? null : Number(r.TrongLuong),
      KichThuoc: r.KichThuoc || null,
      SoTrang: r.SoTrang == null ? null : Number(r.SoTrang),
      HinhThuc: r.HinhThuc || null,
      NamXB: r.NamXB == null ? null : Number(r.NamXB)
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Lỗi khi lấy info sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi lấy info sản phẩm', details: error.message });
  }
});

// Fixed route: chỉ trả về sản phẩm của thể loại có MaTL = 1
router.get('/theloai/1', async (req, res) => {
  try {
    const query = `
      SELECT 
        sp.MaSP,
        sp.TenSP,
        sp.MoTa,
        sp.HinhAnh,
        sp.DonGia,
        sp.SoLuong,
        sp.NamXB,
        tl.TenTL AS TheLoai,
        tg.TenTG AS TacGia
      FROM sanpham sp
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE sp.MaTL = 1;
    `;

    const [rows] = await pool.query(query);

    return res.status(200).json({
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy sản phẩm thể loại MaTL=1:', error);
    return res.status(500).json({
      error: 'Lỗi server khi lấy sản phẩm thể loại MaTL=1',
      details: error.message
    });
  }
});
export default router;