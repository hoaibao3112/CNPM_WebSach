import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

async function fetchProductContext() {
  try {
    const response = await axios.get('http://localhost:5000/api/product');
    return `Danh sách sản phẩm: ${JSON.stringify(response.data.slice(0, 10))}. Trả lời bằng tiếng Việt.`;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin sản phẩm:', error);
    return 'Không có thông tin sản phẩm hiện tại. Trả lời bằng tiếng Việt.';
  }
}

router.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Vui lòng nhập tin nhắn.' });
  }

  const apiKey = process.env.GENNIAMA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key Gemini chưa được cấu hình.' });
  }

  try {
    const context = await fetchProductContext();

    const apiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            role: 'user',
            parts: [
              {
              text: `${context}\n\nCâu hỏi: ${message}\n\nHướng dẫn trả lời: Luôn trả lời bằng tiếng Việt. Nếu đề cập đến sản phẩm cụ thể từ danh sách, thêm [PRODUCT_ID: MaSP] ở cuối câu trả lời, trong đó MaSP là ID từ JSON (ví dụ: [PRODUCT_ID: 123]). Nếu không có sản phẩm khớp, nói 'Không tìm thấy' và không thêm tag.`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = apiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text ||
                  'Xin lỗi, không có phản hồi từ Gemini.';
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.json({ reply });
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Lỗi khi xử lý yêu cầu chat với Gemini. Vui lòng thử lại sau.' });
  }
});

export default router;