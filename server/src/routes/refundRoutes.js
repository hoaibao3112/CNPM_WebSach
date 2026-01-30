import express from 'express';
import RefundController from '../controllers/RefundController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// ===== CUSTOMER REFUND OPERATIONS =====
// Create refund request (customer)
router.post('/request', authenticateToken, RefundController.createRefundRequest);

// Get customer's refund history
router.get('/customer/:customerId', authenticateToken, RefundController.getCustomerRefunds);

// Cancel refund request (customer)
router.put('/:id/cancel', authenticateToken, RefundController.cancelRefundRequest);

// Get refund details by ID
router.get('/:id', authenticateToken, RefundController.getRefundById);

// ===== ADMIN REFUND MANAGEMENT =====
// Get all refunds for admin (with filters)
router.get('/admin/list', authenticateToken, RefundController.getAdminRefunds);

// Update refund status (admin)
router.put('/:id/status', authenticateToken, RefundController.updateRefundStatus);

// Process VNPay refund (admin)
router.post('/:id/process-vnpay', authenticateToken, RefundController.processVNPayRefund);

// ===== VNPAY REFUND LOGS =====
// Get VNPay refund transaction logs
router.get('/vnpay/logs', authenticateToken, RefundController.getVNPayRefundLogs);

export default router;
