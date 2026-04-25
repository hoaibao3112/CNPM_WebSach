import express from 'express';
import SalaryController from '../controllers/SalaryController.js';

const router = express.Router();

router.get('/monthly/:year', SalaryController.getMonthlyTotal);
router.post('/compute/:year/:month', SalaryController.compute);
router.get('/history/:id', SalaryController.getHistory);

export default router;