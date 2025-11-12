import express from 'express';
import {
  getMyCoupons,
  validateCoupon,
  useCoupon,
  getAvailableCouponsCount,
  getAllCoupons,
  getCouponDetail,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  issueCouponBulk
} from '../controllers/couponController.js';

const router = express.Router();

// ============== CLIENT ROUTES ==============

/**
 * @route   GET /api/coupons/my-coupons
 * @desc    Lấy danh sách coupon của khách hàng
 * @access  Private
 */
router.get('/my-coupons', getMyCoupons);

/**
 * @route   GET /api/coupons/validate
 * @desc    Kiểm tra coupon có hợp lệ không
 * @access  Private
 */
router.get('/validate', validateCoupon);

/**
 * @route   GET /api/coupons/detail
 * @desc    Lấy chi tiết coupon (an toàn cho mã phát từ form)
 * @access  Private
 */
router.get('/detail', getCouponDetail);

/**
 * @route   POST /api/coupons/use
 * @desc    Sử dụng coupon (khi đặt hàng)
 * @access  Private
 */
router.post('/use', useCoupon);

/**
 * @route   GET /api/coupons/count
 * @desc    Đếm số coupon khả dụng
 * @access  Private
 */
router.get('/count', getAvailableCouponsCount);

// ============== ADMIN ROUTES ==============

/**
 * @route   GET /api/coupons/admin/all
 * @desc    Lấy tất cả coupon (Admin)
 * @access  Admin only
 */
router.get('/admin/all', getAllCoupons);

/**
 * @route   POST /api/coupons/admin/create
 * @desc    Tạo coupon mới (Admin)
 * @access  Admin only
 */
router.post('/admin/create', createCoupon);

/**
 * @route   PUT /api/coupons/admin/:code
 * @desc    Cập nhật coupon (Admin)
 * @access  Admin only
 */
router.put('/admin/:code', updateCoupon);

/**
 * @route   DELETE /api/coupons/admin/:code
 * @desc    Xóa coupon (Admin)
 * @access  Admin only
 */
router.delete('/admin/:code', deleteCoupon);

/**
 * @route   POST /api/coupons/admin/:code/issue
 * @desc    Phát coupon cho nhiều khách hàng (Admin)
 * @access  Admin only
 */
router.post('/admin/:code/issue', issueCouponBulk);

export default router;
