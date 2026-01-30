import express from 'express';
import HRController from '../controllers/HRController.js';

const router = express.Router();

router.get('/', HRController.getAttendance);
router.post('/', HRController.markAttendance);

export default router;