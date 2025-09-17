const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const db = require('../config/connectDatabase');

const wss = new WebSocket.Server({ port: 5001 });

wss.on('connection', async (ws, req) => {
  try {
    // Lấy token và roomId từ query string
    const url = new URL(req.url, `ws://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const roomId = url.searchParams.get('room_id');

    console.log(`New connection attempt: token=${token ? 'present' : 'missing'}, room_id=${roomId}`);

    // Kiểm tra token
    if (!token) {
      console.error('Missing token');
      ws.send(JSON.stringify({ action: 'error', message: 'Token không tồn tại' }));
      return ws.close(1008, 'Unauthorized');
    }

    // Kiểm tra JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set in environment');
      ws.send(JSON.stringify({ action: 'error', message: 'Server config error' }));
      return ws.close(1011, 'Internal Error');
    }

    // Xác thực token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified successfully:', decoded);
    } catch (jwtError) {
      console.error('JWT Verify failed:', jwtError.message);
      ws.send(JSON.stringify({ action: 'error', message: `Token invalid: ${jwtError.message}` }));
      return ws.close(1008, 'Unauthorized');
    }

    ws.user = decoded; // Lưu thông tin người dùng (e.g., { makh, userType })
    ws.roomId = roomId; // Lưu roomId

    // Kiểm tra roomId hợp lệ
    if (!roomId) {
      console.error('Missing roomId');
      ws.send(JSON.stringify({ action: 'error', message: 'RoomId không được cung cấp' }));
      return ws.close(1008, 'Unauthorized');
    }

    // Kiểm tra room tồn tại trong DB (sử dụng Promise)
    try {
      const [rows] = await new Promise((resolve, reject) => {
        db.query('SELECT room_id FROM chat_rooms WHERE room_id = ?', [roomId], (err, results) => {
          if (err) reject(err);
          else resolve([results]);
        });
      });
      if (rows.length === 0) {
        console.error(`Room ${roomId} not found`);
        ws.send(JSON.stringify({ action: 'error', message: 'Phòng chat không tồn tại' }));
        return ws.close(1008, 'Unauthorized');
      }
      console.log(`Room ${roomId} verified for user ${decoded.makh}`);
    } catch (dbError) {
      console.error('DB query error for room check:', dbError);
      ws.send(JSON.stringify({ action: 'error', message: 'Database error' }));
      return ws.close(1011, 'Internal Error');
    }

    // Gửi lịch sử tin nhắn khi tham gia phòng (sử dụng Promise)
    try {
      const [messages] = await new Promise((resolve, reject) => {
        db.query(
          'SELECT message_id, room_id, sender_id, sender_type, message, created_at FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC',
          [roomId],
          (err, results) => {
            if (err) reject(err);
            else resolve([results]);
          }
        );
      });
      console.log(`Sending chat history: ${messages.length} messages`);
      ws.send(JSON.stringify({ action: 'chat_history', messages }));
    } catch (historyError) {
      console.error('Error fetching chat history:', historyError);
      ws.send(JSON.stringify({ action: 'error', message: 'Lỗi khi lấy lịch sử tin nhắn' }));
    }

    // Xử lý tin nhắn từ client
    ws.on('message', async (message) => {
      try {
        const msgData = JSON.parse(message.toString());
        console.log('Received message:', msgData);

        // Kiểm tra dữ liệu tin nhắn
        if (!msgData.action || !msgData.room_id || !msgData.sender_id || !msgData.message) {
          throw new Error('Dữ liệu tin nhắn không hợp lệ');
        }

        if (msgData.action !== 'send_message') {
          console.log('Ignoring non-send_message action');
          return;
        }

        // Lưu tin nhắn vào database
        const [result] = await new Promise((resolve, reject) => {
          db.query(
            'INSERT INTO chat_messages (room_id, sender_id, sender_type, message) VALUES (?, ?, ?, ?)',
            [msgData.room_id, msgData.sender_id, msgData.sender_type || 'customer', msgData.message],
            (err, results) => {
              if (err) reject(err);
              else resolve([results]);
            }
          );
        });

        // Cập nhật thời gian phòng chat
        await new Promise((resolve, reject) => {
          db.query('UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP WHERE room_id = ?', [msgData.room_id], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Lấy tin nhắn đầy đủ từ database
        const [newMessage] = await new Promise((resolve, reject) => {
          db.query('SELECT * FROM chat_messages WHERE message_id = ?', [result.insertId], (err, results) => {
            if (err) reject(err);
            else resolve([results]);
          });
        });

        // Gửi tin nhắn đến tất cả client trong phòng
        const messagePayload = { action: 'new_message', message: newMessage[0] };
        let sentCount = 0;
        wss.clients.forEach((client) => {
          if (client.roomId === msgData.room_id && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(messagePayload));
            sentCount++;
          }
        });
        console.log(`Broadcasted message to ${sentCount} clients in room ${msgData.room_id}`);
      } catch (error) {
        console.error('Lỗi khi xử lý tin nhắn:', error);
        ws.send(JSON.stringify({ action: 'error', message: error.message || 'Lỗi khi xử lý tin nhắn' }));
      }
    });

    // Xử lý khi client đóng kết nối
    ws.on('close', () => {
      console.log(`Client disconnected: ${ws.user?.makh || 'unknown'} from room ${roomId}`);
    });

    // Xử lý lỗi
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
    });

    console.log(`Client connected successfully: ${decoded.makh} to room ${roomId}`);
  } catch (error) {
    console.error('Lỗi xác thực WebSocket:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'error', message: error.message || 'Unauthorized' }));
    }
    ws.close(1008, 'Unauthorized');
  }
});

// Xử lý lỗi server
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

console.log('WebSocket server running on ws://localhost:5001');