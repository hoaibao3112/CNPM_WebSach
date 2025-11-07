import express from 'express';
import pool from '../config/connectDatabase.js';
import { authenticateToken } from '../utils/generateToken.js';

const router = express.Router();

// Validation rules cho cấu trúc mới
const validatePromotion = (promotionData, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || promotionData.TenKM !== undefined) {
    if (!promotionData.TenKM?.trim()) {
      errors.push('Tên khuyến mãi là bắt buộc');
    } else if (promotionData.TenKM.length > 100) {
      errors.push('Tên khuyến mãi không quá 100 ký tự');
    }
  }

  if (!promotionData.NgayBatDau) {
    errors.push('Ngày bắt đầu là bắt buộc');
  }

  if (!promotionData.NgayKetThuc) {
    errors.push('Ngày kết thúc là bắt buộc');
  } else if (new Date(promotionData.NgayKetThuc) < new Date(promotionData.NgayBatDau)) {
    errors.push('Ngày kết thúc phải sau ngày bắt đầu');
  }

  if (!isUpdate || promotionData.LoaiKM !== undefined) {
    const validTypes = ['giam_phan_tram', 'giam_tien_mat', 'free_ship'];
    if (!promotionData.LoaiKM || !validTypes.includes(promotionData.LoaiKM)) {
      errors.push('Loại khuyến mãi không hợp lệ (chỉ giam_phan_tram, giam_tien_mat hoặc free_ship)');
    }
  }

  if (promotionData.LoaiKM === 'giam_tien_mat') {
    if (promotionData.SoLuongToiThieu < 1) {
      errors.push('Số lượng tối thiểu phải >= 1 cho loại giam_tien_mat');
    }
  }

  return errors;
};

// GET / - Lấy danh sách khuyến mãi
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', activeOnly = false, loaiKM = '' } = req.query;
    const offset = (page - 1) * limit;
    const searchTerm = `%${search}%`;

    let whereClause = `WHERE TenKM LIKE ?`;
    const params = [searchTerm];

    if (activeOnly === 'true') {
      whereClause += ` AND NgayBatDau <= NOW() AND NgayKetThuc >= NOW() AND TrangThai = 1`;
    }

    // Lọc theo loại khuyến mãi nếu có
    if (loaiKM && ['giam_phan_tram', 'giam_tien_mat', 'free_ship'].includes(loaiKM)) {
      whereClause += ` AND LoaiKM = ?`;
      params.push(loaiKM);
    }

    const [promotions] = await pool.query(
      `SELECT *, CAST(TrangThai AS UNSIGNED) as TrangThai FROM khuyen_mai
       ${whereClause}
       ORDER BY NgayBatDau DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM khuyen_mai ${whereClause}`,
      params
    );

    res.status(200).json({
      data: promotions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy danh sách khuyến mãi',
      details: error.message
    });
  }
});

// GET /my-promotions - Khuyến mãi của khách hàng
router.get('/my-promotions', authenticateToken, async (req, res) => {
  try {
    const makh = req.user.makh;
    const { activeOnly = false, loaiKM = '' } = req.query;

    let whereClause = `WHERE kk.makh = ?`;
    const params = [makh];

    if (activeOnly === 'true') {
      whereClause += ` AND kk.trang_thai = 'Chua_su_dung' AND kk.ngay_het_han >= NOW()`;
    }

    // Lọc theo loại khuyến mãi nếu có
    if (loaiKM && ['giam_phan_tram', 'giam_tien_mat', 'free_ship'].includes(loaiKM)) {
      whereClause += ` AND k.LoaiKM = ?`;
      params.push(loaiKM);
    }

    const [promotions] = await pool.query(
      `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.Code, k.MoTa, CAST(k.TrangThai AS UNSIGNED) as TrangThai,
       kk.ngay_lay, kk.ngay_het_han, kk.trang_thai,
       ct.GiaTriDonToiThieu, ct.GiaTriGiam, ct.GiamToiDa
       FROM khachhang_khuyenmai kk
       JOIN khuyen_mai k ON kk.makm = k.MaKM
       LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       ${whereClause}
       ORDER BY kk.ngay_lay DESC`,
      params
    );

    res.status(200).json({ data: promotions });
  } catch (error) {
    console.error('Error fetching my promotions:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy khuyến mãi của bạn',
      details: error.message
    });
  }
});

// GET /active-products - Lấy danh sách sản phẩm đang được khuyến mãi (active)
// Trả về mỗi sản phẩm kèm thông tin khuyến mãi áp dụng (nếu nhiều khuyến mãi, lấy khuyến mãi có ưu tiên cao nhất theo GiaTriGiam/GiamToiDa)
router.get('/active-products', async (req, res) => {
  try {
    // Lấy tất cả các khuyến mãi đang active
    const [activePromotions] = await pool.query(
      `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.Code, CAST(k.TrangThai AS UNSIGNED) as TrangThai,
              ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
       FROM khuyen_mai k
       JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       WHERE k.TrangThai = 1
         AND k.NgayBatDau <= NOW()
         AND k.NgayKetThuc >= NOW()`
    );

    if (activePromotions.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Lấy tất cả sản phẩm áp dụng cho các khuyến mãi active
    // Trả về: MaSP, TenSP, HinhAnh (nếu có), DonGia, MaKM, thông tin khuyến mãi
    const [rows] = await pool.query(
      `SELECT sp.MaSP, sp.TenSP, sp.HinhAnh, sp.DonGia, km.MaKM, km.TenKM, km.LoaiKM,
              ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu, k.Code,
              k.NgayBatDau, k.NgayKetThuc
       FROM sp_khuyen_mai spkm
       JOIN sanpham sp ON spkm.MaSP = sp.MaSP
       JOIN khuyen_mai km ON spkm.MaKM = km.MaKM
       JOIN ct_khuyen_mai ct ON km.MaKM = ct.MaKM
       JOIN khuyen_mai k ON k.MaKM = km.MaKM
       WHERE k.TrangThai = 1
         AND k.NgayBatDau <= NOW()
         AND k.NgayKetThuc >= NOW()`
    );

    // Nếu không có sản phẩm được liên kết -> empty
    if (rows.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Gom nhóm theo MaSP, nếu 1 sản phẩm có nhiều khuyến mãi active thì chọn khuyến mãi tốt nhất
    const grouped = {};
    for (const r of rows) {
      const key = r.MaSP;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }

    const result = Object.values(grouped).map(list => {
      // Chọn khuyến mãi ưu tiên: nếu có giam_phan_tram -> chọn theo % lớn nhất; nếu giam_tien_mat -> theo giá tiền lớn nhất
      let best = list[0];
      for (const item of list) {
        if (item.LoaiKM === 'giam_phan_tram' && best.LoaiKM === 'giam_phan_tram') {
          if ((item.GiaTriGiam || 0) > (best.GiaTriGiam || 0)) best = item;
        } else if (item.LoaiKM === 'giam_tien_mat' && best.LoaiKM === 'giam_tien_mat') {
          if ((item.GiaTriGiam || 0) > (best.GiaTriGiam || 0)) best = item;
        } else if (item.LoaiKM === 'giam_phan_tram' && best.LoaiKM === 'giam_tien_mat') {
          // ưu tiên phần trăm hơn tiền mặt
          best = item;
        }
      }

      return {
        MaSP: best.MaSP,
        TenSP: best.TenSP,
        HinhAnh: best.HinhAnh || null,
        DonGia: best.DonGia,
        MaKM: best.MaKM,
        TenKM: best.TenKM,
        LoaiKM: best.LoaiKM,
        GiaTriGiam: best.GiaTriGiam,
        GiaTriDonToiThieu: best.GiaTriDonToiThieu,
        GiamToiDa: best.GiamToiDa,
        SoLuongToiThieu: best.SoLuongToiThieu,
        Code: best.Code,
        NgayBatDau: best.NgayBatDau,
        NgayKetThuc: best.NgayKetThuc
      };
    });

    res.status(200).json({ data: result });
  } catch (error) {
    console.error('Error fetching active sale products:', error);
    res.status(500).json({ error: 'Lỗi khi lấy sản phẩm khuyến mãi', details: error.message });
  }
});

// GET /:makm - Chi tiết khuyến mãi
router.get('/:makm', async (req, res) => {
  try {
    const makm = req.params.makm;

    const [[promotion]] = await pool.query(
      `SELECT k.*, CAST(k.TrangThai AS UNSIGNED) as TrangThai, 
       ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
       FROM khuyen_mai k
       LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       WHERE k.MaKM = ?`,
      [makm]
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });
    }

    let products = [];
    try {
      [products] = await pool.query(
        `SELECT s.MaSP, s.TenSP 
         FROM sp_khuyen_mai spkm 
         JOIN sanpham s ON spkm.MaSP = s.MaSP 
         WHERE spkm.MaKM = ?`,
        [makm]
      );
    } catch (e) {
      // Nếu lỗi do bảng/cột, trả về mảng rỗng thay vì lỗi 500
      products = [];
    }

    res.status(200).json({
      ...promotion,
      SanPhamApDung: products // [{MaSP, TenSP}]
    });
  } catch (error) {
    console.error('Error fetching promotion detail:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy chi tiết khuyến mãi',
      details: error.message
    });
  }
});

// POST / - Thêm khuyến mãi mới
router.post('/', authenticateToken, async (req, res) => {
  try {
    const promotionData = req.body;
    const errors = validatePromotion(promotionData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [result] = await connection.query(
        `INSERT INTO khuyen_mai (TenKM, MoTa, NgayBatDau, NgayKetThuc, LoaiKM, Code)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [promotionData.TenKM, promotionData.MoTa || null, promotionData.NgayBatDau, promotionData.NgayKetThuc, promotionData.LoaiKM, promotionData.Code || null]
      );

      const makm = result.insertId;

      // Với Free Ship: GiaTriGiam = 0 (vì không giảm tiền sản phẩm)
      const giaTriGiam = promotionData.LoaiKM === 'free_ship' ? 0 : (promotionData.GiaTriGiam || 0);

      await connection.query(
        `INSERT INTO ct_khuyen_mai (MaKM, GiaTriGiam, GiaTriDonToiThieu, GiamToiDa, SoLuongToiThieu)
         VALUES (?, ?, ?, ?, ?)`,
        [makm, giaTriGiam, promotionData.GiaTriDonToiThieu || null, promotionData.GiamToiDa || null, promotionData.SoLuongToiThieu || 1]
      );

      // Logic xử lý sản phẩm áp dụng:
      // - Nếu có chọn sản phẩm cụ thể -> lưu vào sp_khuyen_mai
      // - Nếu không chọn sản phẩm nào (mảng rỗng hoặc undefined) -> áp dụng cho tất cả (không lưu vào sp_khuyen_mai)
      if (promotionData.SanPhamApDung && Array.isArray(promotionData.SanPhamApDung) && promotionData.SanPhamApDung.length > 0) {
        // Có chọn sản phẩm cụ thể -> lưu vào bảng sp_khuyen_mai
        for (const masp of promotionData.SanPhamApDung) {
          await connection.query(`INSERT INTO sp_khuyen_mai (MaKM, MaSP) VALUES (?, ?)`, [makm, masp]);
        }
      }
      // Nếu không có sản phẩm nào được chọn -> không lưu gì vào sp_khuyen_mai (áp dụng cho tất cả)

      await connection.commit();

      res.status(201).json({ message: 'Thêm khuyến mãi thành công', makm });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error adding promotion:', error);
    res.status(500).json({
      error: 'Lỗi khi thêm khuyến mãi',
      details: error.message
    });
  }
});

// PUT /:makm - Sửa khuyến mãi
router.put('/:makm', authenticateToken, async (req, res) => {
  try {
    const makm = req.params.makm;
    const promotionData = req.body;
    const errors = validatePromotion(promotionData, true);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Cập nhật khuyen_mai
      await connection.query(
        `UPDATE khuyen_mai SET TenKM = ?, MoTa = ?, NgayBatDau = ?, NgayKetThuc = ?, LoaiKM = ?, Code = ? WHERE MaKM = ?`,
        [promotionData.TenKM || null, promotionData.MoTa || null, promotionData.NgayBatDau || null, promotionData.NgayKetThuc || null, promotionData.LoaiKM || null, promotionData.Code || null, makm]
      );

      // Cập nhật ct_khuyen_mai
      // Với Free Ship: GiaTriGiam = 0 (vì không giảm tiền sản phẩm)
      const giaTriGiam = promotionData.LoaiKM === 'free_ship' ? 0 : (promotionData.GiaTriGiam || 0);
      
      await connection.query(
        `UPDATE ct_khuyen_mai SET GiaTriGiam = ?, GiaTriDonToiThieu = ?, GiamToiDa = ?, SoLuongToiThieu = ? WHERE MaKM = ?`,
        [giaTriGiam, promotionData.GiaTriDonToiThieu || null, promotionData.GiamToiDa || null, promotionData.SoLuongToiThieu || null, makm]
      );

      // Xóa tất cả sản phẩm áp dụng cũ
      await connection.query(`DELETE FROM sp_khuyen_mai WHERE MaKM = ?`, [makm]);

      // Logic tương tự như POST:
      // - Nếu có chọn sản phẩm cụ thể -> lưu vào sp_khuyen_mai
      // - Nếu không chọn sản phẩm nào -> áp dụng cho tất cả (không lưu vào sp_khuyen_mai)
      if (promotionData.SanPhamApDung && Array.isArray(promotionData.SanPhamApDung) && promotionData.SanPhamApDung.length > 0) {
        // Có chọn sản phẩm cụ thể -> lưu vào bảng sp_khuyen_mai
        for (const masp of promotionData.SanPhamApDung) {
          await connection.query(`INSERT INTO sp_khuyen_mai (MaKM, MaSP) VALUES (?, ?)`, [makm, masp]);
        }
      }
      // Nếu không có sản phẩm nào được chọn -> không lưu gì vào sp_khuyen_mai (áp dụng cho tất cả)

      await connection.commit();

      res.status(200).json({ message: 'Cập nhật khuyến mãi thành công' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({
      error: 'Lỗi khi cập nhật khuyến mãi',
      details: error.message
    });
  }
});
// DELETE /:makm - Xóa khuyến mãi - ĐÃ SỬA
router.delete('/:makm', authenticateToken, async (req, res) => {
  try {
    const makm = req.params.makm;

    // Kiểm tra khuyến mãi có tồn tại không
    const [[promotion]] = await pool.query(
      `SELECT MaKM FROM khuyen_mai WHERE MaKM = ?`,
      [makm]
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Xóa các bản ghi trong bảng khachhang_khuyenmai (nếu có)
      await connection.query(
        `DELETE FROM khachhang_khuyenmai WHERE makm = ?`,
        [makm]
      );

      // 2. Xóa các bản ghi trong bảng sp_khuyen_mai (sản phẩm áp dụng)
      await connection.query(
        `DELETE FROM sp_khuyen_mai WHERE MaKM = ?`,
        [makm]
      );

      // 3. Xóa bản ghi trong bảng ct_khuyen_mai (chi tiết khuyến mãi)
      await connection.query(
        `DELETE FROM ct_khuyen_mai WHERE MaKM = ?`,
        [makm]
      );

      // 4. Cuối cùng xóa bản ghi chính trong bảng khuyen_mai
      await connection.query(
        `DELETE FROM khuyen_mai WHERE MaKM = ?`,
        [makm]
      );

      await connection.commit();

      res.status(200).json({
        message: 'Xóa khuyến mãi thành công',
        makm
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({
      error: 'Lỗi khi xóa khuyến mãi',
      details: error.message
    });
  }
});

// PATCH /:makm/trangthai - Cập nhật trạng thái khuyến mãi
router.patch('/:makm/trangthai', authenticateToken, async (req, res) => {
  try {
    const makm = req.params.makm;
    const { trangThai } = req.body;

    // Kiểm tra trạng thái hợp lệ (0 hoặc 1)
    if (trangThai !== 0 && trangThai !== 1) {
      return res.status(400).json({ error: 'Trạng thái chỉ được là 0 hoặc 1' });
    }

    // Kiểm tra khuyến mãi có tồn tại không
    const [[promotion]] = await pool.query(
      `SELECT MaKM FROM khuyen_mai WHERE MaKM = ?`,
      [makm]
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });
    }

    // Cập nhật trạng thái
    await pool.query(
      `UPDATE khuyen_mai SET TrangThai = ? WHERE MaKM = ?`,
      [trangThai, makm]
    );

    res.status(200).json({
      message: 'Cập nhật trạng thái thành công',
      makm,
      trangThai
    });
  } catch (error) {
    console.error('Error updating promotion status:', error);
    res.status(500).json({
      error: 'Lỗi khi cập nhật trạng thái khuyến mãi',
      details: error.message
    });
  }
});

// POST /apply-to-cart - Áp dụng khuyến mãi vào giỏ hàng
router.post('/apply-to-cart', authenticateToken, async (req, res) => {
  try {
    const { code, cartItems, makh } = req.body;

    // 1. Kiểm tra input
    // ✅ FIX: Cho phép cartItems = [] để hiển thị modal gợi ý sản phẩm khi giỏ trống
    if (!code || !cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({ error: 'Thiếu thông tin: Mã khuyến mãi hoặc giỏ hàng' });
    }

    // 2. Lấy thông tin khuyến mãi
    const [[promotion]] = await pool.query(
      `SELECT k.*, CAST(k.TrangThai AS UNSIGNED) AS TrangThai,
              ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
       FROM khuyen_mai k
       JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       WHERE k.code = ? 
         AND k.TrangThai = 1 
         AND k.NgayBatDau <= NOW() 
         AND k.NgayKetThuc >= NOW()`,
      [code]
    );

    if (!promotion) {
      return res.status(400).json({ error: 'Khuyến mãi không hợp lệ hoặc đã hết hạn' });
    }

    const MaKM = promotion.MaKM;

    // 3. Kiểm tra khách hàng đã claim mã chưa
    const [[claim]] = await pool.query(
      `SELECT * 
       FROM khachhang_khuyenmai 
       WHERE makh = ? 
         AND makm = ? 
         AND trang_thai = 'Chua_su_dung' 
         AND ngay_het_han >= NOW()`,
      [makh, MaKM]
    );

    if (!claim) {
      return res.status(401).json({ error: 'Bạn chưa nhận mã này hoặc đã hết hạn/sử dụng' });
    }

    // 4. Lấy TOÀN BỘ sản phẩm được áp dụng khuyến mãi này
    const [allKMProducts] = await pool.query(
      `SELECT sp.MaSP, sp.TenSP, sp.DonGia, sp.HinhAnh
       FROM sp_khuyen_mai km
       JOIN sanpham sp ON km.MaSP = sp.MaSP
       WHERE km.MaKM = ?`,
      [MaKM]
    );

    // ✅ FIX: Chuẩn hóa đường dẫn ảnh - xử lý nhiều trường hợp
    allKMProducts.forEach(product => {
      if (product.HinhAnh) {
        let imgPath = product.HinhAnh;
        
        // Trường hợp 1: Đường dẫn đầy đủ (img/product/sp08.jpg)
        if (imgPath.startsWith('img/product/')) {
          product.HinhAnh = imgPath;
        }
        // Trường hợp 2: Chỉ có đường dẫn img/ (img/sp08.jpg)
        else if (imgPath.startsWith('img/')) {
          product.HinhAnh = imgPath.replace('img/', 'img/product/');
        }
        // Trường hợp 3: Chỉ có tên file (sp08.jpg)
        else {
          product.HinhAnh = `img/product/${imgPath}`;
        }
      } else {
        // Không có ảnh -> dùng default
        product.HinhAnh = 'img/product/default.jpg';
      }
    });

    if (allKMProducts.length === 0) {
      return res.status(400).json({ 
        error: 'Khuyến mãi này chưa được liên kết với sản phẩm nào',
        suggestedProducts: []
      });
    }

    // ✅ FIX: Nếu giỏ hàng TRỐNG → Trả về gợi ý ngay, không cần kiểm tra tiếp
    if (cartItems.length === 0) {
      console.log('🔍 [API] Giỏ hàng trống, trả 402 với gợi ý ngay');
      const response = { 
        error: 'Giỏ hàng trống',
        message: `Mã "${promotion.TenKM}" chỉ áp dụng cho ${allKMProducts.length} sản phẩm. Vui lòng thêm sản phẩm vào giỏ hàng!`,
        suggestedProducts: allKMProducts.map(p => ({
          MaSP: p.MaSP,
          TenSP: p.TenSP,
          DonGia: p.DonGia,
          HinhAnh: p.HinhAnh
        })),
        requirements: {
          minAmount: promotion.GiaTriDonToiThieu || 0,
          minQuantity: promotion.SoLuongToiThieu || 0
        }
      };
      console.log('🔍 [API] Response:', JSON.stringify(response, null, 2));
      return res.status(402).json(response);
    }

    // 5. Kiểm tra sản phẩm nào trong giỏ được áp dụng khuyến mãi
    const results = await Promise.all(
      cartItems.map(async (item) => {
        const [rows] = await pool.query(
          `SELECT sp.MaSP, sp.DonGia
           FROM sp_khuyen_mai km
           JOIN sanpham sp ON km.MaSP = sp.MaSP
           WHERE km.MaKM = ? AND km.MaSP = ?`,
          [MaKM, item.MaSP]
        );

        if (rows.length > 0) {
          return {
            ...item,
            DonGia: rows[0].DonGia
          };
        }
        return null;
      })
    );

    const kmProducts = results.filter(Boolean);

    // 6. Nếu KHÔNG CÓ sản phẩm khuyến mãi trong giỏ → Gợi ý thêm sản phẩm
    if (kmProducts.length === 0) {
      console.log('🔍 [API] Giỏ hàng không có sản phẩm KM, trả 402 với gợi ý');
      console.log('🔍 [API] Số sản phẩm gợi ý:', allKMProducts.length);
      
      const response = { 
        error: 'Giỏ hàng chưa có sản phẩm được giảm giá',
        message: `Mã "${promotion.TenKM}" chỉ áp dụng cho ${allKMProducts.length} sản phẩm. Vui lòng thêm sản phẩm vào giỏ hàng!`,
        suggestedProducts: allKMProducts.map(p => ({
          MaSP: p.MaSP,
          TenSP: p.TenSP,
          DonGia: p.DonGia,
          HinhAnh: p.HinhAnh
        })),
        requirements: {
          minAmount: promotion.GiaTriDonToiThieu || 0,
          minQuantity: promotion.SoLuongToiThieu || 0
        }
      };
      
      console.log('🔍 [API] Response:', JSON.stringify(response, null, 2));
      return res.status(402).json(response);
    }

    // 7. Phân loại sản phẩm
    const kmProductIds = kmProducts.map(p => p.MaSP);
    const nonKmProducts = cartItems.filter(item => !kmProductIds.includes(item.MaSP));

    // 8. Tính tổng tiền
    const subtotal = kmProducts.reduce((sum, item) => sum + item.DonGia * item.SoLuong, 0);
    const tongSoLuong = kmProducts.reduce((sum, item) => sum + item.SoLuong, 0);
    const tongTienKhongGiam = nonKmProducts.reduce((sum, item) => sum + item.DonGia * item.SoLuong, 0);

    // 9. Kiểm tra điều kiện TRƯỚC KHI tính giảm giá
    const minAmount = promotion.GiaTriDonToiThieu || 0;
    const minQuantity = promotion.SoLuongToiThieu || 0;
    const missingAmount = Math.max(0, minAmount - subtotal);
    const missingQuantity = Math.max(0, minQuantity - tongSoLuong);

    // Nếu KHÔNG ĐỦ điều kiện → Gợi ý sản phẩm cần thêm
    if (subtotal < minAmount || tongSoLuong < minQuantity) {
      // Lọc sản phẩm chưa có trong giỏ hoặc có thể mua thêm
      const cartProductIds = kmProducts.map(p => p.MaSP);
      const suggestedProducts = allKMProducts.filter(p => !cartProductIds.includes(p.MaSP));

      return res.status(403).json({
        error: 'Chưa đủ điều kiện áp dụng mã giảm giá',
        message: `Để sử dụng mã "${promotion.TenKM}", bạn cần:`,
        currentStatus: {
          currentAmount: subtotal,
          currentQuantity: tongSoLuong,
          productsInCart: kmProducts.length
        },
        requirements: {
          minAmount: minAmount,
          minQuantity: minQuantity,
          missingAmount: missingAmount,
          missingQuantity: missingQuantity
        },
        suggestions: {
          message: missingAmount > 0 
            ? `Thêm ${missingAmount.toLocaleString('vi-VN')}đ sản phẩm khuyến mãi nữa` 
            : `Thêm ${missingQuantity} sản phẩm khuyến mãi nữa`,
          availableProducts: suggestedProducts.length > 0 ? suggestedProducts : allKMProducts,
          note: suggestedProducts.length > 0 
            ? 'Các sản phẩm dưới đây được giảm giá và chưa có trong giỏ hàng của bạn:' 
            : 'Bạn có thể mua thêm các sản phẩm sau để đủ điều kiện:'
        }
      });
    }

    // 10. Tính giảm giá
    let totalDiscount = 0;
    let total = subtotal + tongTienKhongGiam
    let totalFinal = 0;
    let discountDetails = null;
    console.log(promotion)
    switch (promotion.LoaiKM) {
      case 'giam_phan_tram': {
        console.log("ntádasdassadas")
        // Điều kiện đã kiểm tra ở trên rồi, chỉ cần tính giảm giá
        totalDiscount = subtotal * (promotion.GiaTriGiam / 100);
        totalDiscount = Math.min(totalDiscount, promotion.GiamToiDa || Infinity, subtotal);
        totalFinal = (subtotal - totalDiscount) + tongTienKhongGiam;

        discountDetails = {
          discountType: 'percentage',
          value: promotion.GiaTriGiam,
          discountAmount: totalDiscount,
          total,
          totalFinal,
          products: kmProducts
        };
        break;
      }

      case 'giam_tien_mat': {
        // Điều kiện đã kiểm tra ở trên rồi, chỉ cần tính giảm giá
        totalDiscount = promotion.GiaTriGiam;
        totalFinal = (subtotal - totalDiscount) + tongTienKhongGiam;

        discountDetails = {
          discountType: 'fixed_amount',
          value: promotion.GiaTriGiam,
          discountAmount: totalDiscount,
          total,
          totalFinal,
          products: kmProducts
        };
        break;
      }

      case 'free_ship': {
        // Khuyến mãi free ship: không giảm tiền sản phẩm, chỉ miễn phí vận chuyển
        totalFinal = subtotal + tongTienKhongGiam;

        discountDetails = {
          discountType: 'free_ship',
          value: 0,
          discountAmount: 0,
          total,
          totalFinal,
          products: kmProducts,
          freeShip: true // Đánh dấu để frontend/backend biết đơn này được free ship
        };
        break;
      }

      default:
        return res.status(400).json({ error: 'Loại khuyến mãi không được hỗ trợ' });
    }

    if (!discountDetails) {
      return res.status(403).json({ error: 'Điều kiện áp dụng khuyến mãi không đạt yêu cầu' });
    }

    // 8. Trả về kết quả
    res.status(200).json({
      success: true,
      discountDetails
    });

  } catch (error) {
    console.error('Error applying promotion to cart:', error);
    res.status(500).json({
      error: 'Lỗi khi áp dụng khuyến mãi',
      details: error.message
    });
  }
});



// POST /claim/:makm - Lấy mã khuyến mãi
router.post('/claim/:makm', authenticateToken, async (req, res) => {
  try {
    const makm = req.params.makm;
    const makh = req.user.makh;

    const [[customer]] = await pool.query('SELECT * FROM khachhang WHERE makh = ?', [makh]);
    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    const [[promotion]] = await pool.query(
      `SELECT *, CAST(TrangThai AS UNSIGNED) as TrangThai FROM khuyen_mai 
       WHERE MaKM = ? AND TrangThai = 1 
       AND NgayBatDau <= NOW() AND NgayKetThuc >= NOW()`,
      [makm]
    );
    if (!promotion) {
      return res.status(400).json({ error: 'Mã khuyến mãi không hợp lệ hoặc hết hạn' });
    }

    const [[existingClaim]] = await pool.query(
      `SELECT * FROM khachhang_khuyenmai 
       WHERE makh = ? AND makm = ?`,
      [makh, makm]
    );
    if (existingClaim) {
      return res.status(400).json({ error: 'Bạn đã lấy mã khuyến mãi này rồi' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        `INSERT INTO khachhang_khuyenmai (makh, makm, ngay_lay, ngay_het_han, trang_thai) 
         VALUES (?, ?, NOW(), ?, 'Chua_su_dung')`,
        [makh, makm, promotion.NgayKetThuc]
      );

      await connection.commit();

      res.status(200).json({
        message: 'Lấy mã khuyến mãi thành công!',
        makm,
        code: promotion.Code || '',
        ngay_lay: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error claiming promotion:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy mã khuyến mãi',
      details: error.message
    });
  }
});

export default router;

// GET /active-products - Lấy danh sách sản phẩm đang được khuyến mãi (active)
// Trả về mỗi sản phẩm kèm thông tin khuyến mãi áp dụng (nếu nhiều khuyến mãi, lấy khuyến mãi có ưu tiên cao nhất theo GiaTriGiam/GiamToiDa)
router.get('/active-products', async (req, res) => {
  try {
    // Lấy tất cả các khuyến mãi đang active
    const [activePromotions] = await pool.query(
      `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.Code, CAST(k.TrangThai AS UNSIGNED) as TrangThai,
              ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
       FROM khuyen_mai k
       JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       WHERE k.TrangThai = 1
         AND k.NgayBatDau <= NOW()
         AND k.NgayKetThuc >= NOW()`
    );

    if (activePromotions.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Lấy tất cả sản phẩm áp dụng cho các khuyến mãi active
    // Trả về: MaSP, TenSP, HinhAnh (nếu có), DonGia, MaKM, thông tin khuyến mãi
    const [rows] = await pool.query(
      `SELECT sp.MaSP, sp.TenSP, sp.HinhAnh, sp.DonGia, km.MaKM, km.TenKM, km.LoaiKM,
              ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu, k.Code,
              k.NgayBatDau, k.NgayKetThuc
       FROM sp_khuyen_mai spkm
       JOIN sanpham sp ON spkm.MaSP = sp.MaSP
       JOIN khuyen_mai km ON spkm.MaKM = km.MaKM
       JOIN ct_khuyen_mai ct ON km.MaKM = ct.MaKM
       JOIN khuyen_mai k ON k.MaKM = km.MaKM
       WHERE k.TrangThai = 1
         AND k.NgayBatDau <= NOW()
         AND k.NgayKetThuc >= NOW()`
    );

    // Nếu không có sản phẩm được liên kết -> empty
    if (rows.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Gom nhóm theo MaSP, nếu 1 sản phẩm có nhiều khuyến mãi active thì chọn khuyến mãi tốt nhất
    const grouped = {};
    for (const r of rows) {
      const key = r.MaSP;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }

    const result = Object.values(grouped).map(list => {
      // Chọn khuyến mãi ưu tiên: nếu có giam_phan_tram -> chọn theo % lớn nhất; nếu giam_tien_mat -> theo giá tiền lớn nhất
      let best = list[0];
      for (const item of list) {
        if (item.LoaiKM === 'giam_phan_tram' && best.LoaiKM === 'giam_phan_tram') {
          if ((item.GiaTriGiam || 0) > (best.GiaTriGiam || 0)) best = item;
        } else if (item.LoaiKM === 'giam_tien_mat' && best.LoaiKM === 'giam_tien_mat') {
          if ((item.GiaTriGiam || 0) > (best.GiaTriGiam || 0)) best = item;
        } else if (item.LoaiKM === 'giam_phan_tram' && best.LoaiKM === 'giam_tien_mat') {
          // ưu tiên phần trăm hơn tiền mặt
          best = item;
        }
      }

      return {
        MaSP: best.MaSP,
        TenSP: best.TenSP,
        HinhAnh: best.HinhAnh || null,
        DonGia: best.DonGia,
        MaKM: best.MaKM,
        TenKM: best.TenKM,
        LoaiKM: best.LoaiKM,
        GiaTriGiam: best.GiaTriGiam,
        GiaTriDonToiThieu: best.GiaTriDonToiThieu,
        GiamToiDa: best.GiamToiDa,
        SoLuongToiThieu: best.SoLuongToiThieu,
        Code: best.Code,
        NgayBatDau: best.NgayBatDau,
        NgayKetThuc: best.NgayKetThuc
      };
    });

    res.status(200).json({ data: result });
  } catch (error) {
    console.error('Error fetching active sale products:', error);
    res.status(500).json({ error: 'Lỗi khi lấy sản phẩm khuyến mãi', details: error.message });
  }
});