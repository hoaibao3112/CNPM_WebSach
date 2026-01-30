import express from 'express';
import InteractionController from '../controllers/InteractionController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/product/:masp', InteractionController.getComments);
// Other comment routes...

export default router;