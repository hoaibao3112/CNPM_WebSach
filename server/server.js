import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import pool from './src/config/connectDatabase.js';
import { initRoutes } from './src/routes/index.js';
 import { createProxyMiddleware } from 'http-proxy-middleware';
// 1. Tải cấu hình môi trường
dotenv.config({ path: './.env' });

const app = express();
const { PORT: HTTP_PORT = 5000, WS_PORT = 5001, DB_PORT = 3306 } = process.env;

// Log các biến môi trường quan trọng
console.log('Environment loaded:', {
  HTTP_PORT,
  WS_PORT,
  DB_PORT,
  CLIENT_ADMIN_URL: process.env.CLIENT_ADMIN_URL,
  CLIENT_CUSTOMER_URL: process.env.CLIENT_CUSTOMER_URL,
  JWT_SECRET: process.env.JWT_SECRET ? 'Loaded' : 'Not set',
});

// 2. Cấu hình CORS
const allowedOrigins = [
  process.env.CLIENT_ADMIN_URL || 'http://localhost:3000',
  process.env.CLIENT_CUSTOMER_URL || 'http://localhost:5501',
  'http://localhost:5000',
  'http://127.0.0.1',
  'https://empty-words-pump.loca.lt',
  `ws://localhost:${WS_PORT}`,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Cho phép yêu cầu từ file://
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    console.warn(`CORS blocked: Origin ${origin} not allowed`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3. Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Thêm sau phần middleware hiện có
app.use('/vnpay', createProxyMiddleware({
    target: 'https://sandbox.vnpayment.vn',
    changeOrigin: true,
    pathRewrite: { '^/vnpay': '' },
    onProxyReq: function (proxyReq, req, res) {
        console.log('Proxy request:', req.url); // Log URL yêu cầu
    },
    onProxyRes: function (proxyRes, req, res) {
        console.log('Proxy response for:', req.url);
        if (req.url.includes('custom.min.js')) {
            console.log('Modifying custom.min.js');
            let js = '';
            proxyRes.on('data', (chunk) => {
                js += chunk.toString('utf8');
            });
            proxyRes.on('end', () => {
                js = `window.timer = 600; ${js}`; // Khởi tạo timer = 600 giây
                res.setHeader('Content-Type', 'application/javascript');
                res.write(js);
            });
        } else if (req.url.includes('vpcpay.html')) {
            console.log('Modifying vpcpay.html');
            let html = '';
            proxyRes.on('data', (chunk) => {
                html += chunk.toString('utf8');
            });
            proxyRes.on('end', () => {
                html = html.replace(
                    'https://sandbox.vnpayment.vn/paymentv2/Scripts/custom.min.js',
                    '/vnpay/paymentv2/Scripts/custom.min.js'
                );
                res.setHeader('Content-Type', 'text/html');
                res.write(html);
            });
        }
    }
}));
// Phục vụ ảnh từ thư mục product
app.use('/product', express.static('C:/Users/PC/Desktop/CNPM/server/backend/product'));

// 4. Middleware logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.get('origin') || 'no-origin';
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} from ${origin}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body); // Thêm để xem dữ liệu gửi lên
  console.log('Cookies:', req.cookies);
  next();
});

// 5. Khởi tạo routes
initRoutes(app);

// 6. Xử lý lỗi
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 7. Tạo server HTTP và WebSocket
const httpServer = createServer(app);
const wss = new WebSocketServer({ port: WS_PORT });

// 8. Xử lý WebSocket
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`🛰️ New WebSocket connection from ${clientIp}`);

  ws.on('message', (message) => {
    try {
      const msg = message.toString();
      console.log(`📩 Received: ${msg}`);
      ws.send(`Server: ${msg}`);
    } catch (err) {
      console.error('Message processing error:', err);
    }
  });

  ws.on('close', () => {
    console.log(`❌ Client ${clientIp} disconnected`);
  });

  ws.on('error', (err) => {
    console.error('WebSocket Error:', err);
  });
});

// 9. Khởi động hệ thống
const startServers = async () => {
  try {
    // Kiểm tra kết nối database
    const conn = await pool.getConnection();
    console.log(`✅ MySQL connected on port ${DB_PORT}`);
    conn.release();

    // Khởi động HTTP server
    httpServer.listen(HTTP_PORT, () => {
      console.log(`🚀 HTTP Server running on http://localhost:${HTTP_PORT}`);
      console.log(`🛰️ WebSocket Server running on ws://localhost:${WS_PORT}`);
    });

    // Xử lý lỗi port
    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${HTTP_PORT} is in use!`);
        console.log('ℹ️ Solutions:');
        console.log('1. Change HTTP_PORT in .env');
        console.log(`2. Run: netstat -ano | findstr :${HTTP_PORT}`);
        console.log('3. Restart your computer');
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('❌ Failed to start servers:', err.message);
    console.log('👉 Check MySQL connection and ports');
    process.exit(1);
  }
};

// 10. Tắt server an toàn
const shutdown = async () => {
  console.log('\n🛑 Shutting down servers...');

  // Đóng WebSocket
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.close(1001, 'Server shutdown');
    }
  });
  await new Promise((resolve) => wss.close(resolve));
  console.log('🛰️ WebSocket server closed');

  // Đóng HTTP server
  await new Promise((resolve) => httpServer.close(resolve));
  console.log('🚀 HTTP server closed');

  // Đóng kết nối database
  await pool.end();
  console.log('🔌 Database connection closed');

  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 11. Khởi chạy
startServers();