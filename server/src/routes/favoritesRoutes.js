import express from 'express';
import InteractionController from '../controllers/InteractionController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticateToken, InteractionController.getFavorites);
router.post('/', authenticateToken, InteractionController.addFavorite);
// Other favorite routes...

export default router;
