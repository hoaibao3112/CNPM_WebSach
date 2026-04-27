/**
 * Chat Controller - Thin controller, delegate to ChatService
 */
import ChatService from '../services/Chat.service.js';

class ChatController {
  async createOrGetRoom(req, res, next) {
    try {
      // Ưu tiên customer_id từ body (cho Admin), fallback về makh từ token (cho khách)
      const customerId = (req.user.userType === 'admin' ? req.body.customer_id : null) || req.user.makh;
      
      if (!customerId) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Missing Customer ID' });
      }

      const { room, isNew } = await ChatService.createOrGetRoom(customerId);
      return res.status(isNew ? 201 : 200).json({ success: true, room });
    } catch (error) { next(error); }
  }

  async getRooms(req, res, next) {
    try {
      const customerId = req.user.makh;
      if (!customerId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const rooms = await ChatService.getRoomsByCustomer(customerId);
      return res.status(200).json({ success: true, rooms });
    } catch (error) { next(error); }
  }

  async getMessages(req, res, next) {
    try {
      if (req.user.userType === 'admin') {
        const messages = await ChatService.getMessagesForAdmin(req.params.roomId);
        return res.status(200).json({ success: true, messages });
      }

      const messages = await ChatService.getMessages(req.params.roomId, req.user.makh);
      return res.status(200).json({ success: true, messages });
    } catch (error) { next(error); }
  }

  async sendMessage(req, res, next) {
    try {
      const { room_id, message } = req.body;
      
      if (req.user.userType === 'admin') {
        const msg = await ChatService.sendAdminMessage(room_id, req.user.userId || req.user.id, message);
        return res.status(201).json({ success: true, message: msg });
      }

      const msg = await ChatService.sendMessage(room_id, req.user.makh, message);
      return res.status(201).json({ success: true, message: msg });
    } catch (error) { next(error); }
  }

  async closeRoom(req, res, next) {
    try {
      await ChatService.closeRoom(req.params.roomId, req.user.makh);
      return res.status(200).json({ success: true, message: 'Đã đóng phòng chat' });
    } catch (error) { next(error); }
  }

  // ===== ADMIN =====

  async getUnreadCount(req, res, next) {
    try {
      const count = await ChatService.getUnreadCount();
      return res.status(200).json({ success: true, unread_count: count });
    } catch (error) { next(error); }
  }

  async getUnreadRooms(req, res, next) {
    try {
      const rooms = await ChatService.getUnreadRooms();
      return res.status(200).json({ success: true, unread_rooms: rooms });
    } catch (error) { next(error); }
  }

  async markRoomAsRead(req, res, next) {
    try {
      await ChatService.markRoomAsRead(req.params.roomId);
      return res.status(200).json({ success: true, message: 'Đã đánh dấu phòng là đã đọc' });
    } catch (error) { next(error); }
  }

  async getCustomerInfo(req, res, next) {
    try {
      const customer = await ChatService.getCustomerInfo(req.params.customerId);
      return res.status(200).json({ success: true, customer });
    } catch (error) { next(error); }
  }

  async getMessagesForAdmin(req, res, next) {
    try {
      const messages = await ChatService.getMessagesForAdmin(req.params.roomId);
      return res.status(200).json({ success: true, messages });
    } catch (error) { next(error); }
  }

  async sendAdminMessage(req, res, next) {
    try {
      const msg = await ChatService.sendAdminMessage(
        req.body.room_id,
        req.body.admin_id || req.user?.id,
        req.body.message
      );
      return res.status(201).json({ success: true, message: msg });
    } catch (error) { next(error); }
  }
}

export default new ChatController();
