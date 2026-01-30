import express from 'express';
import AuthController from '../controllers/AuthController.js';

const router = express.Router();

/**
 * @route   POST /api/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/', AuthController.login);

export default router;