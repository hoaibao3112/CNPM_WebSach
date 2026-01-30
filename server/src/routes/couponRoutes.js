import express from 'express';
import PromotionController from '../controllers/PromotionController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/my-coupons', authenticateToken, PromotionController.getMyCoupons);
// Other coupon routes would be pointed to PromotionController methods as needed...

export default router;
