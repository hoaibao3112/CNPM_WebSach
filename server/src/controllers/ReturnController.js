import ReturnService from '../services/ReturnService.js';
import baseController from './baseController.js';

class ReturnController {
    async getAll(req, res) {
        try {
            const rows = await ReturnService.getAllReturns(req.query);
            return baseController.sendSuccess(res, rows);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách yêu cầu trả hàng', 500, error.message);
        }
    }

    async create(req, res) {
        try {
            const id = await ReturnService.createReturn(req.body);
            return baseController.sendSuccess(res, { id }, 'Tạo yêu cầu trả hàng thành công', 201);
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }
}

export default new ReturnController();
