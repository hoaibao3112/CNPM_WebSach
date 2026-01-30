import FAQService from '../services/FAQService.js';
import baseController from './baseController.js';

class FAQController {
    async getAll(req, res) {
        try {
            const faqs = await FAQService.getAllFAQs(req.query);
            return baseController.sendSuccess(res, { faqs });
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy FAQ', 500, error.message);
        }
    }

    async create(req, res) {
        try {
            await FAQService.createFAQ(req.body);
            return baseController.sendSuccess(res, null, 'FAQ đã được thêm', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi thêm FAQ', 500, error.message);
        }
    }

    async update(req, res) {
        try {
            await FAQService.updateFAQ(req.params.id, req.body);
            return baseController.sendSuccess(res, null, 'FAQ đã được cập nhật');
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi cập nhật FAQ', 500, error.message);
        }
    }

    async delete(req, res) {
        try {
            await FAQService.deleteFAQ(req.params.id);
            return baseController.sendSuccess(res, null, 'FAQ đã được xóa');
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi xóa FAQ', 500, error.message);
        }
    }
}

export default new FAQController();
