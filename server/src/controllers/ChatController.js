import pool from '../config/connectDatabase.js';
import crypto from 'crypto';

class ChatController {
    // ===== CREATE/GET CHAT ROOM =====
    async createOrGetRoom(req, res) {
        try {
            const customerId = req.user.makh;

            if (!customerId) {
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized'
                });
            }

            // Check for existing active room
            const [existingRooms] = await pool.query(
                `SELECT * FROM chat_rooms 
                 WHERE customer_id = ? AND status = 'active' 
                 ORDER BY updated_at DESC LIMIT 1`,
                [customerId]
            );

            if (existingRooms.length > 0) {
                console.log('✅ Found existing room:', existingRooms[0].room_id);
                return res.status(200).json({
                    success: true,
                    room: existingRooms[0]
                });
            }

            // Create new room
            const roomId = `room_${customerId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

            await pool.query(
                `INSERT INTO chat_rooms (room_id, customer_id, status, created_at, updated_at) 
                 VALUES (?, ?, 'active', NOW(), NOW())`,
                [roomId, customerId]
            );

            const [newRoom] = await pool.query(
                'SELECT * FROM chat_rooms WHERE room_id = ?',
                [roomId]
            );

            console.log('✅ Created new room:', roomId);

            return res.status(201).json({
                success: true,
                room: newRoom[0]
            });

        } catch (error) {
            console.error('❌ Create room error:', error);
            return res.status(500).json({
                success: false,
                error: 'Không thể tạo phòng chat',
                details: error.message
            });
        }
    }

    // ===== GET ALL ROOMS (FOR CUSTOMER) =====
    async getRooms(req, res) {
        try {
            const customerId = req.user.makh;

            if (!customerId) {
                return res.status(401).json({
                    success: false,
                    error: 'Unauthorized'
                });
            }

            const [rooms] = await pool.query(
                `SELECT * FROM chat_rooms 
                 WHERE customer_id = ? 
                 ORDER BY updated_at DESC`,
                [customerId]
            );

            return res.status(200).json({
                success: true,
                rooms
            });

        } catch (error) {
            console.error('❌ Get rooms error:', error);
            return res.status(500).json({
                success: false,
                error: 'Không thể lấy danh sách phòng chat'
            });
        }
    }

    // ===== GET MESSAGES FOR A ROOM =====
    async getMessages(req, res) {
        try {
            const { roomId } = req.params;
            const customerId = req.user.makh;

            // Verify customer owns this room
            const [room] = await pool.query(
                'SELECT * FROM chat_rooms WHERE room_id = ? AND customer_id = ?',
                [roomId, customerId]
            );

            if (room.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Phòng chat không tồn tại hoặc không thuộc về bạn'
                });
            }

            // Get messages (limit 100, ordered by created_at)
            const [messages] = await pool.query(
                `SELECT message_id as id, room_id, sender_id, sender_type, message, created_at
                 FROM chat_messages 
                 WHERE room_id = ? 
                 ORDER BY created_at ASC 
                 LIMIT 100`,
                [roomId]
            );

            return res.status(200).json({
                success: true,
                messages
            });

        } catch (error) {
            console.error('❌ Get messages error:', error);
            return res.status(500).json({
                success: false,
                error: 'Không thể lấy tin nhắn'
            });
        }
    }

    // ===== SEND MESSAGE =====
    async sendMessage(req, res) {
        try {
            const { room_id, message } = req.body;
            const customerId = req.user.makh;

            if (!room_id || !message) {
                return res.status(400).json({
                    success: false,
                    error: 'Thiếu room_id hoặc message'
                });
            }

            // Verify customer owns this room
            const [room] = await pool.query(
                'SELECT * FROM chat_rooms WHERE room_id = ? AND customer_id = ?',
                [room_id, customerId]
            );

            if (room.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Phòng chat không tồn tại'
                });
            }

            // Insert message
            const [result] = await pool.query(
                `INSERT INTO chat_messages (room_id, sender_id, sender_type, message, created_at) 
                 VALUES (?, ?, 'customer', ?, NOW())`,
                [room_id, customerId, message]
            );

            // Update room timestamp
            await pool.query(
                'UPDATE chat_rooms SET updated_at = NOW() WHERE room_id = ?',
                [room_id]
            );

            // Get the new message
            const [newMessage] = await pool.query(
                'SELECT message_id as id, room_id, sender_id, sender_type, message, created_at FROM chat_messages WHERE message_id = ?',
                [result.insertId]
            );

            return res.status(201).json({
                success: true,
                message: newMessage[0]
            });

        } catch (error) {
            console.error('❌ Send message error:', error);
            return res.status(500).json({
                success: false,
                error: 'Không thể gửi tin nhắn'
            });
        }
    }

    // ===== CLOSE ROOM =====
    async closeRoom(req, res) {
        try {
            const { roomId } = req.params;
            const customerId = req.user.makh;

            // Verify customer owns this room
            const [room] = await pool.query(
                'SELECT * FROM chat_rooms WHERE room_id = ? AND customer_id = ?',
                [roomId, customerId]
            );

            if (room.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Phòng chat không tồn tại'
                });
            }

            // Close room
            await pool.query(
                "UPDATE chat_rooms SET status = 'closed', updated_at = NOW() WHERE room_id = ?",
                [roomId]
            );

            return res.status(200).json({
                success: true,
                message: 'Đã đóng phòng chat'
            });

        } catch (error) {
            console.error('❌ Close room error:', error);
            return res.status(500).json({
                success: false,
                error: 'Không thể đóng phòng chat'
            });
        }
    }

    // ===== ADMIN ENDPOINTS =====

    // Get total unread message count for admin
    async getUnreadCount(req, res) {
        try {
            // Count rooms that have been updated since admin last read them
            const [result] = await pool.query(`
                SELECT COUNT(*) as unread_count
                FROM chat_rooms
                WHERE status = 'active' 
                AND (admin_read_at IS NULL OR updated_at > admin_read_at)
            `);

            return res.status(200).json({
                success: true,
                unread_count: result[0].unread_count
            });

        } catch (error) {
            console.error('❌ Get unread count error:', error);
            return res.status(500).json({
                success: false,
                error: 'Không thể lấy số lượng tin nhắn chưa đọc'
            });
        }
    }

    // Get list of rooms with unread messages
    async getUnreadRooms(req, res) {
        try {
            const [rooms] = await pool.query(`
                SELECT 
                    cr.room_id,
                    cr.customer_id,
                    kh.tenkh as customer_name,
                    (SELECT message FROM chat_messages WHERE room_id = cr.room_id ORDER BY created_at DESC LIMIT 1) as last_message,
                    (SELECT created_at FROM chat_messages WHERE room_id = cr.room_id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                    (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.room_id AND created_at > COALESCE(cr.admin_read_at, '1970-01-01')) as unread_count
                FROM chat_rooms cr
                LEFT JOIN khachhang kh ON cr.customer_id = kh.makh
                WHERE cr.status = 'active'
                AND (cr.admin_read_at IS NULL OR cr.updated_at > cr.admin_read_at)
                ORDER BY cr.updated_at DESC
            `);

            return res.status(200).json({
                success: true,
                unread_rooms: rooms
            });

        } catch (error) {
            console.error('❌ Get unread rooms error:', error);
            return res.status(500).json({
                success: false,
                error: 'Không thể lấy danh sách phòng chưa đọc'
            });
        }
    }

    // Mark a room as read by admin
    async markRoomAsRead(req, res) {
        try {
            const { roomId } = req.params;

            await pool.query(
                'UPDATE chat_rooms SET admin_read_at = NOW() WHERE room_id = ?',
                [roomId]
            );

            return res.status(200).json({
                success: true,
                message: 'Đã đánh dấu phòng là đã đọc'
            });

        } catch (error) {
            console.error('❌ Mark room as read error:', error);
            return res.status(500).json({
                success: false,
                error: 'Không thể đánh dấu phòng là đã đọc'
            });
        }
    }

    // Get customer info for chat
    async getCustomerInfo(req, res) {
        try {
            const { customerId } = req.params;

            const [customers] = await pool.query(
                'SELECT makh, tenkh, sdt, email FROM khachhang WHERE makh = ?',
                [customerId]
            );

            if (customers.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy khách hàng'
                });
            }

            return res.status(200).json({
                success: true,
                customer: customers[0]
            });

        } catch (error) {
            console.error('❌ Get customer info error:', error);
            return res.status(500).json({
                success: false,
                error: 'Không thể lấy thông tin khách hàng'
            });
        }
    }

    // Get messages for admin (no ownership check)
    async getMessagesForAdmin(req, res) {
        try {
            const { roomId } = req.params;

            // Verify room exists
            const [room] = await pool.query(
                'SELECT * FROM chat_rooms WHERE room_id = ?',
                [roomId]
            );

            if (room.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Phòng chat không tồn tại'
                });
            }

            // Get messages
            const [messages] = await pool.query(
                `SELECT message_id as id, room_id, sender_id, sender_type, message, created_at
                 FROM chat_messages 
                 WHERE room_id = ? 
                 ORDER BY created_at ASC 
                 LIMIT 200`,
                [roomId]
            );

            return res.status(200).json({
                success: true,
                messages
            });

        } catch (error) {
            console.error('❌ Get messages for admin error:', error);
            return res.status(500).json({
                success: false,
                error: 'Không thể lấy tin nhắn'
            });
        }
    }

    // Admin send message
    async sendAdminMessage(req, res) {
        try {
            const { room_id, message, admin_id } = req.body;

            if (!room_id || !message) {
                return res.status(400).json({
                    success: false,
                    error: 'Thiếu room_id hoặc message'
                });
            }

            // Verify room exists
            const [room] = await pool.query(
                'SELECT * FROM chat_rooms WHERE room_id = ?',
                [room_id]
            );

            if (room.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Phòng chat không tồn tại'
                });
            }

            // Use admin_id if provided, otherwise use a default admin identifier
            const senderId = admin_id || req.user?.id || 'admin';

            // Insert message
            const [result] = await pool.query(
                `INSERT INTO chat_messages (room_id, sender_id, sender_type, message, created_at) 
                 VALUES (?, ?, 'admin', ?, NOW())`,
                [room_id, senderId, message]
            );

            // Update room timestamp
            await pool.query(
                'UPDATE chat_rooms SET updated_at = NOW() WHERE room_id = ?',
                [room_id]
            );

            // Get the new message
            const [newMessage] = await pool.query(
                'SELECT message_id as id, room_id, sender_id, sender_type, message, created_at FROM chat_messages WHERE message_id = ?',
                [result.insertId]
            );

            return res.status(201).json({
                success: true,
                message: newMessage[0]
            });

        } catch (error) {
            console.error('❌ Send admin message error:', error);
            return res.status(500).json({
                success: false,
                error: 'Không thể gửi tin nhắn'
            });
        }
    }
}

export default new ChatController();
