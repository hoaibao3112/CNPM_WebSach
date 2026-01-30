import express from 'express';
import PromotionController from '../controllers/PromotionController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', PromotionController.getAllPromotions);
router.get('/active-products', PromotionController.getActiveProducts);
router.get('/my-promotions', authenticateToken, PromotionController.getMyCoupons);
router.get('/:makm', PromotionController.getPromotionById);

router.post('/', authenticateToken, PromotionController.createPromotion);
router.put('/:makm', authenticateToken, PromotionController.updatePromotion);
router.delete('/:makm', authenticateToken, PromotionController.deletePromotion);

export default router;