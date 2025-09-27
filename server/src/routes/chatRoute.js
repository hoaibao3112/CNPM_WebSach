import express from 'express';
import db from '../config/connectDatabase.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware xác thực
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
    console.log('🔑 Decoded token:', decoded);

    let user;
    
    // Xác định user type và lấy thông tin user
    if (decoded.userType === 'staff' || decoded.MaTK || decoded.TenTK) {
      // Staff/Admin
      const queryParam = decoded.MaTK || decoded.TenTK;
      [user] = await db.query('SELECT * FROM taikhoan WHERE MaTK = ? OR TenTK = ?', [queryParam, queryParam]);
      if (user && user.length > 0) {
        req.user = { 
          ...user[0], 
          userType: 'staff',
          manv: user[0].MaTK || user[0].TenTK
        };
      } else {
        return res.status(401).json({ error: 'Staff not found' });
      }
    } else if (decoded.userType === 'customer' || decoded.makh) {
      // Customer
      const queryParam = decoded.makh;
      [user] = await db.query('SELECT * FROM khachhang WHERE makh = ?', [queryParam]);
      if (user && user.length > 0) {
        req.user = { 
          ...user[0], 
          userType: 'customer'
        };
      } else {
        return res.status(401).json({ error: 'Customer not found' });
      }
    } else {
      console.log('❌ Invalid user type or payload:', decoded);
      return res.status(401).json({ error: 'Invalid user type or payload' });
    }

    console.log('✅ Authenticated user:', { 
      userType: req.user.userType, 
      id: req.user.makh || req.user.manv 
    });
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// 1. Tạo hoặc lấy phòng chat
router.post('/rooms', authenticate, async (req, res) => {
  try {
    let customer_id = req.body.customer_id;
    
    // Nếu là customer đăng nhập, lấy makh từ token
    if (req.user.userType === 'customer') {
      customer_id = req.user.makh;
    }
    
    if (!customer_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'customer_id is required' 
      });
    }

    console.log(`🏠 Creating/Getting room for customer: ${customer_id}`);

    // Kiểm tra customer có tồn tại không
    const [customer] = await db.query('SELECT makh, tenkh FROM khachhang WHERE makh = ?', [customer_id]);
    if (customer.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

    // Kiểm tra đã có phòng chat nào chưa
    const [existingRooms] = await db.query(`
      SELECT room_id, customer_id, created_at, updated_at 
      FROM chat_rooms 
      WHERE customer_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [customer_id]);

    let room;
    if (existingRooms.length > 0) {
      // Sử dụng phòng hiện có
      room = existingRooms[0];
      console.log('✅ Using existing room:', room.room_id);
    } else {
      // Tạo phòng mới
      const [result] = await db.query(`
        INSERT INTO chat_rooms (customer_id, created_at, updated_at) 
        VALUES (?, NOW(), NOW())
      `, [customer_id]);

      room = {
        room_id: result.insertId,
        customer_id: customer_id,
        created_at: new Date(),
        updated_at: new Date()
      };
      console.log('✅ Created new room:', room.room_id);
    }

    res.json({ 
      success: true, 
      room: room
    });
  } catch (error) {
    console.error('❌ Create room error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while creating room'
    });
  }
});

// 2. Lấy danh sách phòng chat
router.get('/rooms', authenticate, async (req, res) => {
  try {
    let query, params;

    if (req.user.userType === 'staff') {
      // Staff - lấy tất cả phòng có tin nhắn
      query = `
        SELECT 
          cr.room_id,
          cr.customer_id,
          cr.created_at,
          cr.updated_at,
          kh.tenkh as customer_name,
          kh.email as customer_email,
          COUNT(cm.message_id) as message_count,
          MAX(cm.created_at) as last_message_time,
          (SELECT message FROM chat_messages WHERE room_id = cr.room_id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM chat_rooms cr
        LEFT JOIN khachhang kh ON cr.customer_id = kh.makh
        LEFT JOIN chat_messages cm ON cr.room_id = cm.room_id
        GROUP BY cr.room_id, cr.customer_id, cr.created_at, cr.updated_at, kh.tenkh, kh.email
        HAVING message_count > 0
        ORDER BY last_message_time DESC
      `;
      params = [];
    } else {
      // Customer - chỉ lấy phòng của mình
      query = `
        SELECT 
          cr.room_id,
          cr.customer_id,
          cr.created_at,
          cr.updated_at,
          COUNT(cm.message_id) as message_count
        FROM chat_rooms cr
        LEFT JOIN chat_messages cm ON cr.room_id = cm.room_id
        WHERE cr.customer_id = ?
        GROUP BY cr.room_id, cr.customer_id, cr.created_at, cr.updated_at
        ORDER BY cr.updated_at DESC
      `;
      params = [req.user.makh];
    }

    const [rooms] = await db.query(query, params);
    console.log(`📋 Found ${rooms.length} rooms for ${req.user.userType}`);

    res.json({ 
      success: true, 
      rooms: rooms || []
    });
  } catch (error) {
    console.error('❌ Get rooms error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching rooms' 
    });
  }
});

// 3. Lấy chi tiết phòng chat
router.get('/rooms/:room_id', authenticate, async (req, res) => {
  try {
    const { room_id } = req.params;

    // Kiểm tra quyền truy cập phòng
    let accessQuery, accessParams;
    if (req.user.userType === 'staff') {
      accessQuery = 'SELECT * FROM chat_rooms WHERE room_id = ?';
      accessParams = [room_id];
    } else {
      accessQuery = 'SELECT * FROM chat_rooms WHERE room_id = ? AND customer_id = ?';
      accessParams = [room_id, req.user.makh];
    }

    const [room] = await db.query(accessQuery, accessParams);
    if (room.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Room not found or access denied' 
      });
    }

    res.json({
      success: true,
      room: room[0]
    });
  } catch (error) {
    console.error('❌ Get room error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching room' 
    });
  }
});

// 4. Gửi tin nhắn
router.post('/messages', authenticate, async (req, res) => {
  try {
    const { room_id, message } = req.body;

    if (!room_id || !message?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'room_id and message are required' 
      });
    }

    // Xác định sender_type và sender_id
    let sender_type, sender_id;
    if (req.user.userType === 'customer') {
      sender_type = 'customer';
      sender_id = req.user.makh;
    } else if (req.user.userType === 'staff') {
      sender_type = 'staff';
      sender_id = req.user.manv || req.user.MaTK || req.user.TenTK;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user type' 
      });
    }

    console.log(`📤 Sending message:`, { 
      room_id, 
      sender_type, 
      sender_id, 
      message: message.substring(0, 50) + '...' 
    });

    // Kiểm tra quyền truy cập phòng
    let accessQuery, accessParams;
    if (req.user.userType === 'staff') {
      accessQuery = 'SELECT * FROM chat_rooms WHERE room_id = ?';
      accessParams = [room_id];
    } else {
      accessQuery = 'SELECT * FROM chat_rooms WHERE room_id = ? AND customer_id = ?';
      accessParams = [room_id, req.user.makh];
    }

    const [roomCheck] = await db.query(accessQuery, accessParams);
    if (roomCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Room not found or access denied' 
      });
    }

    // Lưu tin nhắn
    const [result] = await db.query(`
      INSERT INTO chat_messages (room_id, sender_id, sender_type, message, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `, [room_id, sender_id, sender_type, message.trim()]);

    // Cập nhật thời gian phòng chat
    await db.query(`
      UPDATE chat_rooms SET updated_at = NOW() WHERE room_id = ?
    `, [room_id]);

    console.log('✅ Message saved with ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: {
        id: result.insertId,
        room_id,
        sender_id,
        sender_type,
        message: message.trim(),
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while sending message' 
    });
  }
});

// 5. Lấy tin nhắn trong phòng
router.get('/rooms/:room_id/messages', authenticate, async (req, res) => {
  try {
    const { room_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Kiểm tra quyền truy cập phòng
    let accessQuery, accessParams;
    if (req.user.userType === 'staff') {
      accessQuery = 'SELECT * FROM chat_rooms WHERE room_id = ?';
      accessParams = [room_id];
    } else {
      accessQuery = 'SELECT * FROM chat_rooms WHERE room_id = ? AND customer_id = ?';
      accessParams = [room_id, req.user.makh];
    }

    const [roomCheck] = await db.query(accessQuery, accessParams);
    if (roomCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Room not found or access denied' 
      });
    }

    // Lấy tin nhắn
    const [messages] = await db.query(`
      SELECT 
        cm.message_id as id,
        cm.message,
        cm.sender_type,
        cm.sender_id,
        cm.created_at,
        CASE 
          WHEN cm.sender_type = 'customer' THEN kh.tenkh
          WHEN cm.sender_type = 'staff' THEN COALESCE(tk.TenTK, 'Admin')
          ELSE 'Unknown'
        END as sender_name
      FROM chat_messages cm
      LEFT JOIN khachhang kh ON cm.sender_type = 'customer' AND cm.sender_id = kh.makh
      LEFT JOIN taikhoan tk ON cm.sender_type = 'staff' AND (cm.sender_id = tk.MaTK OR cm.sender_id = tk.TenTK)
      WHERE cm.room_id = ? 
      ORDER BY cm.created_at ASC
      LIMIT ? OFFSET ?
    `, [room_id, parseInt(limit), parseInt(offset)]);

    console.log(`📨 Fetched ${messages.length} messages for room ${room_id}`);

    res.json({
      success: true,
      messages: messages || [],
      count: messages.length
    });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching messages' 
    });
  }
});

// 6. Xóa tin nhắn (chỉ người gửi hoặc admin)
router.delete('/messages/:message_id', authenticate, async (req, res) => {
  try {
    const { message_id } = req.params;

    // Lấy thông tin tin nhắn
    const [message] = await db.query(`
      SELECT * FROM chat_messages WHERE message_id = ?
    `, [message_id]);

    if (message.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Message not found' 
      });
    }

    const msg = message[0];

    // Kiểm tra quyền xóa
    const canDelete = 
      req.user.userType === 'staff' || 
      (req.user.userType === 'customer' && msg.sender_type === 'customer' && msg.sender_id == req.user.makh);

    if (!canDelete) {
      return res.status(403).json({ 
        success: false,
        error: 'Permission denied' 
      });
    }

    // Xóa tin nhắn
    await db.query('DELETE FROM chat_messages WHERE message_id = ?', [message_id]);

    console.log('🗑️ Message deleted:', message_id);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while deleting message' 
    });
  }
});

// 7. Đánh dấu tin nhắn đã đọc
router.patch('/rooms/:room_id/read', authenticate, async (req, res) => {
  try {
    const { room_id } = req.params;

    // Kiểm tra quyền truy cập phòng
    let accessQuery, accessParams;
    if (req.user.userType === 'staff') {
      accessQuery = 'SELECT * FROM chat_rooms WHERE room_id = ?';
      accessParams = [room_id];
    } else {
      accessQuery = 'SELECT * FROM chat_rooms WHERE room_id = ? AND customer_id = ?';
      accessParams = [room_id, req.user.makh];
    }

    const [roomCheck] = await db.query(accessQuery, accessParams);
    if (roomCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Room not found or access denied' 
      });
    }

    // Cập nhật trạng thái đã đọc (nếu có cột is_read)
    // await db.query(`
    //   UPDATE chat_messages 
    //   SET is_read = 1 
    //   WHERE room_id = ? AND sender_type != ?
    // `, [room_id, req.user.userType]);

    console.log('✅ Messages marked as read for room:', room_id);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('❌ Mark read error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while marking messages as read' 
    });
  }
});

export default router;