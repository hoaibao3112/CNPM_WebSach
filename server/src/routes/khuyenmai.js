import express from 'express';
import PromotionController from '../controllers/PromotionController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { cacheMiddleware, clearProductCache } from '../middlewares/cacheMiddleware.js';

const router = express.Router();

router.get('/', cacheMiddleware(120), PromotionController.getAllPromotions);
router.get('/active-products', cacheMiddleware(120), PromotionController.getActiveProducts);
router.get('/product/:masp', cacheMiddleware(120), PromotionController.getPromotionsByProduct);
router.get('/my-promotions', authenticateToken, PromotionController.getMyCoupons);
router.get('/:makm', cacheMiddleware(120), PromotionController.getPromotionById);

router.post('/', authenticateToken, clearProductCache, PromotionController.createPromotion);
router.post('/claim/:makm', authenticateToken, clearProductCache, PromotionController.claimPromotion);
router.post('/apply-to-cart', authenticateToken, clearProductCache, PromotionController.applyToCart);
router.put('/:makm', authenticateToken, clearProductCache, PromotionController.updatePromotion);
router.delete('/:makm', authenticateToken, clearProductCache, PromotionController.deletePromotion);

export default router;