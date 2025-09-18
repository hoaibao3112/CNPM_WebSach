import express from 'express';
import pool from '../config/connectDatabase.js';
import multer from 'multer';

const router = express.Router();

// Config multer để lưu file vào thư mục product
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'C:/Users/PC/Desktop/CNPM/server/backend/product/';
    console.log(`📂 Attempting to save file to: ${dir}`);
    cb(null, dir); // Đường dẫn tuyệt đối
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    console.log(`📄 Filename generated: ${uniqueName}`);
    cb(null, uniqueName); // Tạo tên file duy nhất
  }
});
const upload = multer({ storage });

// Middleware để log file nhận được
const logFileMiddleware = (req, res, next) => {
  console.log('📤 Received file:', req.file);
  console.log('📋 Request body:', req.body);
  next();
};
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

    // Trả về sản phẩm đầu tiên (hoặc tất cả nếu muốn, nhưng để đơn giản giả sử unique name)
    res.status(200).json(products[0]);
  } catch (error) {
    console.error('Lỗi search sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi tìm sản phẩm', details: error.message });
  }
});
router.post('/', upload.single('HinhAnh'), logFileMiddleware, async (req, res) => {
  try {
    const { MaTL, TenSP, MaTG, NamXB, TinhTrang, DonGia, SoLuong } = req.body;
    console.log('🔍 Raw request body:', req.body); // Debug toàn bộ body
    console.log('🔍 Received file:', req.file); // Debug file

    const HinhAnh = req.file ? req.file.filename : null; // Lấy tên file nếu upload

    const maTLNumber = parseInt(MaTL);
    const maTGNumber = parseInt(MaTG);
    const tenSPTrimmed = TenSP ? TenSP.trim() : '';

    // Validation bắt buộc: MaTL và TenSP
    if (isNaN(maTLNumber) || !tenSPTrimmed) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc (Mã TL, Tên SP)!' });
    }

    // Validation NamXB
    const namXBNumber = parseInt(NamXB);
    if (!isNaN(namXBNumber) && (namXBNumber < 1900 || namXBNumber > new Date().getFullYear())) {
      return res.status(400).json({ error: 'Năm xuất bản phải nằm trong khoảng từ 1900 đến năm hiện tại!' });
    }

    // Kiểm tra MaTG tồn tại nếu cung cấp
    if (!isNaN(maTGNumber)) {
      const [existingTacGia] = await pool.query('SELECT MaTG FROM tacgia WHERE MaTG = ?', [maTGNumber]);
      if (existingTacGia.length === 0) {
        return res.status(400).json({ error: `Mã tác giả (MaTG: ${maTGNumber}) không tồn tại trong bảng tacgia!` });
      }
    }

    // Mặc định TinhTrang là 0 nếu không cung cấp
    const tinhTrangValue = TinhTrang === '1' || TinhTrang === 1 ? 1 : 0;

    // Mặc định DonGia và SoLuong là 0 nếu không hợp lệ
    const donGiaValue = parseFloat(DonGia) || 0;
    const soLuongValue = parseInt(SoLuong) || 0;

    // Log dữ liệu để debug
    console.log('Dữ liệu nhận được từ frontend:', {
      MaTL: maTLNumber,
      TenSP: tenSPTrimmed,
      HinhAnh,
      MaTG: maTGNumber,
      NamXB: namXBNumber,
      TinhTrang: tinhTrangValue,
      DonGia: donGiaValue,
      SoLuong: soLuongValue,
    });

    // Insert vào database
    const [result] = await pool.query(
      'INSERT INTO sanpham (MaTL, TenSP, HinhAnh, MaTG, NamXB, TinhTrang, DonGia, SoLuong) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [maTLNumber, tenSPTrimmed, HinhAnh, isNaN(maTGNumber) ? null : maTGNumber, isNaN(namXBNumber) ? null : namXBNumber, tinhTrangValue, donGiaValue, soLuongValue]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Không thể thêm sản phẩm. Vui lòng kiểm tra lại dữ liệu hoặc cơ sở dữ liệu!' });
    }

    res.status(201).json({ message: 'Thêm sản phẩm thành công!', MaSP: result.insertId });
  } catch (error) {
    console.error('Lỗi khi thêm sản phẩm:', error.message || error);
    res.status(500).json({ error: 'Lỗi khi thêm sản phẩm', details: error.message || 'Không xác định' });
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


// Route cập nhật sản phẩm
router.put('/:id', upload.single('HinhAnh'), async (req, res) => {
  try {
    const { id } = req.params;
    const { MaTL, TenSP, MaTG, NamXB, TinhTrang, DonGia, SoLuong } = req.body;
    const HinhAnh = req.file ? req.file.filename : undefined; // Lấy tên file mới nếu upload

    const maTLNumber = parseInt(MaTL);
    const maTGNumber = parseInt(MaTG);
    const tenSPTrimmed = TenSP ? TenSP.trim() : '';

    // Validation bắt buộc
    if (isNaN(maTLNumber) || !tenSPTrimmed) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc (Mã TL, Tên SP)!' });
    }

    // Validation NamXB
    const namXBNumber = parseInt(NamXB);
    if (!isNaN(namXBNumber) && (namXBNumber < 1900 || namXBNumber > new Date().getFullYear())) {
      return res.status(400).json({ error: 'Năm xuất bản phải nằm trong khoảng từ 1900 đến năm hiện tại!' });
    }

    // Kiểm tra MaTG tồn tại nếu cung cấp
    if (!isNaN(maTGNumber)) {
      const [existingTacGia] = await pool.query('SELECT MaTG FROM tacgia WHERE MaTG = ?', [maTGNumber]);
      if (existingTacGia.length === 0) {
        return res.status(400).json({ error: `Mã tác giả (MaTG: ${maTGNumber}) không tồn tại trong bảng tacgia!` });
      }
    }

    // Mặc định TinhTrang là 0 nếu không cung cấp
    const tinhTrangValue = TinhTrang === '1' || TinhTrang === 1 ? 1 : 0;

    // Mặc định DonGia và SoLuong là 0 nếu không hợp lệ
    const donGiaValue = parseFloat(DonGia) || 0;
    const soLuongValue = parseInt(SoLuong) || 0;

    // Xây dựng câu query cập nhật
    let updateQuery = 'UPDATE sanpham SET MaTL = ?, TenSP = ?, ';
    const updateParams = [maTLNumber, tenSPTrimmed];

    if (HinhAnh !== undefined) updateParams.push(HinhAnh);
    if (isNaN(maTGNumber)) {
      updateQuery += 'MaTG = NULL, ';
    } else {
      updateQuery += 'MaTG = ?, ';
      updateParams.push(maTGNumber);
    }
    if (isNaN(namXBNumber)) {
      updateQuery += 'NamXB = NULL, ';
    } else {
      updateQuery += 'NamXB = ?, ';
      updateParams.push(namXBNumber);
    }
    updateQuery += 'TinhTrang = ?, DonGia = ?, SoLuong = ? WHERE MaSP = ?';
    updateParams.push(tinhTrangValue, donGiaValue, soLuongValue, id);

    // Thực hiện cập nhật
    const [result] = await pool.query(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc không có thay đổi!' });
    }

    res.status(200).json({ message: 'Cập nhật sản phẩm thành công!' });
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error.message || error);
    res.status(500).json({ error: 'Lỗi khi cập nhật sản phẩm', details: error.message || 'Không xác định' });
  }
});

// Route xóa sản phẩm
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM sanpham WHERE MaSP = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại!' });
    }

    res.status(200).json({ message: 'Xóa sản phẩm thành công!' });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi xóa sản phẩm', details: error.message });
  }
});

// Route tìm kiếm sản phẩm
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    let results;

    if (!keyword) {
      [results] = await pool.query('SELECT s.*, m.TenTG AS TacGia FROM sanpham s LEFT JOIN tacgia m ON s.MaTG = m.MaTG');
      return res.status(200).json({ type: 'list', data: results });
    }

    // Kiểm tra nếu keyword là mã thể loại (MaTL)
    const maTL = parseInt(keyword);
    if (!isNaN(maTL)) {
      const [categoryResults] = await pool.query(
        `SELECT s.*, m.TenTG AS TacGia 
         FROM sanpham s 
         LEFT JOIN tacgia m ON s.MaTG = m.MaTG 
         WHERE s.MaTL = ?`,
        [maTL]
      );
      if (categoryResults.length > 0) {
        return res.status(200).json({ type: 'category', data: categoryResults, MaTL: maTL });
      }
    }

    // Tìm kiếm theo MaSP hoặc TenSP
    const searchTerm = `%${keyword}%`;
    [results] = await pool.query(
      `SELECT s.*, m.TenTG AS TacGia 
       FROM sanpham s 
       LEFT JOIN tacgia m ON s.MaTG = m.MaTG 
       WHERE s.MaSP LIKE ? OR s.TenSP LIKE ?`,
      [searchTerm, searchTerm]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm phù hợp!' });
    }

    // Nếu chỉ tìm thấy 1 sản phẩm và khớp với MaSP, trả về chi tiết sản phẩm
    if (results.length === 1 && results[0].MaSP.toString() === keyword) {
      return res.status(200).json({ type: 'detail', data: results[0] });
    }

    // Nếu không, trả về danh sách sản phẩm
    res.status(200).json({ type: 'list', data: results });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi khi tìm kiếm sản phẩm', details: error.message });
  }
});

// Route lấy sản phẩm theo thể loại (giữ nguyên)
router.get('/category/:maTL', async (req, res) => {
  const maTL = req.params.maTL;
  try {
    const [products] = await pool.query(
      'SELECT s.*, m.TenTG AS TacGia ' +
      'FROM sanpham s ' +
      'LEFT JOIN tacgia m ON s.MaTG = m.MaTG ' +
      'WHERE s.MaTL = ?',
      [maTL]
    );
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/deal-hot', async (req, res) => {
  try {
    const { MaKM, limit = 20 } = req.query;

    // Kiểm tra và ép kiểu limit
    const limitNumber = parseInt(limit);
    if (isNaN(limitNumber) || limitNumber <= 0) {
      return res.status(400).json({ error: 'Giới hạn (limit) không hợp lệ' });
    }

    // Kiểm tra và ép kiểu MaKM
    let maKMNumber;
    if (MaKM) {
      maKMNumber = parseInt(MaKM);
      if (isNaN(maKMNumber)) {
        return res.status(400).json({ error: 'Mã khuyến mãi (MaKM) không hợp lệ' });
      }

      // Kiểm tra khuyến mãi tồn tại và hợp lệ
      const [promotion] = await pool.query(
        `SELECT MaKM FROM khuyen_mai 
         WHERE MaKM = ? AND TrangThai = 1 
         AND NgayBatDau <= NOW() AND NgayKetThuc >= NOW()`,
        [maKMNumber]
      );
      if (promotion.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy khuyến mãi hợp lệ với MaKM cung cấp' });
      }
    }

    // Xây dựng truy vấn SQL
    let query = `
      SELECT 
        s.MaSP, s.TenSP, s.HinhAnh, s.DonGia, s.SoLuong, s.NamXB, s.TinhTrang,
        t.TenTG AS TacGia,
        km.MaKM, km.TenKM, km.LoaiKM, km.MoTa
      FROM sanpham s
      LEFT JOIN tacgia t ON s.MaTG = t.MaTG
      INNER JOIN sp_khuyen_mai spkm ON s.MaSP = spkm.MaSP
      INNER JOIN khuyen_mai km ON spkm.MaKM = km.MaKM
      WHERE km.TrangThai = 1 
      AND km.NgayBatDau <= NOW() 
      AND km.NgayKetThuc >= NOW()
      AND s.TinhTrang = 1
    `;
    let params = [];

    // Lọc theo MaKM nếu có
    if (maKMNumber) {
      query += ' AND km.MaKM = ?';
      params.push(maKMNumber);
    }

    // Thêm giới hạn số lượng sản phẩm
    query += ' LIMIT ?';
    params.push(limitNumber);

    // Thực hiện truy vấn
    const [products] = await pool.query(query, params);
    console.log('Sản phẩm khuyến mãi thô:', products);

    // Xử lý giá sau giảm và thông tin khuyến mãi
    const enhancedProducts = products.map(product => {
      let GiaSauGiam = product.DonGia || 0;
      let PhanTramGiam = 0;
      let GhiChuKM = '';

      if (product.MaKM) {
        switch (product.LoaiKM) {
          case 'giam_phan_tram':
            const phanTramGiam = parseFloat(product.MoTa?.match(/(\d+)%/)?.[1] || 0);
            if (phanTramGiam > 0) {
              GiaSauGiam = product.DonGia * (1 - phanTramGiam / 100);
              PhanTramGiam = phanTramGiam;
            }
            break;
          case 'giam_tien_mat':
            const soTienGiam = parseFloat(product.MoTa?.match(/(\d+)(?:\.\d+)?/)?.[1] || 0);
            if (soTienGiam > 0) {
              GiaSauGiam = product.DonGia - soTienGiam;
              PhanTramGiam = ((soTienGiam / product.DonGia) * 100).toFixed(2);
            }
            break;
          case 'mua_x_tang_y':
            GhiChuKM = product.MoTa || 'Mua X tặng Y';
            break;
          case 'qua_tang':
            GhiChuKM = product.MoTa || 'Tặng quà khi mua sản phẩm';
            break;
          case 'combo':
            GhiChuKM = product.MoTa || 'Combo ưu đãi đặc biệt';
            break;
          default:
            GhiChuKM = product.MoTa || 'Khuyến mãi đặc biệt';
        }
      }

      return {
        ...product,
        GiaSauGiam: Math.max(0, Math.round(GiaSauGiam)),
        PhanTramGiam: parseFloat(PhanTramGiam) || 0,
        GhiChuKM,
      };
    });

    // Lọc bỏ các sản phẩm trùng lặp
    const uniqueProducts = Array.from(
      new Map(enhancedProducts.map(p => [p.MaSP, p])).values()
    );

    console.log('Sản phẩm khuyến mãi sau xử lý:', uniqueProducts);

    res.status(200).json(uniqueProducts);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm khuyến mãi:', error);
    res.status(500).json({ error: 'Lỗi khi lấy sản phẩm khuyến mãi', details: error.message });
  }
});
// ...existing code...

// Route lấy sản phẩm có MaTL là 1, 2, 3
router.get('/multi-category', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT s.*, m.TenTG AS TacGia 
       FROM sanpham s 
       LEFT JOIN tacgia m ON s.MaTG = m.MaTG 
       WHERE s.MaTL IN (1,2,3)`
    );
    res.status(200).json(products);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm nhiều thể loại:', error);
    res.status(500).json({ error: 'Lỗi khi lấy sản phẩm nhiều thể loại', details: error.message });
  }
});
router.get('/category-2', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT s.*, m.TenTG AS TacGia 
       FROM sanpham s 
       LEFT JOIN tacgia m ON s.MaTG = m.MaTG 
       WHERE s.MaTL = 2`
    );
    res.status(200).json(products);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm thể loại 2:', error);
    res.status(500).json({ error: 'Lỗi khi lấy sản phẩm thể loại 2', details: error.message });
  }
});
router.get('/tacgia', async (req, res) => {
  try {
    const maTG = 7; // Định nghĩa rõ ràng giá trị MaTG là 7
    const [products] = await pool.query(
      `SELECT s.*, m.TenTG AS TacGia 
       FROM sanpham s 
       LEFT JOIN tacgia m ON s.MaTG = m.MaTG 
       WHERE s.MaTG = ?`,
      [maTG]
    );

    // Thêm log để debug
    console.log('Sản phẩm với MaTG = 7:', products);

    // Kiểm tra và trả về dữ liệu
    if (products.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(products);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm với MaTG = 7:', error);
    res.status(500).json({ error: 'Lỗi khi lấy sản phẩm với MaTG = 7', details: error.message });
  }
});

// Route lấy sản phẩm khoa học (MaTL = 2)
router.get('/category/2', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT s.*, m.TenTG AS TacGia 
       FROM sanpham s 
       LEFT JOIN tacgia m ON s.MaTG = m.MaTG 
       WHERE s.MaTL = 2`
    );
    res.status(200).json(products);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm thể loại 2:', error);
    res.status(500).json({ error: 'Lỗi khi lấy sản phẩm thể loại 2', details: error.message });
  }
});


// Route lấy sản phẩm khoa học (MaTL = 2)
router.get('/category/4', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT s.*, m.TenTG AS TacGia 
       FROM sanpham s 
       LEFT JOIN tacgia m ON s.MaTG = m.MaTG 
       WHERE s.MaTL = 4`
    );
    res.status(200).json(products);
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm thể loại 4:', error);
    res.status(500).json({ error: 'Lỗi khi lấy sản phẩm thể loại 4', details: error.message });
  }
});
//Tim kiem san pham theo ten hoac theo tac gia 

export default router;