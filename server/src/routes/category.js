import express from 'express';
import CategoryController from '../controllers/CategoryController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { cacheMiddleware, clearProductCache } from '../middlewares/cacheMiddleware.js';

const router = express.Router();

router.get('/', cacheMiddleware(300), CategoryController.getAll);
router.get('/:id', cacheMiddleware(300), CategoryController.getById);

// Admin only (should add checkAdmin middleware)
router.post('/', authenticateToken, clearProductCache, CategoryController.create);
router.put('/:id', authenticateToken, clearProductCache, CategoryController.update);
router.delete('/:id', authenticateToken, clearProductCache, CategoryController.delete);

export default router;
