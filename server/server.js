import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import pool from './src/config/connectDatabase.js';
import { initRoutes } from './src/routes/index.js';

// 1. Cấu hình môi trường
dotenv.config();
const app = express();
const HTTP_PORT = parseInt(process.env.PORT) || 5000; // Sử dụng port 5000
const WS_PORT = parseInt(process.env.WS_PORT) || 5001;
const DB_PORT = parseInt(process.env.DB_PORT) || 3306;

// 2. Cấu hình CORS cho cả admin và khách hàng
const allowedOrigins = [
  process.env.CLIENT_ADMIN_URL || 'http://localhost:3000',
  process.env.CLIENT_CUSTOMER_URL || 'http://localhost:5501',
  'http://localhost:5000', // Hỗ trợ port 5000
  `ws://localhost:${WS_PORT}`,
  'http://127.0.0.1:5500'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.error(`CORS blocked: Origin ${origin} not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${req.get('origin') || 'no-origin'}`);
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

// 7. Tạo servers
const httpServer = createServer(app);
const wss = new WebSocketServer({ port: WS_PORT });

// 8. WebSocket Handler
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
      console.log(`🚀 HTTP Server: http://localhost:${HTTP_PORT}`);
      console.log(`🛰️ WebSocket Server: ws://localhost:${WS_PORT}`);
      console.log(`💾 MySQL Server: localhost:${DB_PORT}`);
    });

    // Xử lý lỗi port
    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${HTTP_PORT} đang được sử dụng!`);
        console.log('ℹ️ Các giải pháp:');
        console.log('1. Đổi HTTP_PORT trong file .env');
        console.log('2. Chạy lệnh: netstat -ano | findstr :' + HTTP_PORT);
        console.log('3. Khởi động lại máy tính');
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('❌ Khởi động thất bại:', err.message);
    console.log('👉 Kiểm tra lại kết nối MySQL và các port');
    process.exit(1);
  }
};

// 10. Graceful Shutdown
const shutdown = async () => {
  console.log('\n🛑 Đang tắt server...');
  
  // Đóng WebSocket
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.close(1001, 'Server shutdown');
    }
  });
  
  await new Promise(resolve => wss.close(resolve));
  console.log('🛰️ WebSocket server closed');

  // Đóng HTTP server
  await new Promise(resolve => httpServer.close(resolve));
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