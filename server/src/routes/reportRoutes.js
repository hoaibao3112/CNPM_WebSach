import express from 'express';
import ReportController from '../controllers/ReportController.js';

const router = express.Router();

router.get('/doanhthu/nam', ReportController.getRevenueByYear);
router.get('/overview', ReportController.getOverview);

export default router;