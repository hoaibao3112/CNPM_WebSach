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
    const validTypes = ['giam_phan_tram', 'giam_tien_mat'];
    if (!promotionData.LoaiKM || !validTypes.includes(promotionData.LoaiKM)) {
      errors.push('Loại khuyến mãi không hợp lệ (chỉ giam_phan_tram hoặc giam_tien_mat)');
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
    const { page = 1, limit = 10, search = '', activeOnly = false } = req.query;
    const offset = (page - 1) * limit;
    const searchTerm = `%${search}%`;
    
    let whereClause = `WHERE TenKM LIKE ?`;
    const params = [searchTerm];
    
    if (activeOnly === 'true') {
      whereClause += ` AND NgayBatDau <= NOW() AND NgayKetThuc >= NOW() AND TrangThai = 1`;
    }

    const [promotions] = await pool.query(
      `SELECT * FROM khuyen_mai
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
    const { activeOnly = false } = req.query;

    let whereClause = `WHERE kk.makh = ?`;
    const params = [makh];

    if (activeOnly === 'true') {
      whereClause += ` AND kk.trang_thai = 'Chua_su_dung' AND kk.ngay_het_han >= NOW()`;
    }

    const [promotions] = await pool.query(
      `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.Code, kk.ngay_lay, kk.trang_thai
       FROM khachhang_khuyenmai kk
       JOIN khuyen_mai k ON kk.makm = k.MaKM
       ${whereClause}`,
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

// GET /:makm - Chi tiết khuyến mãi
router.get('/:makm', async (req, res) => {
  try {
    const makm = req.params.makm;

    const [[promotion]] = await pool.query(
      `SELECT k.*, ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
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

      await connection.query(
        `INSERT INTO ct_khuyen_mai (MaKM, GiaTriGiam, GiaTriDonToiThieu, GiamToiDa, SoLuongToiThieu)
         VALUES (?, ?, ?, ?, ?)`,
        [makm, promotionData.GiaTriGiam, promotionData.GiaTriDonToiThieu || null, promotionData.GiamToiDa || null, promotionData.SoLuongToiThieu || 1]
      );

      // Thêm sản phẩm áp dụng nếu có
      if (promotionData.SanPhamApDung && promotionData.LoaiKM === 'giam_tien_mat') {
        for (const masp of promotionData.SanPhamApDung) {
          await connection.query(`INSERT INTO sp_khuyen_mai (MaKM, MaSP) VALUES (?, ?)`, [makm, masp]);
        }
      }

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
      await connection.query(
        `UPDATE ct_khuyen_mai SET GiaTriGiam = ?, GiaTriDonToiThieu = ?, GiamToiDa = ?, SoLuongToiThieu = ? WHERE MaKM = ?`,
        [promotionData.GiaTriGiam || null, promotionData.GiaTriDonToiThieu || null, promotionData.GiamToiDa || null, promotionData.SoLuongToiThieu || null, makm]
      );

      // Cập nhật sp_khuyen_mai (xóa cũ, thêm mới nếu có)
      if (promotionData.SanPhamApDung && promotionData.LoaiKM === 'giam_tien_mat') {
        await connection.query(`DELETE FROM sp_khuyen_mai WHERE MaKM = ?`, [makm]);
        for (const masp of promotionData.SanPhamApDung) {
          await connection.query(`INSERT INTO sp_khuyen_mai (MaKM, MaSP) VALUES (?, ?)`, [makm, masp]);
        }
      }

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

// DELETE /:makm - Xóa khuyến mãi
router.delete('/:makm', authenticateToken, async (req, res) => {
  try {
    const makm = req.params.makm;

    await pool.query(`DELETE FROM khuyen_mai WHERE MaKM = ?`, [makm]);

    res.status(200).json({ message: 'Xóa khuyến mãi thành công' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ 
      error: 'Lỗi khi xóa khuyến mãi',
      details: error.message 
    });
  }
});

// POST /apply-to-cart - Áp dụng khuyến mãi vào giỏ hàng
router.post('/apply-to-cart', authenticateToken, async (req, res) => {
  try {
    const { MaKM, cartItems } = req.body;
    const makh = req.user.makh;

    if (!MaKM || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Thiếu thông tin: MaKM hoặc giỏ hàng' });
    }

    const [[promotion]] = await pool.query(
      `SELECT k.*, ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
       FROM khuyen_mai k
       JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       WHERE k.MaKM = ? AND k.TrangThai = 1 
       AND k.NgayBatDau <= NOW() AND k.NgayKetThuc >= NOW()`,
      [MaKM]
    );

    if (!promotion) {
      return res.status(400).json({ error: 'Khuyến mãi không hợp lệ hoặc hết hạn' });
    }

    const [[claim]] = await pool.query(
      `SELECT * FROM khachhang_khuyenmai WHERE makh = ? AND makm = ? AND trang_thai = 'Chua_su_dung' AND ngay_het_han >= NOW()`,
      [makh, MaKM]
    );

    if (!claim) {
      return res.status(400).json({ error: 'Bạn chưa lấy mã khuyến mãi này hoặc mã đã hết hạn/sử dụng' });
    }

    const [validProducts] = await pool.query(
      `SELECT MaSP FROM sp_khuyen_mai WHERE MaKM = ?`,
      [MaKM]
    );
    const validProductIds = validProducts.map(p => p.MaSP);

    let subtotal = 0;
    let totalDiscount = 0;
    const discountDetails = [];
    const giftProducts = [];

    cartItems.forEach(item => {
      subtotal += item.DonGia * item.SoLuong;
    });

    switch (promotion.LoaiKM) {
      case 'giam_phan_tram':
        if (subtotal >= (promotion.GiaTriDonToiThieu || 0)) {
          totalDiscount = subtotal * (promotion.GiaTriGiam / 100);
          totalDiscount = Math.min(totalDiscount, promotion.GiamToiDa || Infinity, subtotal);
          discountDetails.push({
            discountType: 'percentage',
            value: promotion.GiaTriGiam,
            discountAmount: totalDiscount
          });
        }
        break;

      case 'giam_tien_mat':
        let applicableQuantity = 0;
        cartItems.forEach(item => {
          if (validProductIds.includes(item.MaSP) && item.SoLuong >= (promotion.SoLuongToiThieu || 1)) {
            applicableQuantity += Math.floor(item.SoLuong / promotion.SoLuongToiThieu);
          }
        });
        if (applicableQuantity > 0 && subtotal >= (promotion.GiaTriDonToiThieu || 0)) {
          totalDiscount = promotion.GiaTriGiam * applicableQuantity;
          totalDiscount = Math.min(totalDiscount, promotion.GiamToiDa || Infinity, subtotal);
          discountDetails.push({
            discountType: 'fixed_amount',
            value: promotion.GiaTriGiam,
            discountAmount: totalDiscount
          });
        }
        break;

      default:
        return res.status(400).json({ error: 'Loại khuyến mãi không hỗ trợ' });
    }

    const finalTotal = Math.max(0, subtotal - totalDiscount);

    res.status(200).json({
      success: true,
      totalDiscount,
      discountDetails,
      giftProducts,
      finalTotal
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
      `SELECT * FROM khuyen_mai 
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