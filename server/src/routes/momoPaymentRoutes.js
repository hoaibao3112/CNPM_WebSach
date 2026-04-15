/**
 * MoMo Payment Routes
 * Endpoints: POST /create, GET /return, POST /ipn, POST /refund
 */
import express from 'express';
import MoMoPaymentController from '../controllers/MoMoPaymentController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Create MoMo payment (requires auth)
router.post('/create', authenticateToken, (req, res) => MoMoPaymentController.createPayment(req, res));

// MoMo redirect return (no auth needed)
router.get('/momo-return', (req, res) => MoMoPaymentController.momoReturn(req, res));

// MoMo IPN callback (no auth needed - from MoMo server)
router.post('/momo-ipn', (req, res) => MoMoPaymentController.momoIPN(req, res));

// Refund payment (requires auth)
router.post('/refund', authenticateToken, (req, res) => MoMoPaymentController.refundPayment(req, res));

export default router;
