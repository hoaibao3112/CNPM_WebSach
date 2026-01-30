// src/routes/auth.js

import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Login route
router.post('/login', (req, res) => {
  // Logic xử lý đăng nhập
  res.send('Đăng nhập thành công');
});

// Logout route
router.post('/logout', authenticateToken, AuthController.logout);

export default router;
