import AuthorService from '../services/AuthorService.js';
import baseController from './baseController.js';

class AuthorController {
    async getAll(req, res) {
        try {
            const filters = {
                page: req.query.page,
                limit: req.query.limit,
                search: req.query.search
            };
            const result = await AuthorService.getAllAuthors(filters);
            return baseController.sendSuccess(res, result);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách tác giả', 500, error.message);
        }
    }

    async getById(req, res) {
        try {
            const author = await AuthorService.getAuthorById(req.params.id);
            return baseController.sendSuccess(res, author);
        } catch (error) {
            return baseController.sendError(res, error.message, 404);
        }
    }

    async create(req, res) {
        try {
            const result = await AuthorService.createAuthor(req.body);
            return baseController.sendSuccess(res, result, 'Thêm tác giả thành công!', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi thêm tác giả', 500, error.message);
        }
    }

    async update(req, res) {
        try {
            const result = await AuthorService.updateAuthor(req.params.id, req.body);
            return baseController.sendSuccess(res, result, 'Cập nhật tác giả thành công!');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async delete(req, res) {
        try {
            const result = await AuthorService.deleteAuthor(req.params.id);
            return baseController.sendSuccess(res, result, 'Xóa tác giả thành công!');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async getNationalities(req, res) {
        try {
            const nationalities = await AuthorService.getNationalities();
            return baseController.sendSuccess(res, nationalities);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách quốc tịch', 500, error.message);
        }
    }
}

export default new AuthorController();
