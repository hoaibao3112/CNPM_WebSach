import express from 'express';
import db from '../config/connectDatabase.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const authenticate = async (req, res, next) => {
    try {
        console.log('Headers:', req.headers); // Log toàn bộ headers
        console.log('Authorization header:', req.headers.authorization);
        
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log('No authorization header');
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ error: 'No token provided' });
        }

        console.log('Token:', token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key'); // Thêm 
        console.log('Decoded token:', decoded);
        
        let user;
        if (decoded.userType === 'customer') {
            console.log('Querying customer with ID:', decoded.userId);
            [user] = await db.query('SELECT * FROM khachhang WHERE makh = ?', [decoded.userId]);
        } else if (decoded.userType === 'staff') {
            console.log('Querying staff with username:', decoded.userId);
[user] = await db.query('SELECT * FROM taikhoan WHERE TenTK = ?', [decoded.userId]);
        } else {
            console.log('Invalid user type:', decoded.userType);
            return res.status(401).json({ error: 'Invalid user type' });
        }

        console.log('User found:', user);
        if (!user || !user.length) {
            console.log('User not found in database');
            return res.status(401).json({ error: 'User not found' });
        }
        
        req.user = user[0];
        req.user.userType = decoded.userType;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// Tạo hoặc lấy phòng chat
router.post('/rooms', authenticate, async (req, res) => {
    try {
        const { customer_id } = req.body;
        
        // Tạo phòng chat mới
        const [result] = await db.query(
            `INSERT INTO chat_rooms 
             (customer_id) 
             VALUES (?)`,
            [customer_id]
        );

        const [newRoom] = await db.query(
            'SELECT * FROM chat_rooms WHERE room_id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            room: newRoom[0]
        });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// Lấy thông tin phòng chat
router.get('/rooms/:room_id', authenticate, async (req, res) => {
    try {
        const { room_id } = req.params;

        const [room] = await db.query(
            `SELECT * FROM chat_rooms 
             WHERE room_id = ?`,
            [room_id]
        );

        if (!room.length) {
            return res.status(404).json({ 
                success: false,
                error: 'Room not found' 
            });
        }

        res.json({
            success: true,
            room: room[0]
        });
    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});
router.post('/messages', authenticate, async (req, res) => {
    try {
        const { room_id, message } = req.body;
        const sender_type = req.user.userType; // 'customer' hoặc 'staff'
        const sender_id = req.user.userType === 'staff' ? req.user.TenTK : req.user.makh;

        // Insert message
        const [result] = await db.query(
            `INSERT INTO chat_messages 
             (room_id, sender_id, sender_type, message) 
             VALUES (?, ?, ?, ?)`,
            [room_id, sender_id, sender_type, message]
        );

        // Update room timestamp
        await db.query(
            `UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP 
             WHERE room_id = ?`,
            [room_id]
        );

        res.status(201).json({
            success: true,
            message: {
                message_id: result.insertId,
                room_id,
                sender_id,
                sender_type,
                message,
                created_at: new Date()
            }
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

// Lấy tin nhắn
router.get('/rooms/:room_id/messages', authenticate, async (req, res) => {
    try {
        const { room_id } = req.params;

        const [messages] = await db.query(
            `SELECT * FROM chat_messages 
             WHERE room_id = ? 
             ORDER BY created_at ASC`,
            [room_id]
        );

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

router.get('/rooms', authenticate, async (req, res) => {
    try {
        let query = '';
        let params = [];

        if (req.user.userType === 'staff') {
            query = `
                SELECT cr.*, 
                       COUNT(cm.message_id) AS message_count
                FROM chat_rooms cr
                LEFT JOIN chat_messages cm ON cr.room_id = cm.room_id
                GROUP BY cr.room_id
                ORDER BY cr.updated_at DESC
            `;
        } else {
            // Khách hàng chỉ xem phòng của mình
            query = `
                SELECT cr.*, 
                       COUNT(cm.message_id) AS message_count
                FROM chat_rooms cr
                LEFT JOIN chat_messages cm ON cr.room_id = cm.room_id
                WHERE cr.customer_id = ?
                GROUP BY cr.room_id
                ORDER BY cr.updated_at DESC
            `;
            params = [req.user.makh];
        }

        const [rooms] = await db.query(query, params);
        res.json({
            success: true,
            rooms
        });
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error' 
        });
    }
});

export default router;