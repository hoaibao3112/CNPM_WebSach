/**
 * ZaloPay Payment Routes
 * Endpoints: POST /zalopay/create, GET /zalopay/return, POST /zalopay/ipn, POST /zalopay/refund
 */
import express from 'express';
import ZaloPayPaymentController from '../controllers/ZaloPayPaymentController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Create ZaloPay payment (requires auth)
router.post('/zalopay/create', authenticateToken, (req, res) => ZaloPayPaymentController.createPayment(req, res));

// ZaloPay redirect return (no auth needed)
router.get('/zalopay/return', (req, res) => ZaloPayPaymentController.zaloPayReturn(req, res));

// ZaloPay IPN callback (no auth needed - from ZaloPay server)
router.post('/zalopay/ipn', (req, res) => ZaloPayPaymentController.zaloPayIPN(req, res));

// Refund payment (requires auth)
router.post('/zalopay/refund', authenticateToken, (req, res) => ZaloPayPaymentController.refundPayment(req, res));

export default router;
