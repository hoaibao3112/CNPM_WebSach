import express from 'express';
import ChatController from '../controllers/ChatController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// ===== CHAT ROOM MANAGEMENT =====
// Create or get active chat room for current customer
router.post('/rooms', authenticateToken, ChatController.createOrGetRoom);

// Get all rooms for current customer
router.get('/rooms', authenticateToken, ChatController.getRooms);

// Get messages for a specific room
router.get('/rooms/:roomId/messages', authenticateToken, ChatController.getMessages);

// Close a chat room
router.put('/rooms/:roomId/close', authenticateToken, ChatController.closeRoom);


// ===== MESSAGING =====
// Send a message to a room
router.post('/messages', authenticateToken, ChatController.sendMessage);

// ===== ADMIN ENDPOINTS =====
// Get unread message count for admin
router.get('/admin/unread-count', authenticateToken, ChatController.getUnreadCount);

// Get list of rooms with unread messages
router.get('/admin/unread-rooms', authenticateToken, ChatController.getUnreadRooms);

// Mark room as read by admin
router.patch('/admin/mark-read/:roomId', authenticateToken, ChatController.markRoomAsRead);

// Get customer info
router.get('/customer/:customerId', authenticateToken, ChatController.getCustomerInfo);

// Get messages for admin (no ownership check)
router.get('/room/:roomId/messages', authenticateToken, ChatController.getMessagesForAdmin);

// Admin send message
router.post('/admin/send', authenticateToken, ChatController.sendAdminMessage);

export default router;
