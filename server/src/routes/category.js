import express from 'express';
import CategoryController from '../controllers/CategoryController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getById);

// Admin only (should add checkAdmin middleware)
router.post('/', authenticateToken, CategoryController.create);
router.put('/:id', authenticateToken, CategoryController.update);
router.delete('/:id', authenticateToken, CategoryController.delete);

export default router;
