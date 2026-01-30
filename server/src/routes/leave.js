import express from 'express';
import HRController from '../controllers/HRController.js';

const router = express.Router();

router.get('/', HRController.getAllLeaves);
router.post('/', HRController.createLeave);
router.put('/:id/approve', HRController.approveLeave);
router.put('/:id/reject', HRController.rejectLeave);

export default router;