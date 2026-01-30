import express from 'express';
import SpecialController from '../controllers/SpecialController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/rooms', authenticateToken, SpecialController.getRoom);
router.post('/messages', authenticateToken, SpecialController.sendMessage);

export default router;