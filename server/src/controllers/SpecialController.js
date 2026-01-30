import SpecialService from '../services/SpecialService.js';
import baseController from './baseController.js';

class SpecialController {
    // --- Chat ---
    async getRoom(req, res) {
        try {
            const customerId = req.user.makh || req.body.customer_id;
            const roomId = await SpecialService.getOrCreateRoom(customerId);
            return baseController.sendSuccess(res, { room_id: roomId });
        } catch (error) {
            return baseController.sendError(res, 'Lỗi lấy phòng chat', 500, error.message);
        }
    }

    async sendMessage(req, res) {
        try {
            const { room_id, message } = req.body;
            const sender_id = req.user.makh || req.user.MaTK;
            const sender_type = req.user.makh ? 'customer' : 'staff';
            const id = await SpecialService.saveMessage({ room_id, sender_id, sender_type, message });
            return baseController.sendSuccess(res, { id }, 'Đã gửi tin nhắn', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi gửi tin nhắn', 500, error.message);
        }
    }

    // --- Map ---
    async geocode(req, res) {
        try {
            const data = await SpecialService.geocode(req.query.q);
            return baseController.sendSuccess(res, data);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi proxy bản đồ', 500, error.message);
        }
    }
}

export default new SpecialController();
