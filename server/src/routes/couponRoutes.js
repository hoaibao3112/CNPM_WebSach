import express from 'express';
import * as CouponController from '../controllers/CouponController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Customer APIs
router.get('/my-coupons', authenticateToken, CouponController.getMyCoupons);
router.get('/validate', authenticateToken, CouponController.validateCoupon);
router.get('/detail', authenticateToken, CouponController.getCouponDetail);
router.get('/available-count', authenticateToken, CouponController.getAvailableCouponsCount);
router.post('/use', authenticateToken, CouponController.useCoupon);

// Admin APIs
router.get('/admin/all', authenticateToken, CouponController.getAllCoupons);
router.post('/admin/create', authenticateToken, CouponController.createCoupon);
router.put('/admin/:code', authenticateToken, CouponController.updateCoupon);
router.delete('/admin/:code', authenticateToken, CouponController.deleteCoupon);
router.post('/admin/issue-bulk/:code', authenticateToken, CouponController.issueCouponBulk);

export default router;
