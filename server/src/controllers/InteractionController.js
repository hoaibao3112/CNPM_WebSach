import InteractionService from '../services/InteractionService.js';
import baseController from './baseController.js';

class InteractionController {
    // --- Ratings ---
    async getRatings(req, res) {
        try {
            const result = await InteractionService.getRatingsByProduct(req.params.productId);
            return baseController.sendSuccess(res, result);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy đánh giá', 500, error.message);
        }
    }

    async addRating(req, res) {
        try {
            const makh = req.user.makh;
            const id = await InteractionService.addRating({ ...req.body, makh });
            return baseController.sendSuccess(res, { id }, 'Đã gửi đánh giá, chờ duyệt', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi gửi đánh giá', 500, error.message);
        }
    }

    // --- Comments ---
    async getComments(req, res) {
        try {
            const result = await InteractionService.getCommentsByProduct(req.params.masp, req.query);
            return baseController.sendSuccess(res, result);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy bình luận', 500, error.message);
        }
    }

    // --- Favorites ---
    async getFavorites(req, res) {
        try {
            const makh = req.user?.makh || req.query.makh;
            if (!makh) return baseController.sendError(res, 'Thiếu makh', 400);
            const result = await InteractionService.getFavorites(makh, req.query);
            return baseController.sendSuccess(res, result);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách yêu thích', 500, error.message);
        }
    }

    async addFavorite(req, res) {
        try {
            const makh = req.user?.makh || req.body.makh;
            await InteractionService.addFavorite(makh, req.body.MaSP);
            return baseController.sendSuccess(res, null, 'Đã thêm vào yêu thích');
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi thêm yêu thích', 500, error.message);
        }
    }
}

export default new InteractionController();
