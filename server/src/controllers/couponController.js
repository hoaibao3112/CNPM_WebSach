/**
 * Coupon Controller - Thin controller, delegates to CouponService
 * Replaces the fat couponController.js
 */
import CouponService from '../services/Coupon.service.js';

// ====== Customer APIs ======

export const getMyCoupons = async (req, res, next) => {
  try {
    const data = await CouponService.getMyCoupons(req.query.makh);
    return res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const validateCoupon = async (req, res, next) => {
  try {
    const data = await CouponService.validateCoupon(req.query.makh, req.query.code);
    return res.json({ success: true, message: 'Mã giảm giá hợp lệ', data });
  } catch (error) { next(error); }
};

export const useCoupon = async (req, res, next) => {
  try {
    await CouponService.useCoupon(req.body.makh, req.body.code);
    return res.json({ success: true, message: 'Đã sử dụng coupon thành công' });
  } catch (error) { next(error); }
};

export const getAvailableCouponsCount = async (req, res, next) => {
  try {
    const count = await CouponService.getAvailableCount(req.query.makh);
    return res.json({ success: true, data: { count } });
  } catch (error) { next(error); }
};

export const getCouponDetail = async (req, res, next) => {
  try {
    const data = await CouponService.getCouponDetail(req.query.makh, req.query.code);
    return res.json({ success: true, data });
  } catch (error) { next(error); }
};

// ====== Admin APIs ======

export const getAllCoupons = async (req, res, next) => {
  try {
    const data = await CouponService.getAllCoupons();
    return res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const createCoupon = async (req, res, next) => {
  try {
    await CouponService.createCoupon(req.body);
    return res.json({ success: true, message: 'Tạo coupon thành công' });
  } catch (error) { next(error); }
};

export const updateCoupon = async (req, res, next) => {
  try {
    await CouponService.updateCoupon(req.params.code, req.body);
    return res.json({ success: true, message: 'Cập nhật coupon thành công' });
  } catch (error) { next(error); }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    await CouponService.deleteCoupon(req.params.code);
    return res.json({ success: true, message: 'Xóa coupon thành công' });
  } catch (error) { next(error); }
};

export const issueCouponBulk = async (req, res, next) => {
  try {
    const result = await CouponService.issueCouponBulk(req.params.code, req.body);
    return res.json({ success: true, message: `Đã phát coupon cho ${result.issued} khách hàng`, data: result });
  } catch (error) { next(error); }
};
