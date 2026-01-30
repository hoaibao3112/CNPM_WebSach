import express from 'express';
import RecommendationController from '../controllers/RecommendationController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/personalized', authenticateToken, RecommendationController.getPersonalized);

export default router;
