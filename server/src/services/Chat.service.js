/**
 * Chat Service - Business logic cho chat rooms & messages
 * Sử dụng Sequelize ORM
 */
import { ChatRoom, ChatMessage, KhachHang, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

class ChatService {
  /**
   * Tạo hoặc lấy phòng chat hiện có của khách hàng
   */
  async createOrGetRoom(customerId) {
    // Check existing active room
    const existingRoom = await ChatRoom.findOne({
      where: { customer_id: customerId, status: 'active' },
      order: [['updated_at', 'DESC']]
    });

    if (existingRoom) {
      logger.debug(`Found existing room: ${existingRoom.room_id}`);
      return { room: existingRoom, isNew: false };
    }

    // Create new room
    const room = await ChatRoom.create({
      customer_id: customerId,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });

    logger.info(`Created new room: ${room.room_id}`);
    return { room, isNew: true };
  }

  /**
   * Lấy danh sách phòng chat của khách hàng
   */
  async getRoomsByCustomer(customerId) {
    return ChatRoom.findAll({
      where: { customer_id: customerId },
      order: [['updated_at', 'DESC']]
    });
  }

  /**
   * Lấy tin nhắn của một phòng (customer side - verify ownership)
   */
  async getMessages(roomId, customerId) {
    const room = await ChatRoom.findOne({
      where: { room_id: roomId, customer_id: customerId }
    });
    if (!room) throw new AppError('Phòng chat không tồn tại hoặc không thuộc về bạn', 404);

    return ChatMessage.findAll({
      where: { room_id: roomId },
      attributes: [['message_id', 'id'], 'room_id', 'sender_id', 'sender_type', 'message', 'created_at'],
      order: [['created_at', 'ASC']],
      limit: 100
    });
  }

  // ===== WEBSOCKET INTEGRATION =====
  static wss = null;
  static wsRooms = null;

  setWss(wss, rooms) {
    this.wss = wss;
    this.wsRooms = rooms;
  }

  async broadcastToRoom(roomId, messageData) {
    if (!this.wsRooms || !this.wsRooms.has(String(roomId))) return;

    const payload = JSON.stringify({ action: 'new_message', message: messageData });
    this.wsRooms.get(String(roomId)).forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(payload);
      }
    });
  }

  /**
   * Gửi tin nhắn (customer)
   */
  async sendMessage(roomId, customerId, messageText) {
    if (!roomId || !messageText) throw new AppError('Thiếu room_id hoặc message', 400);

    const room = await ChatRoom.findOne({
      where: { room_id: roomId, customer_id: customerId }
    });
    if (!room) throw new AppError('Phòng chat không tồn tại', 404);

    const newMsg = await ChatMessage.create({
      room_id: roomId,
      sender_id: customerId,
      sender_type: 'customer',
      message: messageText,
      created_at: new Date()
    });

    await room.update({ updated_at: new Date() });

    const msgData = {
      id: newMsg.message_id,
      room_id: newMsg.room_id,
      sender_id: newMsg.sender_id,
      sender_type: newMsg.sender_type,
      message: newMsg.message,
      created_at: newMsg.created_at
    };

    // Broadcast real-time if WS is available
    this.broadcastToRoom(roomId, msgData);

    return msgData;
  }

  /**
   * Admin gửi tin nhắn
   */
  async sendAdminMessage(roomId, adminId, messageText) {
    if (!roomId || !messageText) throw new AppError('Thiếu room_id hoặc message', 400);

    const room = await ChatRoom.findByPk(roomId);
    if (!room) throw new AppError('Phòng chat không tồn tại', 404);

    const senderId = adminId || 'admin';

    const newMsg = await ChatMessage.create({
      room_id: roomId,
      sender_id: senderId,
      sender_type: 'staff',
      message: messageText,
      created_at: new Date()
    });

    await room.update({ updated_at: new Date() });

    const msgData = {
      id: newMsg.message_id,
      room_id: newMsg.room_id,
      sender_id: newMsg.sender_id,
      sender_type: newMsg.sender_type,
      message: newMsg.message,
      created_at: newMsg.created_at
    };

    // Broadcast real-time if WS is available
    this.broadcastToRoom(roomId, msgData);

    return msgData;
  }

  /**
   * Đóng phòng chat
   */
  async closeRoom(roomId, customerId) {
    const room = await ChatRoom.findOne({
      where: { room_id: roomId, customer_id: customerId }
    });
    if (!room) throw new AppError('Phòng chat không tồn tại', 404);

    await room.update({ status: 'closed', updated_at: new Date() });
    return true;
  }

  // ===== ADMIN METHODS =====

  /**
   * Đếm phòng có tin nhắn chưa đọc (admin)
   */
  async getUnreadCount() {
    const count = await ChatRoom.count({
      where: {
        status: 'active',
        [Op.or]: [
          { admin_read_at: null },
          sequelize.where(
            sequelize.col('updated_at'),
            Op.gt,
            sequelize.col('admin_read_at')
          )
        ]
      }
    });
    return count;
  }

  /**
   * Lấy danh sách phòng có tin nhắn chưa đọc (admin)
   * NOTE: Giữ raw query cho subqueries phức tạp
   */
  async getUnreadRooms() {
    const pool = (await import('../config/connectDatabase.js')).default;
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
    return rooms;
  }

  /**
   * Lấy tất cả phòng chat (admin) - Dùng cho tìm kiếm toàn diện
   */
  async getAllRooms() {
    const pool = (await import('../config/connectDatabase.js')).default;
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
      ORDER BY cr.updated_at DESC
      LIMIT 100
    `);
    return rooms;
  }

  /**
   * Đánh dấu phòng đã đọc (admin)
   */
  async markRoomAsRead(roomId) {
    await ChatRoom.update(
      { admin_read_at: new Date() },
      { where: { room_id: roomId } }
    );
    return true;
  }

  /**
   * Lấy thông tin khách hàng cho chat
   */
  async getCustomerInfo(customerId) {
    const customer = await KhachHang.findByPk(customerId, {
      attributes: ['makh', 'tenkh', 'sdt', 'email']
    });
    if (!customer) throw new AppError('Không tìm thấy khách hàng', 404);
    return customer;
  }

  /**
   * Lấy tin nhắn cho admin (không kiểm tra ownership)
   */
  async getMessagesForAdmin(roomId) {
    const room = await ChatRoom.findByPk(roomId);
    if (!room) throw new AppError('Phòng chat không tồn tại', 404);

    return ChatMessage.findAll({
      where: { room_id: roomId },
      attributes: [['message_id', 'id'], 'room_id', 'sender_id', 'sender_type', 'message', 'created_at'],
      order: [['created_at', 'ASC']],
      limit: 200
    });
  }
}

export default new ChatService();
