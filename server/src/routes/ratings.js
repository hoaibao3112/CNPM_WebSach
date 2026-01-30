import express from 'express';
import InteractionController from '../controllers/InteractionController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/:productId', InteractionController.getRatings);
router.post('/', authenticateToken, InteractionController.addRating);

export default router;