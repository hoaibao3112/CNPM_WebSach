import ReportService from '../services/ReportService.js';
import baseController from './baseController.js';

class ReportController {
    async getRevenueByYear(req, res) {
        try {
            const data = await ReportService.getRevenueByYear();
            return baseController.sendSuccess(res, data);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi thống kê doanh thu theo năm', 500, error.message);
        }
    }

    async getOverview(req, res) {
        try {
            const data = await ReportService.getOverview(req.query);
            return baseController.sendSuccess(res, data);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy tổng quan', 500, error.message);
        }
    }
}

export default new ReportController();
