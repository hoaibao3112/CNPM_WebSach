import CartService from '../services/CartService.js';
import baseController from './baseController.js';

class CartController {
    async getCart(req, res) {
        try {
            const userId = req.user.userId || req.user.makh;
            const cartItems = await CartService.getCart(userId);
            return baseController.sendSuccess(res, cartItems);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy giỏ hàng', 500, error.message);
        }
    }

    async add(req, res) {
        try {
            const { productId, quantity = 1 } = req.body;
            const userId = req.user.userId || req.user.makh;

            if (!productId || quantity < 1) {
                return baseController.sendError(res, 'Dữ liệu không hợp lệ', 400);
            }

            await CartService.addToCart(userId, productId, quantity);
            return baseController.sendSuccess(res, null, 'Thêm vào giỏ hàng thành công');
        } catch (error) {
            const status = error.message.includes('không tồn tại') || error.message.includes('hết hàng') ? 400 : 500;
            return baseController.sendError(res, error.message, status);
        }
    }

    async update(req, res) {
        try {
            const { productId, quantity } = req.body;
            const userId = req.user.userId || req.user.makh;

            if (!productId || quantity < 1) {
                return baseController.sendError(res, 'Dữ liệu không hợp lệ', 400);
            }

            await CartService.updateQuantity(userId, productId, quantity);
            return baseController.sendSuccess(res, null, 'Cập nhật giỏ hàng thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async remove(req, res) {
        try {
            // Support both /remove/:id and /remove with body {productId}
            const productId = req.params.id || req.params.productId || req.body.productId;
            const userId = req.user.userId || req.user.makh;

            console.log('🗑️ Remove from cart:', { productId, userId, params: req.params, body: req.body });

            if (!productId) {
                return baseController.sendError(res, 'Thiếu mã sản phẩm', 400);
            }

            await CartService.removeFromCart(userId, productId);
            return baseController.sendSuccess(res, null, 'Xóa sản phẩm thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async toggleSelection(req, res) {
        try {
            const { productId, selected } = req.body;
            const userId = req.user.userId || req.user.makh;

            await CartService.toggleSelection(userId, productId, selected);
            return baseController.sendSuccess(res, null, 'Cập nhật trạng thái chọn thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 500);
        }
    }

    async clear(req, res) {
        try {
            const userId = req.user.userId || req.user.makh;
            await CartService.clearCart(userId);
            return baseController.sendSuccess(res, null, 'Xóa toàn bộ giỏ hàng thành công');
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi xóa giỏ hàng', 500, error.message);
        }
    }

    async reorder(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.user.userId || req.user.makh;

            if (!orderId) {
                return baseController.sendError(res, 'Thiếu mã đơn hàng', 400);
            }

            const result = await CartService.reorderFromOrder(userId, orderId);
            return baseController.sendSuccess(
                res,
                result,
                `Đã thêm ${result.addedCount} sản phẩm vào giỏ hàng${result.skippedCount > 0 ? `, bỏ qua ${result.skippedCount} sản phẩm` : ''}`
            );
        } catch (error) {
            return baseController.sendError(res, error.message, 500);
        }
    }
}

export default new CartController();
