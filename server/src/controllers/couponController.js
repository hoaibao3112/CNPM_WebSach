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
        p.MaKM,
        p.TrangThai,
        k.MaKM AS Promo_MaKM,
        k.TenKM AS Promo_TenKM,
        k.LoaiKM AS Promo_LoaiKM,
        k.Audience AS Promo_Audience,
        CAST(k.TrangThai AS UNSIGNED) AS Promo_TrangThai,
        ct.GiaTriDonToiThieu AS Promo_GiaTriDonToiThieu,
        ct.GiaTriGiam AS Promo_GiaTriGiam,
        ct.GiamToiDa AS Promo_GiamToiDa,
        CASE 
          WHEN ph.NgaySuDung IS NOT NULL THEN 'used'
          WHEN p.TrangThai = 0 THEN 'inactive'
          ELSE 'available'
        END AS Status
       FROM phieugiamgia_phathanh ph
       JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
       LEFT JOIN khuyen_mai k ON p.MaKM = k.MaKM
       LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       WHERE ph.makh = ?
       ORDER BY 
         CASE Status
           WHEN 'available' THEN 1
           WHEN 'used' THEN 2
           WHEN 'inactive' THEN 3
         END,
         ph.NgayPhatHanh DESC`,
      [makh]
    );

    // Normalize rows to include a nested promotion object for the frontend
    const normalized = coupons.map(row => ({
      MaPhatHanh: row.MaPhatHanh,
      MaPhieu: row.MaPhieu,
      NgayPhatHanh: row.NgayPhatHanh,
      NgaySuDung: row.NgaySuDung,
      MaDonHang: row.MaDonHang,
      MoTa: row.MoTa,
      MaKM: row.MaKM,
      TrangThai: row.TrangThai,
      Status: row.Status,
      promotion: row.Promo_MaKM ? {
        MaKM: row.Promo_MaKM,
        TenKM: row.Promo_TenKM,
        LoaiKM: row.Promo_LoaiKM,
        Audience: row.Promo_Audience,
        TrangThai: row.Promo_TrangThai,
        GiaTriDonToiThieu: row.Promo_GiaTriDonToiThieu,
        GiaTriGiam: row.Promo_GiaTriGiam,
        GiamToiDa: row.Promo_GiamToiDa
      } : null
    }));

    return res.json({
      success: true,
      data: normalized
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

    // Kiểm tra coupon template tồn tại
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

    // Note: expiration date column removed from DB; expiration checks handled by promotions or other logic

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

    // Nếu template có MaKM, lấy thông tin promotion để trả về
    let promotion = null;
    let promotionMissing = false;
    if (c.MaKM) {
      const [[promo]] = await pool.query(
        `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.MoTa, CAST(k.TrangThai AS UNSIGNED) as TrangThai, ct.GiaTriDonToiThieu, ct.GiaTriGiam, ct.GiamToiDa, k.NgayBatDau, k.NgayKetThuc, k.Audience
         FROM khuyen_mai k
         LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
         WHERE k.MaKM = ? LIMIT 1`,
        [c.MaKM]
      );
      if (promo) promotion = promo; else promotionMissing = true;
    }

    return res.json({
      success: true,
      message: 'Mã giảm giá hợp lệ',
      data: {
        code: c.MaPhieu,
        type: c.MaKM ? 'FREESHIP' : null,
        value: null,
        description: c.MoTa,
        MaKM: c.MaKM || null,
        promotion,
        promotionMissing
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
         AND p.TrangThai = 1`,
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

/**
 * Lấy chi tiết coupon (cho client khi xem mã nhận từ form)
 * GET /api/coupons/detail?makh=X&code=FREESHIP2025
 */
export const getCouponDetail = async (req, res) => {
  try {
    const { makh, code } = req.query;

    if (!makh || !code) {
      return res.status(400).json({ success: false, message: 'Thiếu makh hoặc code' });
    }

    // Tìm bản phát hành coupon của khách (nếu có)
    const [issuedRows] = await pool.query(
      `SELECT ph.MaPhatHanh, ph.MaPhieu, ph.NgayPhatHanh, ph.NgaySuDung, ph.MaDonHang, p.MoTa, p.MaKM, p.TrangThai
       FROM phieugiamgia_phathanh ph
       JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
       WHERE ph.makh = ? AND ph.MaPhieu = ? LIMIT 1`,
      [makh, code]
    );

    if (!issuedRows || issuedRows.length === 0) {
      // Nếu không có bản phát hành, vẫn cố lấy template coupon nếu tồn tại
      const [tpl] = await pool.query(
        `SELECT MaPhieu, MoTa, MaKM, TrangThai FROM phieugiamgia WHERE MaPhieu = ? LIMIT 1`,
        [code]
      );
      if (!tpl || tpl.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy mã' });
      }
      const t = tpl[0];
      // Nếu có MaKM, cố gắng lấy thông tin khuyến mãi nhưng không trả lỗi 404 nếu khuyến mãi đã bị xóa
      let promotion = null;
      let promotionMissing = false;
      if (t.MaKM) {
        const [[promo]] = await pool.query(
          `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.MoTa, CAST(k.TrangThai AS UNSIGNED) as TrangThai, ct.GiaTriDonToiThieu, ct.GiaTriGiam, ct.GiamToiDa, k.NgayBatDau, k.NgayKetThuc
           FROM khuyen_mai k
           LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
           WHERE k.MaKM = ? LIMIT 1`,
          [t.MaKM]
        );
        if (promo) promotion = promo; else promotionMissing = true;
      }

      return res.json({
        success: true,
        data: {
          coupon: {
            MaPhieu: t.MaPhieu,
            MoTa: t.MoTa,
            MaKM: t.MaKM || null,
            TrangThai: t.TrangThai
          },
          promotion,
          promotionMissing
        }
      });
    }

    const issued = issuedRows[0];

    // Nếu có MaKM, cố lấy thông tin promotion (nếu tồn tại). Không trả 404 nếu không có.
    let promotion = null;
    let promotionMissing = false;
    if (issued.MaKM) {
      const [[promo]] = await pool.query(
        `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.MoTa, CAST(k.TrangThai AS UNSIGNED) as TrangThai, ct.GiaTriDonToiThieu, ct.GiaTriGiam, ct.GiamToiDa, k.NgayBatDau, k.NgayKetThuc
         FROM khuyen_mai k
         LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
         WHERE k.MaKM = ? LIMIT 1`,
        [issued.MaKM]
      );
      if (promo) promotion = promo; else promotionMissing = true;
    }

    return res.json({
      success: true,
      data: {
        coupon: {
          MaPhatHanh: issued.MaPhatHanh,
          MaPhieu: issued.MaPhieu,
          NgayPhatHanh: issued.NgayPhatHanh,
          NgaySuDung: issued.NgaySuDung,
          MaDonHang: issued.MaDonHang,
          MoTa: issued.MoTa,
          MaKM: issued.MaKM,
          TrangThai: issued.TrangThai,
          Status: issued.NgaySuDung ? 'used' : (issued.TrangThai === 0 ? 'inactive' : 'available')
        },
        promotion,
        promotionMissing
      }
    });
  } catch (error) {
    console.error('Error getCouponDetail:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết coupon', error: error.message });
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
      SoLuongPhatHanh, soLuongPhatHanh, soLanSuDungToiDa,
      TrangThai, trangThai = 1,
      MaKM, maKM
    } = req.body;

    // Normalize field names
    const couponCode = MaPhieu || maPhieu;
    const couponName = TenPhieu || tenPhieu;
    const description = (couponName ? `${couponName} - ` : '') + (MoTa || moTa || '');
    const quantity = SoLuongPhatHanh || soLuongPhatHanh || soLanSuDungToiDa || 1;
    const expiryDate = null;
    const status = TrangThai || trangThai || 1;
    // If MaKM is provided, validate the promotion and prefer its free_ship type
    let finalMaKM = MaKM || maKM || null;
    if (finalMaKM) {
      const [promoRows] = await pool.query(`SELECT * FROM khuyen_mai WHERE MaKM = ?`, [finalMaKM]);
      if (!promoRows || promoRows.length === 0) {
        return res.status(400).json({ success: false, message: 'MaKM không tồn tại' });
      }
      const promo = promoRows[0];
      if (promo.LoaiKM !== 'free_ship') {
        return res.status(400).json({ success: false, message: 'MaKM phải là khuyến mãi Free Ship' });
      }
    } else {
      // Validation for non-linked coupons: require code
      if (!couponCode) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin bắt buộc (MaPhieu)'
        });
      }
    }

    await pool.query(
      `INSERT INTO phieugiamgia (MaPhieu, MoTa, SoLanSuDungToiDa, TrangThai, MaKM)
       VALUES (?, ?, ?, ?, ?)`,
      [couponCode, description, quantity, status, finalMaKM]
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
      SoLuongPhatHanh, soLuongPhatHanh, soLanSuDungToiDa,
      TrangThai, trangThai,
      MaKM, maKM
    } = req.body;

    // Normalize
    const couponName = TenPhieu || tenPhieu;
    const description = (couponName ? `${couponName} - ` : '') + (MoTa || moTa || '');
    const quantity = SoLuongPhatHanh || soLuongPhatHanh || soLanSuDungToiDa;
  const status = TrangThai !== undefined ? TrangThai : trangThai;
  let finalMaKM = MaKM || maKM || null;
    // If MaKM provided, validate it refers to a free_ship promotion
    if (finalMaKM) {
      const [promoRows] = await pool.query(`SELECT * FROM khuyen_mai WHERE MaKM = ?`, [finalMaKM]);
      if (!promoRows || promoRows.length === 0) {
        return res.status(400).json({ success: false, message: 'MaKM không tồn tại' });
      }
      if (promoRows[0].LoaiKM !== 'free_ship') {
        return res.status(400).json({ success: false, message: 'MaKM phải là khuyến mãi Free Ship' });
      }
    }

    await pool.query(
      `UPDATE phieugiamgia 
       SET MoTa = ?, SoLanSuDungToiDa = ?, TrangThai = ?, MaKM = ?
       WHERE MaPhieu = ?`,
      [description, quantity, status, finalMaKM, code]
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
