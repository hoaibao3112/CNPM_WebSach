import express from 'express';
import AuthController from '../controllers/AuthController.js';
import CartController from '../controllers/CartController.js';
import CustomerController from '../controllers/CustomerController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Auth routes (mirrored for backward compatibility)
router.post('/login', AuthController.login);
router.post('/register/send-otp', AuthController.sendOTP);
router.post('/register/verify-otp', AuthController.verifyOTP);
router.post('/register/set-password', AuthController.setPassword);
router.post('/forgot-password/send-otp', AuthController.sendForgotOTP);
router.post('/forgot-password/verify-otp', AuthController.verifyForgotOTP);
router.post('/forgot-password/reset', AuthController.resetPassword);
router.post('/auth/google', AuthController.googleAuth);
router.post('/logout', authenticateToken, AuthController.logout);

// Profile routes
router.get('/profile', authenticateToken, CustomerController.getProfile);
router.put('/profile', authenticateToken, CustomerController.updateProfile);
// Note: Frontend likely expects PUT /profile/change-password - I should add it to AuthController
router.put('/profile/change-password', authenticateToken, AuthController.changePassword);

// Cart routes (mirrored)
router.get('/cart', authenticateToken, CartController.getCart);
router.post('/cart/add', authenticateToken, CartController.add);
router.put('/cart/update', authenticateToken, CartController.update);
router.put('/cart/select', authenticateToken, CartController.toggleSelection);
router.delete('/cart/remove/:productId', authenticateToken, CartController.remove);
router.delete('/cart/clear', authenticateToken, CartController.clear);

// Activity routes
router.post('/activity/view', CustomerController.logView);
router.post('/activity/search', CustomerController.logSearch);

// Proxy other customer-related routes if needed
router.get('/:makh/promo-usage', CustomerController.getPromoUsage);
router.get('/:makh/promo-list', CustomerController.getPromoList);

export default router;