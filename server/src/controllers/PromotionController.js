import PromotionService from '../services/PromotionService.js';
import baseController from './baseController.js';

class PromotionController {
    // Promotion Handlers
    async getAllPromotions(req, res) {
        try {
            const result = await PromotionService.getAllPromotions(req.query);
            return baseController.sendSuccess(res, result);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách khuyến mãi', 500, error.message);
        }
    }

    async getPromotionById(req, res) {
        try {
            const promotion = await PromotionService.getPromotionById(req.params.makm);
            return baseController.sendSuccess(res, promotion);
        } catch (error) {
            return baseController.sendError(res, error.message, 404);
        }
    }

    async createPromotion(req, res) {
        try {
            const makm = await PromotionService.createPromotion(req.body);
            return baseController.sendSuccess(res, { makm }, 'Thêm khuyến mãi thành công', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi thêm khuyến mãi', 500, error.message);
        }
    }

    async updatePromotion(req, res) {
        try {
            await PromotionService.updatePromotion(req.params.makm, req.body);
            return baseController.sendSuccess(res, null, 'Cập nhật khuyến mãi thành công');
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi cập nhật khuyến mãi', 500, error.message);
        }
    }

    async deletePromotion(req, res) {
        try {
            await PromotionService.deletePromotion(req.params.makm);
            return baseController.sendSuccess(res, null, 'Xóa khuyến mãi thành công');
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi xóa khuyến mãi', 500, error.message);
        }
    }

    // Coupon Handlers
    async getMyCoupons(req, res) {
        try {
            const makh = req.user?.makh || req.query.makh;
            if (!makh) return baseController.sendError(res, 'Thiếu thông tin khách hàng', 400);
            const coupons = await PromotionService.getMyCoupons(makh);
            return baseController.sendSuccess(res, coupons);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách coupon', 500, error.message);
        }
    }

    // Voucher Handlers
    async getAllVouchers(req, res) {
        try {
            const vouchers = await PromotionService.getAllVouchers();
            return baseController.sendSuccess(res, vouchers);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách voucher', 500, error.message);
        }
    }

    async getActiveProducts(req, res) {
        try {
            const products = await PromotionService.getActiveProducts();
            return baseController.sendSuccess(res, products);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy sản phẩm khuyến mãi', 500, error.message);
        }
    }
}

export default new PromotionController();
