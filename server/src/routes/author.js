import express from 'express';
import AuthorController from '../controllers/AuthorController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', AuthorController.getAll);
router.get('/nationalities/list', AuthorController.getNationalities);
router.get('/:id', AuthorController.getById);

// Protected routes
router.post('/', authenticateToken, AuthorController.create);
router.put('/:id', authenticateToken, AuthorController.update);
router.delete('/:id', authenticateToken, AuthorController.delete);

export default router;