/**
 * Coupon Service - Business logic cho phiếu giảm giá
 * Tách từ couponController.js (fat controller → service)
 */
import pool from '../config/connectDatabase.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

class CouponService {
  /**
   * Lấy danh sách coupon của khách hàng
   */
  async getMyCoupons(makh) {
    if (!makh) throw new AppError('Thiếu tham số makh', 400);

    const [coupons] = await pool.query(
      `SELECT 
        ph.MaPhatHanh, ph.MaPhieu, ph.NgayPhatHanh, ph.NgaySuDung,
        p.MoTa, p.MaKM, p.TrangThai,
        k.MaKM AS Promo_MaKM, k.TenKM AS Promo_TenKM, k.LoaiKM AS Promo_LoaiKM,
        k.Audience AS Promo_Audience, CAST(k.TrangThai AS UNSIGNED) AS Promo_TrangThai,
        ct.GiaTriDonToiThieu AS Promo_GiaTriDonToiThieu,
        ct.GiaTriGiam AS Promo_GiaTriGiam, ct.GiamToiDa AS Promo_GiamToiDa,
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
         CASE Status WHEN 'available' THEN 1 WHEN 'used' THEN 2 WHEN 'inactive' THEN 3 END,
         ph.NgayPhatHanh DESC`,
      [makh]
    );

    return coupons.map(row => ({
      MaPhatHanh: row.MaPhatHanh, MaPhieu: row.MaPhieu,
      NgayPhatHanh: row.NgayPhatHanh, NgaySuDung: row.NgaySuDung,
      MoTa: row.MoTa, MaKM: row.MaKM, TrangThai: row.TrangThai, Status: row.Status,
      promotion: row.Promo_MaKM ? {
        MaKM: row.Promo_MaKM, TenKM: row.Promo_TenKM, LoaiKM: row.Promo_LoaiKM,
        Audience: row.Promo_Audience, TrangThai: row.Promo_TrangThai,
        GiaTriDonToiThieu: row.Promo_GiaTriDonToiThieu,
        GiaTriGiam: row.Promo_GiaTriGiam, GiamToiDa: row.Promo_GiamToiDa
      } : null
    }));
  }

  /**
   * Kiểm tra coupon hợp lệ
   */
  async validateCoupon(makh, code) {
    if (!makh || !code) throw new AppError('Thiếu makh hoặc code', 400);

    const [[coupon]] = await pool.query('SELECT * FROM phieugiamgia WHERE MaPhieu = ?', [code]);
    if (!coupon) throw new AppError('Mã giảm giá không tồn tại', 404);
    if (coupon.TrangThai === 0) throw new AppError('Mã giảm giá đã bị vô hiệu hóa', 400);

    const [issued] = await pool.query(
      'SELECT * FROM phieugiamgia_phathanh WHERE makh = ? AND MaPhieu = ?', [makh, code]
    );
    if (!issued || issued.length === 0) throw new AppError('Bạn không có quyền sử dụng mã này', 403);

    const usedCount = issued.filter(i => i.NgaySuDung !== null).length;
    if (usedCount >= coupon.SoLanSuDungToiDa) throw new AppError('Bạn đã sử dụng hết số lần cho phép', 400);

    let promotion = null;
    let promotionMissing = false;
    if (coupon.MaKM) {
      const [[promo]] = await pool.query(
        `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.MoTa, CAST(k.TrangThai AS UNSIGNED) as TrangThai,
                ct.GiaTriDonToiThieu, ct.GiaTriGiam, ct.GiamToiDa, k.NgayBatDau, k.NgayKetThuc, k.Audience
         FROM khuyen_mai k LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM WHERE k.MaKM = ? LIMIT 1`,
        [coupon.MaKM]
      );
      if (promo) promotion = promo; else promotionMissing = true;
    }

    return {
      code: coupon.MaPhieu, type: coupon.MaKM ? 'FREESHIP' : null,
      value: null, description: coupon.MoTa,
      MaKM: coupon.MaKM || null, promotion, promotionMissing
    };
  }

  /**
   * Sử dụng coupon
   */
  async useCoupon(makh, code) {
    if (!makh || !code) throw new AppError('Thiếu makh hoặc code', 400);

    // Validate first
    await this.validateCoupon(makh, code);

    await pool.query(
      `UPDATE phieugiamgia_phathanh 
       SET NgaySuDung = NOW(), TrangThaiSuDung = 'DA_SU_DUNG'
       WHERE makh = ? AND MaPhieu = ? AND NgaySuDung IS NULL LIMIT 1`,
      [makh, code]
    );
    return true;
  }

  /**
   * Đếm coupons khả dụng
   */
  async getAvailableCount(makh) {
    if (!makh) throw new AppError('Thiếu tham số makh', 400);

    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) as count FROM phieugiamgia_phathanh ph
       JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
       WHERE ph.makh = ? AND ph.NgaySuDung IS NULL AND p.TrangThai = 1`,
      [makh]
    );
    return count;
  }

  /**
   * Chi tiết coupon
   */
  async getCouponDetail(makh, code) {
    if (!makh || !code) throw new AppError('Thiếu makh hoặc code', 400);

    const [issuedRows] = await pool.query(
      `SELECT ph.MaPhatHanh, ph.MaPhieu, ph.NgayPhatHanh, ph.NgaySuDung, p.MoTa, p.MaKM, p.TrangThai
       FROM phieugiamgia_phathanh ph JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
       WHERE ph.makh = ? AND ph.MaPhieu = ? LIMIT 1`,
      [makh, code]
    );

    const loadPromotion = async (maKM) => {
      if (!maKM) return { promotion: null, promotionMissing: false };
      const [[promo]] = await pool.query(
        `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.MoTa, CAST(k.TrangThai AS UNSIGNED) as TrangThai,
                ct.GiaTriDonToiThieu, ct.GiaTriGiam, ct.GiamToiDa, k.NgayBatDau, k.NgayKetThuc
         FROM khuyen_mai k LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
         WHERE k.MaKM = ? LIMIT 1`, [maKM]
      );
      return { promotion: promo || null, promotionMissing: !promo };
    };

    if (!issuedRows?.length) {
      const [[tpl]] = await pool.query('SELECT MaPhieu, MoTa, MaKM, TrangThai FROM phieugiamgia WHERE MaPhieu = ? LIMIT 1', [code]);
      if (!tpl) throw new AppError('Không tìm thấy mã', 404);

      const { promotion, promotionMissing } = await loadPromotion(tpl.MaKM);
      return { coupon: { MaPhieu: tpl.MaPhieu, MoTa: tpl.MoTa, MaKM: tpl.MaKM || null, TrangThai: tpl.TrangThai }, promotion, promotionMissing };
    }

    const issued = issuedRows[0];
    const { promotion, promotionMissing } = await loadPromotion(issued.MaKM);

    return {
      coupon: {
        MaPhatHanh: issued.MaPhatHanh, MaPhieu: issued.MaPhieu,
        NgayPhatHanh: issued.NgayPhatHanh, NgaySuDung: issued.NgaySuDung,
        MoTa: issued.MoTa, MaKM: issued.MaKM, TrangThai: issued.TrangThai,
        Status: issued.NgaySuDung ? 'used' : (issued.TrangThai === 0 ? 'inactive' : 'available')
      },
      promotion, promotionMissing
    };
  }

  // ====== ADMIN ======

  async getAllCoupons() {
    const [coupons] = await pool.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM phieugiamgia_phathanh WHERE MaPhieu = p.MaPhieu) AS TongPhatHanh,
        (SELECT COUNT(*) FROM phieugiamgia_phathanh WHERE MaPhieu = p.MaPhieu AND NgaySuDung IS NOT NULL) AS DaSuDung
       FROM phieugiamgia p ORDER BY p.NgayTao DESC`
    );
    return coupons;
  }

  async createCoupon(data) {
    const { MaPhieu, maPhieu, TenPhieu, tenPhieu, MoTa, moTa,
      SoLuongPhatHanh, soLuongPhatHanh, soLanSuDungToiDa,
      TrangThai, trangThai = 1, MaKM, maKM } = data;

    const couponCode = MaPhieu || maPhieu;
    const couponName = TenPhieu || tenPhieu;
    const description = (couponName ? `${couponName} - ` : '') + (MoTa || moTa || '');
    const quantity = SoLuongPhatHanh || soLuongPhatHanh || soLanSuDungToiDa || 1;
    const status = TrangThai || trangThai || 1;
    let finalMaKM = MaKM || maKM || null;

    if (finalMaKM) {
      const [[promo]] = await pool.query('SELECT LoaiKM FROM khuyen_mai WHERE MaKM = ?', [finalMaKM]);
      if (!promo) throw new AppError('MaKM không tồn tại', 400);
      if (promo.LoaiKM !== 'free_ship') throw new AppError('MaKM phải là khuyến mãi Free Ship', 400);
    } else if (!couponCode) {
      throw new AppError('Thiếu thông tin bắt buộc (MaPhieu)', 400);
    }

    try {
      await pool.query(
        'INSERT INTO phieugiamgia (MaPhieu, MoTa, SoLanSuDungToiDa, TrangThai, MaKM) VALUES (?, ?, ?, ?, ?)',
        [couponCode, description, quantity, status, finalMaKM]
      );
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') throw new AppError('Mã coupon đã tồn tại', 409);
      throw error;
    }
    return true;
  }

  async updateCoupon(code, data) {
    const { MoTa, moTa, TenPhieu, tenPhieu, SoLuongPhatHanh, soLuongPhatHanh,
      soLanSuDungToiDa, TrangThai, trangThai, MaKM, maKM } = data;

    const couponName = TenPhieu || tenPhieu;
    const description = (couponName ? `${couponName} - ` : '') + (MoTa || moTa || '');
    const quantity = SoLuongPhatHanh || soLuongPhatHanh || soLanSuDungToiDa;
    const status = TrangThai !== undefined ? TrangThai : trangThai;
    let finalMaKM = MaKM || maKM || null;

    if (finalMaKM) {
      const [[promo]] = await pool.query('SELECT LoaiKM FROM khuyen_mai WHERE MaKM = ?', [finalMaKM]);
      if (!promo) throw new AppError('MaKM không tồn tại', 400);
      if (promo.LoaiKM !== 'free_ship') throw new AppError('MaKM phải là khuyến mãi Free Ship', 400);
    }

    await pool.query(
      'UPDATE phieugiamgia SET MoTa = ?, SoLanSuDungToiDa = ?, TrangThai = ?, MaKM = ? WHERE MaPhieu = ?',
      [description, quantity, status, finalMaKM, code]
    );
    return true;
  }

  async deleteCoupon(code) {
    await pool.query('DELETE FROM phieugiamgia WHERE MaPhieu = ?', [code]);
    return true;
  }

  async issueCouponBulk(code, { makhList, issueToAll = false }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [[coupon]] = await connection.query('SELECT MaPhieu FROM phieugiamgia WHERE MaPhieu = ?', [code]);
      if (!coupon) throw new AppError('Coupon không tồn tại', 404);

      let customers;
      if (issueToAll) {
        const [allCustomers] = await connection.query("SELECT makh FROM khachhang WHERE tinhtrang = 'Hoạt động'");
        customers = allCustomers;
      } else if (makhList?.length) {
        customers = makhList.map(makh => ({ makh }));
      } else {
        throw new AppError('Cần cung cấp makhList hoặc issueToAll', 400);
      }

      let issued = 0;
      for (const customer of customers) {
        try {
          await connection.query('INSERT IGNORE INTO phieugiamgia_phathanh (makh, MaPhieu) VALUES (?, ?)', [customer.makh, code]);
          issued++;
        } catch (err) {
          logger.error(`Failed to issue for makh=${customer.makh}`, { error: err.message });
        }
      }

      await connection.commit();
      return { issued, total: customers.length };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export default new CouponService();
