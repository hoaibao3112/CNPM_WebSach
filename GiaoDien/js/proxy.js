// File: proxy.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors()); // Cho phép tất cả origins (chỉ dùng cho development)

app.get('/api/products', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/api/product');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Proxy server chạy tại http://localhost:3001');
});