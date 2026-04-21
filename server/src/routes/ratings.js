import express from 'express';
import InteractionController from '../controllers/InteractionController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Admin checking pending ratings
router.get('/pending/list', authenticateToken, InteractionController.getPendingRatings);
router.post('/pending/:id/approve', authenticateToken, InteractionController.approveRating);
router.delete('/pending/:id', authenticateToken, InteractionController.rejectRating);

// Public get ratings per product
router.get('/:productId', InteractionController.getRatings);
router.post('/', authenticateToken, InteractionController.addRating);

export default router;