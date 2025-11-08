import pool from '../config/connectDatabase.js';

/**
 * =====================================================
 * COUPON CONTROLLER - Phiếu Giảm Giá / Freeship
 * =====================================================
 */

/**
 * Lấy danh sách coupon của khách hàng
 * GET /api/coupons/my-coupons?makh=X
 */
export const getMyCoupons = async (req, res) => {
  try {
    const { makh } = req.query;

    if (!makh) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số makh'
      });
    }

    const [coupons] = await pool.query(
      `SELECT 
        ph.MaPhatHanh,
        ph.MaPhieu,
        ph.NgayPhatHanh,
        ph.NgaySuDung,
        ph.MaDonHang,
        p.MoTa,
        p.LoaiGiamGia,
        p.GiaTriGiam,
        p.NgayHetHan,
        p.TrangThai,
        CASE 
          WHEN ph.NgaySuDung IS NOT NULL THEN 'used'
          WHEN p.NgayHetHan IS NOT NULL AND p.NgayHetHan < NOW() THEN 'expired'
          WHEN p.TrangThai = 0 THEN 'inactive'
          ELSE 'available'
        END AS Status
       FROM phieugiamgia_phathanh ph
       JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
       WHERE ph.makh = ?
       ORDER BY 
         CASE Status
           WHEN 'available' THEN 1
           WHEN 'expired' THEN 2
           WHEN 'used' THEN 3
           WHEN 'inactive' THEN 4
         END,
         ph.NgayPhatHanh DESC`,
      [makh]
    );

    return res.json({
      success: true,
      data: coupons
    });
  } catch (error) {
    console.error('Error getMyCoupons:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách coupon',
      error: error.message
    });
  }
};

/**
 * Kiểm tra coupon có khả dụng không
 * GET /api/coupons/validate?makh=X&code=FREESHIP2025
 */
export const validateCoupon = async (req, res) => {
  try {
    const { makh, code } = req.query;

    if (!makh || !code) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu makh hoặc code'
      });
    }

    // Kiểm tra coupon tồn tại
    const [coupon] = await pool.query(
      `SELECT * FROM phieugiamgia WHERE MaPhieu = ?`,
      [code]
    );

    if (!coupon || coupon.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không tồn tại'
      });
    }

    const c = coupon[0];

    // Kiểm tra trạng thái
    if (c.TrangThai === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã bị vô hiệu hóa'
      });
    }

    // Kiểm tra hết hạn
    if (c.NgayHetHan && new Date(c.NgayHetHan) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá đã hết hạn'
      });
    }

    // Kiểm tra đã phát hành cho khách chưa
    const [issued] = await pool.query(
      `SELECT * FROM phieugiamgia_phathanh WHERE makh = ? AND MaPhieu = ?`,
      [makh, code]
    );

    if (!issued || issued.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sử dụng mã này'
      });
    }

    // Kiểm tra số lần sử dụng
    const usedCount = issued.filter(i => i.NgaySuDung !== null).length;
    if (usedCount >= c.SoLanSuDungToiDa) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã sử dụng hết số lần cho phép'
      });
    }

    return res.json({
      success: true,
      message: 'Mã giảm giá hợp lệ',
      data: {
        code: c.MaPhieu,
        type: c.LoaiGiamGia,
        value: c.GiaTriGiam,
        description: c.MoTa
      }
    });
  } catch (error) {
    console.error('Error validateCoupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra coupon',
      error: error.message
    });
  }
};

/**
 * Sử dụng coupon (gọi khi đặt hàng thành công)
 * POST /api/coupons/use
 * Body: { makh, code, orderId }
 */
export const useCoupon = async (req, res) => {
  try {
    const { makh, code, orderId } = req.body;

    if (!makh || !code) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu makh hoặc code'
      });
    }

    // Kiểm tra lại tính hợp lệ
    const validateRes = await validateCoupon({
      query: { makh, code }
    }, {
      json: () => {},
      status: () => ({ json: () => {} })
    });

    // Cập nhật NgaySuDung
    await pool.query(
      `UPDATE phieugiamgia_phathanh 
       SET NgaySuDung = NOW(), MaDonHang = ?
       WHERE makh = ? AND MaPhieu = ? AND NgaySuDung IS NULL
       LIMIT 1`,
      [orderId || null, makh, code]
    );

    return res.json({
      success: true,
      message: 'Đã sử dụng coupon thành công'
    });
  } catch (error) {
    console.error('Error useCoupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi sử dụng coupon',
      error: error.message
    });
  }
};

/**
 * Lấy số lượng coupon khả dụng của khách
 * GET /api/coupons/count?makh=X
 */
export const getAvailableCouponsCount = async (req, res) => {
  try {
    const { makh } = req.query;

    if (!makh) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số makh'
      });
    }

    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) as count
       FROM phieugiamgia_phathanh ph
       JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
       WHERE ph.makh = ?
         AND ph.NgaySuDung IS NULL
         AND p.TrangThai = 1
         AND (p.NgayHetHan IS NULL OR p.NgayHetHan > NOW())`,
      [makh]
    );

    return res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error getAvailableCouponsCount:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đếm coupon',
      error: error.message
    });
  }
};

// ============== ADMIN APIs ==============

/**
 * Lấy danh sách tất cả coupon (Admin)
 * GET /api/admin/coupons
 */
export const getAllCoupons = async (req, res) => {
  try {
    const [coupons] = await pool.query(
      `SELECT 
        p.*,
        (SELECT COUNT(*) FROM phieugiamgia_phathanh WHERE MaPhieu = p.MaPhieu) AS TongPhatHanh,
        (SELECT COUNT(*) FROM phieugiamgia_phathanh WHERE MaPhieu = p.MaPhieu AND NgaySuDung IS NOT NULL) AS DaSuDung
       FROM phieugiamgia p
       ORDER BY p.NgayTao DESC`
    );

    return res.json({
      success: true,
      data: coupons
    });
  } catch (error) {
    console.error('Error getAllCoupons:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách coupon',
      error: error.message
    });
  }
};

/**
 * Tạo coupon mới (Admin)
 * POST /api/admin/coupons
 */
export const createCoupon = async (req, res) => {
  try {
    // Hỗ trợ cả PascalCase (từ frontend) và camelCase
    const { 
      MaPhieu, maPhieu, 
      TenPhieu, tenPhieu,
      MoTa, moTa, 
      LoaiGiam, loaiGiam, loaiGiamGia,
      GiaTriGiam, giaTriGiam, 
      GiaTriDonToiThieu, giaTriDonToiThieu,
      SoLuongPhatHanh, soLuongPhatHanh, soLanSuDungToiDa,
      NgayHetHan, ngayHetHan, 
      TrangThai, trangThai = 1 
    } = req.body;

    // Normalize field names
    const couponCode = MaPhieu || maPhieu;
    const couponName = TenPhieu || tenPhieu;
    const description = (couponName ? `${couponName} - ` : '') + (MoTa || moTa || '');
    const discountTypeInput = LoaiGiam || loaiGiam || loaiGiamGia;
    const discountValue = GiaTriGiam || giaTriGiam;
    const minOrderValue = GiaTriDonToiThieu || giaTriDonToiThieu || 0;
    const quantity = SoLuongPhatHanh || soLuongPhatHanh || soLanSuDungToiDa || 1;
    const expiryDate = NgayHetHan || ngayHetHan || null;
    const status = TrangThai || trangThai || 1;

    // Map frontend discount type to DB ENUM
    let discountType;
    if (discountTypeInput === 'percent') {
      discountType = 'PERCENT';
    } else if (discountTypeInput === 'fixed') {
      discountType = 'AMOUNT';
    } else if (discountTypeInput === 'freeship') {
      discountType = 'FREESHIP';
    } else {
      // Nếu đã đúng format DB, giữ nguyên
      discountType = discountTypeInput?.toUpperCase();
    }

    // Validation
    if (!couponCode || !discountType || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (MaPhieu, LoaiGiam, GiaTriGiam)',
        received: { couponCode, discountType, discountValue }
      });
    }

    // Validate ENUM
    if (!['FREESHIP', 'PERCENT', 'AMOUNT'].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: `LoaiGiam không hợp lệ. Chỉ chấp nhận: percent, fixed, freeship (hoặc PERCENT, AMOUNT, FREESHIP)`,
        received: discountTypeInput
      });
    }

    await pool.query(
      `INSERT INTO phieugiamgia (MaPhieu, MoTa, LoaiGiamGia, GiaTriGiam, NgayHetHan, SoLanSuDungToiDa, TrangThai)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [couponCode, description, discountType, discountValue, expiryDate, quantity, status]
    );

    return res.json({
      success: true,
      message: 'Tạo coupon thành công'
    });
  } catch (error) {
    console.error('Error createCoupon:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Mã coupon đã tồn tại'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo coupon',
      error: error.message
    });
  }
};

/**
 * Cập nhật coupon (Admin)
 * PUT /api/admin/coupons/:code
 */
export const updateCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const { 
      MoTa, moTa,
      TenPhieu, tenPhieu,
      LoaiGiam, loaiGiam, loaiGiamGia,
      GiaTriGiam, giaTriGiam,
      NgayHetHan, ngayHetHan,
      SoLuongPhatHanh, soLuongPhatHanh, soLanSuDungToiDa,
      TrangThai, trangThai
    } = req.body;

    // Normalize
    const couponName = TenPhieu || tenPhieu;
    const description = (couponName ? `${couponName} - ` : '') + (MoTa || moTa || '');
    const discountTypeInput = LoaiGiam || loaiGiam || loaiGiamGia;
    const discountValue = GiaTriGiam || giaTriGiam;
    const expiryDate = NgayHetHan || ngayHetHan;
    const quantity = SoLuongPhatHanh || soLuongPhatHanh || soLanSuDungToiDa;
    const status = TrangThai !== undefined ? TrangThai : trangThai;

    // Map discount type
    let discountType = discountTypeInput;
    if (discountTypeInput === 'percent') discountType = 'PERCENT';
    else if (discountTypeInput === 'fixed') discountType = 'AMOUNT';
    else if (discountTypeInput === 'freeship') discountType = 'FREESHIP';
    else if (discountTypeInput) discountType = discountTypeInput.toUpperCase();

    await pool.query(
      `UPDATE phieugiamgia 
       SET MoTa = ?, LoaiGiamGia = ?, GiaTriGiam = ?, NgayHetHan = ?, SoLanSuDungToiDa = ?, TrangThai = ?
       WHERE MaPhieu = ?`,
      [description, discountType, discountValue, expiryDate || null, quantity, status, code]
    );

    return res.json({
      success: true,
      message: 'Cập nhật coupon thành công'
    });
  } catch (error) {
    console.error('Error updateCoupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật coupon',
      error: error.message
    });
  }
};

/**
 * Xóa coupon (Admin)
 * DELETE /api/admin/coupons/:code
 */
export const deleteCoupon = async (req, res) => {
  try {
    const { code } = req.params;

    await pool.query(`DELETE FROM phieugiamgia WHERE MaPhieu = ?`, [code]);

    return res.json({
      success: true,
      message: 'Xóa coupon thành công'
    });
  } catch (error) {
    console.error('Error deleteCoupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa coupon',
      error: error.message
    });
  }
};

/**
 * Phát coupon cho nhiều khách hàng (Admin)
 * POST /api/admin/coupons/:code/issue
 * Body: { makhList: [1,2,3,...] } hoặc { issueToAll: true }
 */
export const issueCouponBulk = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { code } = req.params;
    const { makhList, issueToAll = false } = req.body;

    // Kiểm tra coupon tồn tại
    const [coupon] = await connection.query(
      `SELECT MaPhieu FROM phieugiamgia WHERE MaPhieu = ?`,
      [code]
    );

    if (!coupon || coupon.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Coupon không tồn tại'
      });
    }

    let customers = [];

    if (issueToAll) {
      // Phát cho tất cả khách hàng đang hoạt động
      const [allCustomers] = await connection.query(
        `SELECT makh FROM khachhang WHERE tinhtrang = 'Hoạt động'`
      );
      customers = allCustomers;
    } else if (makhList && Array.isArray(makhList) && makhList.length > 0) {
      customers = makhList.map(makh => ({ makh }));
    } else {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cần cung cấp makhList hoặc issueToAll'
      });
    }

    // Insert bulk (ignore duplicates)
    let issued = 0;
    for (let customer of customers) {
      try {
        await connection.query(
          `INSERT IGNORE INTO phieugiamgia_phathanh (makh, MaPhieu) VALUES (?, ?)`,
          [customer.makh, code]
        );
        issued++;
      } catch (err) {
        console.error(`Failed to issue for makh=${customer.makh}:`, err.message);
      }
    }

    await connection.commit();

    return res.json({
      success: true,
      message: `Đã phát coupon cho ${issued} khách hàng`,
      data: { issued, total: customers.length }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error issueCouponBulk:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi phát coupon hàng loạt',
      error: error.message
    });
  } finally {
    connection.release();
  }
};
