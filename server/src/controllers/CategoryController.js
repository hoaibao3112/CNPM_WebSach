import CategoryService from '../services/CategoryService.js';
import baseController from './baseController.js';

class CategoryController {
    async getAll(req, res) {
        try {
            const categories = await CategoryService.getAllCategories();
            return baseController.sendSuccess(res, categories);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách thể loại', 500, error.message);
        }
    }

    async getById(req, res) {
        try {
            const category = await CategoryService.getCategoryById(req.params.id);
            return baseController.sendSuccess(res, category);
        } catch (error) {
            return baseController.sendError(res, error.message, 404);
        }
    }

    async create(req, res) {
        try {
            const id = await CategoryService.createCategory(req.body);
            return baseController.sendSuccess(res, { id }, 'Thêm thể loại thành công!', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi thêm thể loại', 500, error.message);
        }
    }
    async update(req, res) {
        try {
            await CategoryService.updateCategory(req.params.id, req.body);
            return baseController.sendSuccess(res, null, 'Cập nhật thể loại thành công!');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async delete(req, res) {
        try {
            await CategoryService.deleteCategory(req.params.id);
            return baseController.sendSuccess(res, null, 'Xóa thể loại thành công!');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }
}

export default new CategoryController();
