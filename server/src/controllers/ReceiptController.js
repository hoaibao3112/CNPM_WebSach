import ReceiptService from '../services/ReceiptService.js';
import baseController from './baseController.js';

class ReceiptController {
    async getAll(req, res) {
        try {
            const rows = await ReceiptService.getAllReceipts();
            return baseController.sendSuccess(res, rows);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách phiếu nhập', 500, error.message);
        }
    }

    async getById(req, res) {
        try {
            const receipt = await ReceiptService.getReceiptById(req.params.id);
            return baseController.sendSuccess(res, receipt);
        } catch (error) {
            return baseController.sendError(res, error.message, 404);
        }
    }

    async create(req, res) {
        try {
            const id = await ReceiptService.createReceipt(req.body);
            return baseController.sendSuccess(res, { MaPN: id }, 'Tạo phiếu nhập thành công', 201);
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async search(req, res) {
        try {
            const results = await ReceiptService.searchReceipts(req.query);
            return baseController.sendSuccess(res, results);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi tìm kiếm phiếu nhập', 500, error.message);
        }
    }
}

export default new ReceiptController();
