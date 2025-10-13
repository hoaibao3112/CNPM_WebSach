import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

async function fetchProductContext() {
  try {
    const response = await axios.get('http://localhost:5000/api/product');
    return response.data.slice(0, 10);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin sản phẩm:', error);
    return [];
  }
}

// Simple rule-based chat cho đến khi Gemini hoạt động
function generateSimpleResponse(message, products) {
  const lowerMessage = message.toLowerCase();
  
  // Tìm kiếm sách
  if (lowerMessage.includes('tìm') || lowerMessage.includes('sách') || lowerMessage.includes('có')) {
    const foundProduct = products.find(p => 
      p.TenSP?.toLowerCase().includes(lowerMessage.split(' ').find(word => word.length > 3))
    );
    
    if (foundProduct) {
      return `Tôi tìm thấy sách "${foundProduct.TenSP}" với giá ${foundProduct.Gia?.toLocaleString('vi-VN')} VNĐ. [PRODUCT_ID: ${foundProduct.MaSP}]`;
    } else {
      return 'Tôi không tìm thấy sách phù hợp. Bạn có thể xem thêm sản phẩm khác trên website.';
    }
  }
  
  // Câu hỏi về giá
  if (lowerMessage.includes('giá') || lowerMessage.includes('bao nhiêu')) {
    return 'Giá sách dao động từ 50,000 - 500,000 VNĐ tùy loại. Bạn có thể xem chi tiết từng sản phẩm.';
  }
  
  // Câu hỏi chào hỏi
  if (lowerMessage.includes('xin chào') || lowerMessage.includes('chào') || lowerMessage.includes('hello')) {
    return 'Xin chào! Tôi là trợ lý ảo của cửa hàng sách. Tôi có thể giúp bạn tìm sách, tư vấn sản phẩm. Bạn cần hỗ trợ gì?';
  }
  
  // Mặc định
  return `Cảm ơn bạn đã liên hệ! Tôi đã ghi nhận câu hỏi: "${message}". 
  Bạn có thể:
  - Tìm kiếm sách theo tên
  - Hỏi về giá cả
  - Liên hệ: 0938 424 289`;
}

router.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Vui lòng nhập tin nhắn.' });
  }

  try {
    const products = await fetchProductContext();
    const reply = generateSimpleResponse(message, products);
    
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Lỗi hệ thống. Vui lòng thử lại sau.' });
  }
});

export default router;