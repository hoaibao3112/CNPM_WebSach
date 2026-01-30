import HRService from '../services/HRService.js';
import baseController from './baseController.js';

class HRController {
    // --- Attendance ---
    async getAttendance(req, res) {
        try {
            const rows = await HRService.getAttendance(req.query);
            return baseController.sendSuccess(res, rows);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách chấm công', 500, error.message);
        }
    }

    async markAttendance(req, res) {
        try {
            await HRService.markAttendance(req.body);
            return baseController.sendSuccess(res, null, 'Chấm công thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    // --- Leave ---
    async getAllLeaves(req, res) {
        try {
            const rows = await HRService.getAllLeaves();
            return baseController.sendSuccess(res, rows);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách nghỉ phép', 500, error.message);
        }
    }

    async createLeave(req, res) {
        try {
            await HRService.createLeaveRequest(req.body);
            return baseController.sendSuccess(res, null, 'Gửi đơn nghỉ phép thành công', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi gửi đơn nghỉ phép', 500, error.message);
        }
    }

    async approveLeave(req, res) {
        try {
            const { id } = req.params;
            const { nguoi_duyet } = req.body;
            await HRService.updateLeaveStatus(id, 'Da_duyet', nguoi_duyet);
            return baseController.sendSuccess(res, null, 'Duyệt đơn nghỉ phép thành công');
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi duyệt đơn nghỉ phép', 500, error.message);
        }
    }

    async rejectLeave(req, res) {
        try {
            const { id } = req.params;
            const { nguoi_duyet } = req.body;
            await HRService.updateLeaveStatus(id, 'Tu_choi', nguoi_duyet);
            return baseController.sendSuccess(res, null, 'Từ chối đơn nghỉ phép thành công');
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi từ chối đơn nghỉ phép', 500, error.message);
        }
    }
}

export default new HRController();
