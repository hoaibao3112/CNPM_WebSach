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
    // Lấy các từ có ý nghĩa (độ dài > 2) để tìm khớp với tên sản phẩm hoặc tác giả
    const words = lowerMessage.split(/\s+/).map(w => w.replace(/[^\p{L}0-9]/gu, '')).filter(w => w && w.length > 2);

    // Nếu không có từ đủ dài, fallback dùng toàn câu
    const searchTerms = words.length > 0 ? words : [lowerMessage];

    const foundProduct = products.find(p => {
      const name = (p.TenSP || p.Ten_san_pham || p.name || '').toString().toLowerCase();
      const author = (p.TenTG || p.TacGia || p.author || '').toString().toLowerCase();
      return searchTerms.some(term => name.includes(term) || author.includes(term));
    });

    if (foundProduct) {
      // Nhiều API/DB có thể trả tên trường giá khác nhau (DonGia, Gia, price,...)
      const rawPrice = foundProduct.DonGia ?? foundProduct.Gia ?? foundProduct.price ?? foundProduct.Price ?? null;
      const price = rawPrice != null ? Number(rawPrice) : null;
      const priceText = price != null && !Number.isNaN(price) ? price.toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ để biết giá';

      const title = foundProduct.TenSP ?? foundProduct.name ?? foundProduct.Ten_san_pham ?? 'Sản phẩm';
      const id = foundProduct.MaSP ?? foundProduct.id ?? foundProduct.ID ?? '';

      return `Tôi tìm thấy sách "${title}" với giá ${priceText}. [PRODUCT_ID: ${id}]`;
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

  // Yêu cầu liên hệ / hỗ trợ (trả về đường dẫn Zalo để frontend hiển thị nút)
  if (lowerMessage.includes('liên hệ') || lowerMessage.includes('lien he') || lowerMessage.includes('hỗ trợ') || lowerMessage.includes('zalo') || lowerMessage.includes('liên hệ tôi') || lowerMessage.includes('liên hệ với')) {
    const text = 'Bạn có thể liên hệ với chúng tôi qua Zalo hoặc gọi số 0938 424 289. Nhấn nút bên dưới để mở Zalo.';
      const contact = {
        type: 'zalo',
        url: 'https://zalo.me/0374170367',
        label: 'Nhắn tin qua Zalo',
        // Serve the backend image via the server so frontend can fetch it across origins
        qr: 'http://localhost:5000/anh_phu/zalo.png'
      };
    return { text, contact };
  }
  
  // Mặc định
  return `Cảm ơn bạn đã liên hệ! Tôi đã ghi nhận câu hỏi: "${message}". 
  Bạn có thể:
  - Tìm kiếm sách theo tên
  - Hỏi về giá cả
  - Liên hệ: 0374170367 (Zalo)
  Vui lòng đặt câu hỏi cụ thể hơn để tôi có thể hỗ trợ bạn tốt nhất.`;
}

router.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Vui lòng nhập tin nhắn.' });
  }

  try {
    const products = await fetchProductContext();
    const result = generateSimpleResponse(message, products);

    res.set('Content-Type', 'application/json; charset=utf-8');
    // If the generator returned an object with contact info, include it in the response
    if (result && typeof result === 'object' && result.text) {
      res.json({ reply: result.text, contact: result.contact || null });
    } else {
      res.json({ reply: result });
    }
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Lỗi hệ thống. Vui lòng thử lại sau.' });
  }
});

export default router;