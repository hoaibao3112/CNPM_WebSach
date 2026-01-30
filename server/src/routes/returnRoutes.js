import express from 'express';
import ReturnController from '../controllers/ReturnController.js';

const router = express.Router();

router.get('/', ReturnController.getAll);
router.post('/', ReturnController.create);

export default router;