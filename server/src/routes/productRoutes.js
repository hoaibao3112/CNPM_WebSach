import express from 'express';
import ProductController from '../controllers/ProductController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbacMiddleware.js';

import AuthorController from '../controllers/AuthorController.js';
import CategoryController from '../controllers/CategoryController.js';

const router = express.Router();

// Public routes
router.get('/', ProductController.getAll);

// Aliases for Product Management
router.get('/authors', AuthorController.getAll);
router.get('/categories', CategoryController.getAll);
router.get('/suppliers', (req, res) => res.redirect('/api/company')); // Redirect to company API

router.get('/sorted/:type', ProductController.getSorted);
router.get('/category/:id', ProductController.getByCategory);
router.get('/recommendations', ProductController.getRecommendations);
router.get('/low-stock', authenticateToken, authorize('PRODUCT_READ'), ProductController.getLowStock);
router.get('/:id', ProductController.getById);

// Admin routes
router.post('/', authenticateToken, authorize('PRODUCT_CREATE'), ProductController.create);
router.put('/:id', authenticateToken, authorize('PRODUCT_UPDATE'), ProductController.update);
router.patch('/:id/min-stock', authenticateToken, authorize('PRODUCT_UPDATE'), ProductController.updateMinStock);
router.delete('/:id', authenticateToken, authorize('PRODUCT_DELETE'), ProductController.delete);

export default router;