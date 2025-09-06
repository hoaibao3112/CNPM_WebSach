import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// Validation rules
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
    const validTypes = ['giam_phan_tram', 'giam_tien_mat', 'mua_x_tang_y', 'qua_tang', 'combo'];
    if (!promotionData.LoaiKM || !validTypes.includes(promotionData.LoaiKM)) {
      errors.push('Loại khuyến mãi không hợp lệ');
    }
  }

  return errors;
};

// Get all promotions
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

// Get promotion details
router.get('/:id', async (req, res) => {
  try {
    const promotionId = req.params.id;
    
    // Lấy thông tin cơ bản khuyến mãi
    const [[promotion]] = await pool.query(
      'SELECT * FROM khuyen_mai WHERE MaKM = ?',
      [promotionId]
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });
    }

    // Lấy chi tiết khuyến mãi
    const [details] = await pool.query(
      'SELECT * FROM ct_khuyen_mai WHERE MaKM = ?',
      [promotionId]
    );

    // Lấy danh sách sản phẩm áp dụng
    const [products] = await pool.query(
      `SELECT sp.* FROM sanpham sp
       JOIN sp_khuyen_mai spkm ON sp.MaSP = spkm.MaSP
       WHERE spkm.MaKM = ?`,
      [promotionId]
    );

    // Lấy sản phẩm tặng kèm nếu có
    let giftProduct = null;
    if (details[0]?.MaSPTang) {
      const [[gift]] = await pool.query(
        'SELECT * FROM sanpham WHERE MaSP = ?',
        [details[0].MaSPTang]
      );
      giftProduct = gift;
    }

    res.status(200).json({
      ...promotion,
      chi_tiet: details[0] || {},
      san_pham_ap_dung: products,
      san_pham_tang: giftProduct
    });
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({ 
      error: 'Lỗi khi lấy thông tin khuyến mãi',
      details: error.message 
    });
  }
});

// Create new promotion
router.post('/', async (req, res) => {
  try {
    const { TenKM, MoTa, NgayBatDau, NgayKetThuc, LoaiKM, ChiTiet, SanPhamApDung } = req.body;

    const validationErrors = validatePromotion(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Bắt đầu transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Thêm khuyến mãi chính
      const [result] = await connection.query(
        `INSERT INTO khuyen_mai 
         (TenKM, MoTa, NgayBatDau, NgayKetThuc, LoaiKM) 
         VALUES (?, ?, ?, ?, ?)`,
        [TenKM, MoTa, NgayBatDau, NgayKetThuc, LoaiKM]
      );
      const promotionId = result.insertId;

      // Thêm chi tiết khuyến mãi
      await connection.query(
        `INSERT INTO ct_khuyen_mai
         (MaKM, PhanTramGiam, SoTienGiam, GiaTriDonToiThieu, GiamToiDa, SoLuongMua, SoLuongTang, MaSPTang) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          promotionId,
          ChiTiet.PhanTramGiam || null,
          ChiTiet.SoTienGiam || null,
          ChiTiet.GiaTriDonToiThieu || null,
          ChiTiet.GiamToiDa || null,
          ChiTiet.SoLuongMua || null,
          ChiTiet.SoLuongTang || null,
          ChiTiet.MaSPTang || null
        ]
      );

      // Thêm sản phẩm áp dụng
      if (SanPhamApDung && SanPhamApDung.length > 0) {
        const productValues = SanPhamApDung.map(MaSP => [promotionId, MaSP]);
        await connection.query(
          'INSERT INTO sp_khuyen_mai (MaKM, MaSP) VALUES ?',
          [productValues]
        );
      }

      await connection.commit();

      // Lấy lại thông tin đầy đủ để trả về
      const [[newPromotion]] = await pool.query(
        'SELECT * FROM khuyen_mai WHERE MaKM = ?',
        [promotionId]
      );

      res.status(201).json({
        message: 'Tạo khuyến mãi thành công!',
        data: newPromotion
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ 
      error: 'Lỗi khi tạo khuyến mãi',
      details: error.message 
    });
  }
});

// Update promotion
router.put('/:id', async (req, res) => {
  try {
    const promotionId = req.params.id;
    const { TenKM, MoTa, NgayBatDau, NgayKetThuc, LoaiKM, TrangThai, ChiTiet, SanPhamApDung } = req.body;

    // Kiểm tra tồn tại
    const [[existing]] = await pool.query(
      'SELECT * FROM khuyen_mai WHERE MaKM = ?',
      [promotionId]
    );

    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });
    }

    const validationErrors = validatePromotion(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Bắt đầu transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Cập nhật khuyến mãi chính
      await connection.query(
        `UPDATE khuyen_mai
         SET TenKM = ?, MoTa = ?, NgayBatDau = ?, NgayKetThuc = ?, LoaiKM = ?, TrangThai = ?
         WHERE MaKM = ?`,
        [
          TenKM || existing.TenKM,
          MoTa !== undefined ? MoTa : existing.MoTa,
          NgayBatDau || existing.NgayBatDau,
          NgayKetThuc || existing.NgayKetThuc,
          LoaiKM || existing.LoaiKM,
          TrangThai !== undefined ? TrangThai : existing.TrangThai,
          promotionId
        ]
      );

      // Cập nhật chi tiết khuyến mãi
      await connection.query(
        `UPDATE ct_khuyen_mai 
         SET 
           PhanTramGiam = ?,
           SoTienGiam = ?,
           GiaTriDonToiThieu = ?,
           GiamToiDa = ?,
           SoLuongMua = ?,
           SoLuongTang = ?,
           MaSPTang = ?
         WHERE MaKM = ?`,
        [
          ChiTiet?.PhanTramGiam || null,
          ChiTiet?.SoTienGiam || null,
          ChiTiet?.GiaTriDonToiThieu || null,
          ChiTiet?.GiamToiDa || null,
          ChiTiet?.SoLuongMua || null,
          ChiTiet?.SoLuongTang || null,
          ChiTiet?.MaSPTang || null,
          promotionId
        ]
      );

      // Cập nhật sản phẩm áp dụng
      if (SanPhamApDung) {
        // Xóa hết sản phẩm cũ
        await connection.query(
          'DELETE FROM sp_khuyen_mai WHERE MaKM = ?',
          [promotionId]
        );

        // Thêm sản phẩm mới
        if (SanPhamApDung.length > 0) {
          const productValues = SanPhamApDung.map(MaSP => [promotionId, MaSP]);
          await connection.query(
            'INSERT INTO sp_khuyen_mai  (MaKM, MaSP) VALUES ?',
            [productValues]
          );
        }
      }

      await connection.commit();

      // Lấy lại thông tin đầy đủ để trả về
      const [[updatedPromotion]] = await pool.query(
        'SELECT * FROM khuyen_mai WHERE MaKM = ?',
        [promotionId]
      );

      res.status(200).json({
        message: 'Cập nhật khuyến mãi thành công!',
        data: updatedPromotion
      });
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

// Toggle promotion status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const promotionId = req.params.id;

    const [[promotion]] = await pool.query(
      'SELECT TrangThai FROM khuyen_mai WHERE MaKM = ?',
      [promotionId]
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });
    }

    const newStatus = promotion.TrangThai ? 0 : 1;

    await pool.query(
      'UPDATE khuyen_mai SET TrangThai = ? WHERE MaKM = ?',
      [newStatus, promotionId]
    );

    res.status(200).json({
      message: 'Đã thay đổi trạng thái khuyến mãi!',
      newStatus,
      MaKM: promotionId
    });
  } catch (error) {
    console.error('Error toggling promotion status:', error);
    res.status(500).json({ 
      error: 'Lỗi khi thay đổi trạng thái',
      details: error.message 
    });
  }
});

// Get products for promotion
router.get('/:id/products', async (req, res) => {
  try {
    const promotionId = req.params.id;
    
    const [products] = await pool.query(
      `SELECT sp.* FROM sanpham sp
       JOIN sp_khuyen_mai spkm ON sp.MaSP = spkm.MaSP
       WHERE spkm.MaKM = ?`,
      [promotionId]
    );

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching promotion products:', error);
    res.status(500).json({ 
      error: 'Lỗi khi lấy danh sách sản phẩm',
      details: error.message 
    });
  }
});

// Apply promotion to cart
router.post('/apply-to-cart', async (req, res) => {
  try {
    const { MaKM, cartItems } = req.body;

    // 1. Lấy thông tin khuyến mãi
    const [[promotion]] = await pool.query(
      `SELECT km.*, ct.* FROM khuyen_mai km
       JOIN ct_khuyen_mai ct ON km.MaKM = ct.MaKM
       WHERE km.MaKM = ? AND km.TrangThai = 1 
       AND km.NgayBatDau <= NOW() AND km.NgayKetThuc >= NOW()`,
      [MaKM]
    );

    if (!promotion) {
      return res.status(400).json({ error: 'Khuyến mãi không hợp lệ hoặc đã hết hạn' });
    }

    // 2. Lấy danh sách sản phẩm được khuyến mãi
    const [promotionProducts] = await pool.query(
      `SELECT MaSP FROM sp_khuyen_mai WHERE MaKM = ?`,
      [MaKM]
    );
    const validProductIds = promotionProducts.map(p => p.MaSP);

    // 3. Tính toán giảm giá
    let totalDiscount = 0;
    let discountDetails = [];
    let giftProducts = [];

    // Tính tổng giá trị đơn hàng
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.DonGia * item.SoLuong);
    }, 0);

    // Áp dụng các loại khuyến mãi khác nhau
    switch (promotion.LoaiKM) {
      case 'giam_phan_tram':
        // Giảm % cho sản phẩm áp dụng
        cartItems.forEach(item => {
          if (validProductIds.includes(item.MaSP)) {
            const discount = item.DonGia * item.SoLuong * (promotion.PhanTramGiam / 100);
            totalDiscount += discount;
            discountDetails.push({
              MaSP: item.MaSP,
              discountType: 'percentage',
              value: promotion.PhanTramGiam,
              discountAmount: discount
            });
          }
        });
        break;

      case 'giam_tien_mat':
        // Giảm tiền mặt trực tiếp
        if (subtotal >= (promotion.GiaTriDonToiThieu || 0)) {
          totalDiscount = Math.min(promotion.SoTienGiam, promotion.GiamToiDa || Infinity);
          discountDetails.push({
            discountType: 'fixed_amount',
            value: promotion.SoTienGiam,
            discountAmount: totalDiscount
          });
        }
        break;

      case 'mua_x_tang_y':
        // Mua X tặng Y
        cartItems.forEach(item => {
          if (validProductIds.includes(item.MaSP)) {
            const freeQuantity = Math.floor(item.SoLuong / promotion.SoLuongMua) * promotion.SoLuongTang;
            if (freeQuantity > 0) {
              giftProducts.push({
                MaSP: promotion.MaSPTang,
                SoLuong: freeQuantity
              });
            }
          }
        });
        break;

      case 'combo':
        // Xử lý combo (phức tạp hơn, cần thêm logic riêng)
        break;
    }

    res.status(200).json({
      success: true,
      totalDiscount,
      discountDetails,
      giftProducts,
      finalTotal: subtotal - totalDiscount
    });

  } catch (error) {
    console.error('Error applying promotion:', error);
    res.status(500).json({ 
      error: 'Lỗi khi áp dụng khuyến mãi',
      details: error.message 
    });
  }
});

export default router;