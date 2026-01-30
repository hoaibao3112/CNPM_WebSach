import express from 'express';
import CartController from '../controllers/CartController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @route   GET /api/cart
 * @desc    Get current user's cart
 * @access  Private
 */
router.get('/', authenticateToken, CartController.getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add a product to cart
 * @access  Private
 */
router.post('/add', authenticateToken, CartController.add);

/**
 * @route   PUT /api/cart/update
 * @desc    Update product quantity in cart
 * @access  Private
 */
router.put('/update', authenticateToken, CartController.update);

/**
 * @route   DELETE /api/cart/remove
 * @desc    Remove a product from cart (body: {productId})
 * @access  Private
 */
router.delete('/remove', authenticateToken, CartController.remove);

/**
 * @route   DELETE /api/cart/remove/:id
 * @desc    Remove a product from cart (URL param)
 * @access  Private
 */
router.delete('/remove/:id', authenticateToken, CartController.remove);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear the whole cart
 * @access  Private
 */
router.delete('/clear', authenticateToken, CartController.clear);

/**
 * @route   POST /api/cart/reorder/:orderId
 * @desc    Re-add items from a previous order to cart
 * @access  Private
 */
router.post('/reorder/:orderId', authenticateToken, CartController.reorder);

export default router;