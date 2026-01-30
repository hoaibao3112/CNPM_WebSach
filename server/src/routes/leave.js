import express from 'express';
import HRController from '../controllers/HRController.js';

const router = express.Router();

router.get('/', HRController.getAllLeaves);
router.post('/', HRController.createLeave);

export default router;