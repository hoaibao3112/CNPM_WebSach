const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const db = require('../config/connectDatabase');

const wss = new WebSocket.Server({ port: 5001 });

wss.on('connection', (ws, req) => {
  try {
    // Lấy token và roomId từ query string
    const url = new URL(req.url, `ws://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const roomId = url.searchParams.get('room_id');

    // Kiểm tra token
    if (!token) {
      throw new Error('Token không tồn tại');
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    ws.user = decoded; // Lưu thông tin người dùng
    ws.roomId = roomId; // Lưu roomId

    // Kiểm tra roomId hợp lệ
    if (roomId) {
      db.query('SELECT room_id FROM chat_rooms WHERE room_id = ?', [roomId])
        .then(([rows]) => {
          if (rows.length === 0) {
            throw new Error('Phòng chat không tồn tại');
          }
        })
        .catch((error) => {
          throw error;
        });
    } else {
      throw new Error('RoomId không được cung cấp');
    }

    // Gửi lịch sử tin nhắn khi tham gia phòng
    db.query(
      'SELECT message_id, room_id, sender_id, sender_type, message, created_at FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC',
      [roomId]
    )
      .then(([messages]) => {
        ws.send(
          JSON.stringify({
            action: 'chat_history',
            messages: messages,
          })
        );
      })
      .catch((error) => {
        console.error('Lỗi khi lấy lịch sử tin nhắn:', error);
      });

    // Xử lý tin nhắn từ client
    ws.on('message', async (message) => {
      try {
        const msgData = JSON.parse(message);

        // Kiểm tra dữ liệu tin nhắn
        if (!msgData.action || !msgData.room_id || !msgData.sender_id || !msgData.message) {
          throw new Error('Dữ liệu tin nhắn không hợp lệ');
        }

        if (msgData.action !== 'send_message') {
          return; // Bỏ qua nếu action không phải gửi tin nhắn
        }

        // Lưu tin nhắn vào database
        const [result] = await db.query(
          'INSERT INTO chat_messages (room_id, sender_id, sender_type, message) VALUES (?, ?, ?, ?)',
          [msgData.room_id, msgData.sender_id, msgData.sender_type || 'customer', msgData.message]
        );

        // Cập nhật thời gian phòng chat
        await db.query('UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP WHERE room_id = ?', [
          msgData.room_id,
        ]);

        // Lấy tin nhắn đầy đủ từ database
        const [newMessage] = await db.query('SELECT * FROM chat_messages WHERE message_id = ?', [
          result.insertId,
        ]);

        // Gửi tin nhắn đến tất cả client trong phòng
        const messagePayload = {
          action: 'new_message',
          message: newMessage[0],
        };

        wss.clients.forEach((client) => {
          if (
            client.roomId === msgData.room_id &&
            client.readyState === WebSocket.OPEN
          ) {
            client.send(JSON.stringify(messagePayload));
          }
        });
      } catch (error) {
        console.error('Lỗi khi xử lý tin nhắn:', error);
        ws.send(
          JSON.stringify({
            action: 'error',
            message: 'Lỗi khi xử lý tin nhắn',
          })
        );
      }
    });

    // Xử lý khi client đóng kết nối
    ws.on('close', () => {
      console.log(`Client disconnected: ${ws.user?.makh || 'unknown'}`);
    });

    // Xử lý lỗi
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    console.log(`Client connected: ${ws.user.makh} to room ${roomId}`);
  } catch (error) {
    console.error('Lỗi xác thực WebSocket:', error);
    ws.close(1008, 'Unauthorized');
  }
});

// Xử lý lỗi server
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

console.log('WebSocket server running on ws://localhost:5001');