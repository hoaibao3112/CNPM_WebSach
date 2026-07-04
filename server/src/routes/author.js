import express from 'express';
import AuthorController from '../controllers/AuthorController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { cacheMiddleware, clearProductCache } from '../middlewares/cacheMiddleware.js';

const router = express.Router();

router.get('/', cacheMiddleware(300), AuthorController.getAll);
router.get('/nationalities/list', cacheMiddleware(300), AuthorController.getNationalities);
router.get('/:id', cacheMiddleware(300), AuthorController.getById);

// Protected routes
router.post('/', authenticateToken, clearProductCache, AuthorController.create);
router.put('/:id', authenticateToken, clearProductCache, AuthorController.update);
router.delete('/:id', authenticateToken, clearProductCache, AuthorController.delete);

export default router;