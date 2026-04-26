import express from 'express';
import rateLimit from 'express-rate-limit';
import OrderController from '../controllers/OrderController.js';
import RefundController from '../controllers/RefundController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Rate limiter riêng cho đặt hàng — chống spam và brute-force mã giảm giá
const placeOrderLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 phút
    max: 10,              // tối đa 10 đơn/phút/IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Bạn đặt hàng quá nhiều, vui lòng thử lại sau 1 phút.' },
    keyGenerator: (req) => req.user?.makh || req.ip, // Rate limit theo user ID (sau auth)
});

// ===== VNPAY =====
// VNPay payment callback (no auth required - it's a redirect from VNPay)
// CHÚ Ý: Phải đặt trên các route có tham số như /:id để tránh bị match nhầm
router.get('/vnpay_return', OrderController.vnpayReturn);

// ===== ORDER OPERATIONS =====
// Place order (VNPay or COD) — rate limited per user
router.post('/place-order', authenticateToken, placeOrderLimiter, OrderController.placeOrder);

// Get all orders (admin only)
const requireAdmin = (req, res, next) => {
    if (req.user?.userType !== 'admin') {
        return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền truy cập' });
    }
    next();
};
router.get('/hoadon', authenticateToken, requireAdmin, OrderController.getAllOrders);

// Get single order details
router.get('/:id', authenticateToken, OrderController.getOrderDetails);

// Update order status (admin)
router.put('/hoadon/:id/status', authenticateToken, OrderController.updateOrderStatus);
router.put('/hoadon/:id/trangthai', authenticateToken, OrderController.updateOrderStatus); // Vietnamese alias

// Update order address (alternative pattern)
router.put('/hoadon/:id/address', authenticateToken, OrderController.updateOrderAddress);

// Delete order (admin)
router.delete('/hoadon/:id', authenticateToken, OrderController.deleteOrder);

// ===== CUSTOMER ORDERS =====
// Get customer's orders
router.get('/customer-orders/:customerId', authenticateToken, OrderController.getCustomerOrders);

// Get customer order detail (alternative endpoint pattern)
router.get('/customer-orders/detail/:orderId', authenticateToken, OrderController.getOrderDetails);

// Cancel order
router.put('/customer-orders/cancel/:orderId', authenticateToken, OrderController.cancelOrder);

// Get customer's refund history
router.get('/customer-refunds/:customerId', authenticateToken, RefundController.getCustomerRefunds);

// ===== ADDRESS MANAGEMENT =====
// Get customer addresses
router.get('/customer-addresses/:customerId', authenticateToken, OrderController.getCustomerAddresses);

// Create address
router.post('/customer-addresses', authenticateToken, OrderController.createAddress);

// Update address
router.put('/customer-addresses/:id', authenticateToken, OrderController.updateAddress);

// Delete address
router.delete('/customer-addresses/:id', authenticateToken, OrderController.deleteAddress);

// Set default address
router.put('/customer-addresses/:id/set-default', authenticateToken, OrderController.setDefaultAddress);

// ===== LOCATION RESOLUTION =====
// Resolve province/district/ward codes to names
router.get('/resolve/province/:code', OrderController.resolveProvince);
router.get('/resolve/district/:code', OrderController.resolveDistrict);
router.get('/resolve/ward/:code', OrderController.resolveWard);



export default router;