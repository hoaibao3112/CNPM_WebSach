import express from 'express';
import axios from 'axios';

const router = express.Router();

const CHATBOT_URL = process.env.CHATBOT_URL || 'http://localhost:8000';

/**
 * POST /api/chatbot/chat
 * Proxies chat requests to the Python AI Chatbot service.
 */
router.post('/chat', async (req, res) => {
  const { message, session_id } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Vui lòng nhập tin nhắn.' });
  }

  try {
    const response = await axios.post(`${CHATBOT_URL}/chat`, {
      message,
      session_id: session_id || null,
    }, {
      timeout: 60000, // 60s timeout for LLM processing
      headers: { 'Content-Type': 'application/json' },
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Chatbot proxy error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Chatbot AI chưa sẵn sàng. Vui lòng thử lại sau.',
        fallback: true,
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data?.detail || 'Lỗi từ chatbot service.',
      });
    }

    return res.status(500).json({
      error: 'Lỗi hệ thống. Vui lòng thử lại sau.',
    });
  }
});

/**
 * GET /api/chatbot/health
 * Health check for the Python chatbot service.
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${CHATBOT_URL}/`, { timeout: 5000 });
    return res.json({ status: 'OK', chatbot: response.data });
  } catch (error) {
    return res.json({ status: 'UNAVAILABLE', error: error.message });
  }
});

export default router;
