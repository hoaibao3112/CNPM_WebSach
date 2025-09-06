// src/routes/auth.js

import express from 'express';
const router = express.Router();

// Một ví dụ về route xử lý đăng nhập
router.post('/login', (req, res) => {
  // Logic xử lý đăng nhập
  res.send('Đăng nhập thành công');
});

export default router;
