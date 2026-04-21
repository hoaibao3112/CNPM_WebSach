// server.js - Full rewrite with integrated WebSocket for real-time chat
import './src/config/app.config.js'; // Validate env vars on startup
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import pool from './src/config/connectDatabase.js';
import { initRoutes } from './src/routes/index.js';
import errorHandler from './src/middlewares/errorHandler.js';
import db from './src/models/index.js';
// Import the scheduled sync function from attendance admin route
import { syncMissedAttendancesForDate } from './src/routes/AttendanceAdmin.js';
import { createProxyMiddleware } from 'http-proxy-middleware';

// 1. Load environment config
dotenv.config({ path: './.env' });

const app = express();
const { PORT: HTTP_PORT = 5000, WS_PORT = 5001, DB_PORT = 3306 } = process.env;

// Log key env vars
console.log('Environment loaded:', {
  HTTP_PORT,
  WS_PORT,
  DB_PORT,
  CLIENT_ADMIN_URL: process.env.CLIENT_ADMIN_URL,
  CLIENT_CUSTOMER_URL: process.env.CLIENT_CUSTOMER_URL,
  JWT_SECRET: process.env.JWT_SECRET ? 'Loaded' : 'Not set',
});

// DEBUG: print presence (true/false) of DB and TLS env vars (do not print secrets)
console.log('DB env presence:', {
  DB_HOST: !!process.env.DB_HOST,
  DB_USER: !!process.env.DB_USER,
  DB_PASSWORD: !!process.env.DB_PASSWORD,
  DB_NAME: !!process.env.DB_NAME,
  DB_SSL_CA_present: !!process.env.DB_SSL_CA,
  DB_SSL_CA_BASE64_present: !!process.env.DB_SSL_CA_BASE64,
  DB_REQUIRE_SSL: process.env.DB_REQUIRE_SSL === 'true',
  DB_REJECT_UNAUTHORIZED: process.env.DB_REJECT_UNAUTHORIZED === 'true'
});

// 2. CORS configuration
const allowedOrigins = [
  process.env.CLIENT_ADMIN_URL || 'http://localhost:3000',
  process.env.CLIENT_CUSTOMER_URL || 'http://localhost:5500',
  'https://cnpm-web-sach.vercel.app',
  'https://cnpm-web-sach.vercel.app/',
  'http://localhost:5501',
  'http://localhost:5000',
  'http://127.0.0.1',
  'https://empty-words-pump.loca.lt',
];

// Helper to check if origin is allowed (including subdomains for Vercel/Render)
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow non-CORS requests (like postman or server-to-server)
  
  // Direct matches
  if (allowedOrigins.includes(origin)) return true;
  
  // Local development matches
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return true;
  
  try {
    const url = new URL(origin);
    // Allow ALL subdomains of Vercel and Render for convenience in production
    return (
      url.hostname.endsWith('.vercel.app') || 
      url.hostname.endsWith('.onrender.com') ||
      url.hostname === 'cnpm-web-sach.vercel.app'
    );
  } catch (err) {
    return false;
  }
};

app.use(cors({
  origin: true, // Reflect origin of requester (highly permissive for debugging)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Key', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 204,
}));

// 2.5 Explicitly handle all OPTIONS preflight requests
app.options('*', cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Key', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 204,
}));

// Health check and Diagnostic endpoints
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/diag', async (req, res) => {
  const diag = {
    timestamp: new Date().toISOString(),
    node_version: process.version,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST,
      DB_NAME: process.env.DB_NAME,
      DB_PORT: process.env.DB_PORT,
      DB_USER: process.env.DB_USER ? 'Set (masked)' : 'Not set',
      SSL_CA_B64: process.env.DB_SSL_CA_BASE64 ? 'Set' : 'Not set'
    },
    database: { connected: false, tables: [], error: null }
  };

  try {
    const conn = await pool.getConnection();
    diag.database.connected = true;
    const [tables] = await conn.query('SHOW TABLES');
    diag.database.tables = tables.map(t => Object.values(t)[0]);
    conn.release();
  } catch (err) {
    diag.database.error = {
      message: err.message,
      code: err.code,
      stack: err.stack
    };
  }

  res.json(diag);
});

app.get('/api/diag/schema', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const tablesToInspect = ['hoadon', 'chitiethoadon', 'khachhang', 'diachi', 'sanpham', 'giohang_chitiet', 'khuyen_mai'];
        const schema = {};
        
        // Test Sequelize
        let sequelizeStatus = 'not_tested';
        try {
            await db.sequelize.authenticate();
            const count = await db.KhachHang.count();
            sequelizeStatus = `ok (KhachHang count: ${count})`;
        } catch (e) {
            sequelizeStatus = `error: ${e.message}`;
        }

        for (const table of tablesToInspect) {
            try {
                const [cols] = await connection.query(`DESCRIBE ${table}`);
                schema[table] = cols.map(c => ({
                    Field: c.Field,
                    Type: c.Type,
                    Null: c.Null,
                    Key: c.Key,
                    Default: c.Default
                }));
            } catch (e) {
                schema[table] = { error: e.message };
            }
        }
        
        connection.release();
        res.json({
            timestamp: new Date().toISOString(),
            sequelizeStatus,
            schema
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (customer uploads) so URLs like /uploads/tra_hang/<file> are reachable
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Serve product images from backend/product so they are reachable at /product-images/<file>
const productImagesDir = path.join(process.cwd(), 'backend', 'product');
let productImageIndex = new Map();

const rebuildProductImageIndex = () => {
  try {
    const files = fs.readdirSync(productImagesDir, { withFileTypes: true });
    const next = new Map();

    for (const file of files) {
      if (!file.isFile()) continue;
      next.set(file.name.toLowerCase(), file.name);
    }

    productImageIndex = next;
  } catch (error) {
    console.warn('Could not build product image index:', error.message);
    productImageIndex = new Map();
  }
};

rebuildProductImageIndex();

app.use('/product-images', (req, res, next) => {
  const rawPath = decodeURIComponent(req.path || '/').replace(/^\/+/, '');
  if (!rawPath) {
    return next();
  }

  const safeName = path.basename(rawPath);
  const exactPath = path.join(productImagesDir, safeName);
  if (fs.existsSync(exactPath)) {
    return res.sendFile(exactPath);
  }

  let actualName = productImageIndex.get(safeName.toLowerCase());
  if (!actualName) {
    rebuildProductImageIndex();
    actualName = productImageIndex.get(safeName.toLowerCase());
  }

  if (actualName) {
    return res.sendFile(path.join(productImagesDir, actualName));
  }

  return next();
});

app.use('/product-images', express.static(productImagesDir));

app.use('/vnpay', createProxyMiddleware({
  target: 'https://sandbox.vnpayment.vn',
  changeOrigin: true,
  pathRewrite: { '^/vnpay': '' },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxy request:', {
      url: req.url,
      method: req.method,
      headers: req.headers
    });
    proxyReq.setHeader('Host', 'sandbox.vnpayment.vn');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Proxy response:', {
      url: req.url,
      status: proxyRes.statusCode,
      headers: proxyRes.headers
    });
    // Xóa CSP gốc
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['content-security-policy-report-only'];
    // Đặt CSP mới
    proxyRes.headers['content-security-policy'] = `
      default-src 'self' https://sandbox.vnpayment.vn https://*.vnpay.vn;
      connect-src 'self' http://localhost:* ws://localhost:* https://sandbox.vnpayment.vn https://*.vnpay.vn wss:;
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sandbox.vnpayment.vn https://*.vnpay.vn;
      style-src 'self' 'unsafe-inline' https://sandbox.vnpayment.vn https://*.vnpay.vn;
      img-src 'self' data: https://sandbox.vnpayment.vn https://*.vnpay.vn;
      frame-src 'self' https://sandbox.vnpayment.vn https://*.vnpay.vn;
      font-src 'self' https://sandbox.vnpayment.vn https://*.vnpay.vn;
      object-src 'none';
      base-uri 'self';
      form-action 'self' https://sandbox.vnpayment.vn https://*.vnpay.vn;
    `.trim().replace(/\s+/g, ' ');
    // Không can thiệp vào custom.min.js
    proxyRes.pipe(res);
  },
  onError: (err, req, res) => {
    console.error('Lỗi proxy:', err.message);
    res.status(500).json({ error: 'Lỗi proxy tới VNPay', details: err.message });
  }
}));
// 4. Initialize routes
initRoutes(app);

// 4.5 Global error handler (must be AFTER routes)
app.use(errorHandler);

// 5. Create HTTP server
const httpServer = createServer(app);

// 6. Integrated WebSocket Server for real-time chat
const wss = new WebSocketServer({ server: httpServer }); // Attach to HTTP server for unified port
const rooms = new Map(); // roomId -> Set<ws>

wss.on('connection', async (ws, req) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const roomId = url.searchParams.get('room_id');

    console.log(`WS Connection: room=${roomId}, token=${token ? 'present' : 'missing'}`);

    if (!token || !roomId) {
      ws.send(JSON.stringify({ action: 'error', message: 'Missing token or roomId' }));
      return ws.close(1008, 'Unauthorized');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    ws.user = decoded;
    ws.roomId = roomId;

    // Check room exists in DB
    const [rows] = await pool.query('SELECT * FROM chat_rooms WHERE room_id = ?', [roomId]);
    if (rows.length === 0) {
      ws.send(JSON.stringify({ action: 'error', message: 'Room not found' }));
      return ws.close(1008, 'Invalid Room');
    }

    // Add to room
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId).add(ws);

    // Send chat history on join
    const [messages] = await pool.query(
      'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC LIMIT 50', [roomId]
    );
    ws.send(JSON.stringify({ action: 'chat_history', messages }));

    console.log(`WS Connected: ${decoded.makh || decoded.MaTK || 'unknown'} to room ${roomId}`);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.action !== 'send_message') return;

        const { room_id, sender_id, sender_type, message: msgContent } = data.message;

        if (room_id !== roomId) return; // Security: only send to own room

        // Insert to DB
        const [result] = await pool.query(
          'INSERT INTO chat_messages (room_id, sender_id, sender_type, message, created_at) VALUES (?, ?, ?, ?, NOW())',
          [room_id, sender_id, sender_type, msgContent]
        );

        // Update room timestamp
        await pool.query('UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP WHERE room_id = ?', [room_id]);

        // Get full new message
        const [newMsg] = await pool.query('SELECT * FROM chat_messages WHERE message_id = ?', [result.insertId]);

        // Broadcast to other clients in room (exclude sender)
        if (rooms.has(room_id)) {
          rooms.get(room_id).forEach(client => {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
              client.send(JSON.stringify({ action: 'new_message', message: newMsg[0] }));
            }
          });
        }

        console.log(`Message broadcasted in room ${room_id}: ${msgContent.substring(0, 50)}...`);
      } catch (error) {
        console.error('WS Message Error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'error', message: 'Failed to send message' }));
        }
      }
    });

    ws.on('close', () => {
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(ws);
        if (rooms.get(roomId).size === 0) rooms.delete(roomId);
      }
      console.log(`WS Disconnected from room ${roomId}`);
    });

    ws.on('error', (error) => {
      console.error('WS Client Error:', error);
    });
  } catch (error) {
    console.error('WS Auth Error:', error.message);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'error', message: 'Authentication failed' }));
    }
    ws.close(1008, 'Unauthorized');
  }
});

// 7. Start servers
const startServers = async () => {
  try {
    // Test DB connection
    const conn = await pool.getConnection();
    console.log(`✅ MySQL connected on port ${DB_PORT}`);
    conn.release();

    // Generate test tokens (update to async)
    console.log('Generating test tokens...');
    const { generateToken } = await import('./src/utils/generateToken.js');
    try {
      const customerToken = await generateToken('19', 'customer');
      console.log('Customer Token:', customerToken.substring(0, 20) + '...');
      const staffToken = await generateToken('NV007', 'staff');
      console.log('Staff Token:', staffToken.substring(0, 20) + '...');
    } catch (genError) {
      console.error('Token generation error:', genError);
    }

    // Start HTTP server (WS attached)
    httpServer.listen(HTTP_PORT, () => {
      console.log(`🚀 HTTP Server running on http://localhost:${HTTP_PORT}`);
      console.log(`🛰️ WebSocket Server running on ws://localhost:${HTTP_PORT}`); // Unified port
    });

    // Handle port errors
    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${HTTP_PORT} is in use!`);
        console.log('Solutions: 1. Change HTTP_PORT in .env 2. Kill process on port 3. Restart');
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('❌ Failed to start servers:', err.message);
    process.exit(1);
  }
};

// 8. Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down...');

  // Close WS clients
  wss.clients.forEach(client => client.readyState === 1 && client.close(1001, 'Server shutdown'));
  await new Promise(resolve => wss.close(resolve));
  console.log('🛰️ WebSocket closed');

  // Close HTTP
  await new Promise(resolve => httpServer.close(resolve));
  console.log('🚀 HTTP closed');

  // Close DB
  await pool.end();
  console.log('🔌 DB closed');

  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start
startServers();

// Schedule daily missed attendance sync: run once at next 18:00 and then every 24h
// At 18:00 the job will sync for the current day (mark today's missing attendances)
const scheduleDailyMissedSync = () => {
  const runSync = async () => {
    try {
      // Sync for today at 18:00
      const today = new Date();
      await syncMissedAttendancesForDate(today);
      console.log('[Attendance Sync] Completed missed attendance sync for', today.toISOString().slice(0,10));
    } catch (err) {
      console.error('[Attendance Sync] Error during missed attendance sync:', err);
    }
  };

  const now = new Date();
  let nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0); // today at 18:00
  if (now >= nextRun) {
    // if it's already past 18:00 today, schedule for tomorrow 18:00
    nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 18, 0, 0);
  }
  const delay = nextRun.getTime() - now.getTime();

  console.log(`[Attendance Sync] Scheduling first run in ${Math.round(delay/1000)}s at ${nextRun.toISOString()}`);

  setTimeout(() => {
    runSync();
    setInterval(runSync, 24 * 60 * 60 * 1000); // every 24h
  }, delay);
};

// Start scheduler
scheduleDailyMissedSync();