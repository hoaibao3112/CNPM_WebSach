/**
 * Cart Controller - Thin controller
 * Delegate to CartService, errors propagated via next()
 */
import CartService from '../services/CartService.js';
import baseController from './baseController.js';

class CartController {
  async getCart(req, res, next) {
    try {
      const userId = req.user.userId || req.user.makh;
      const cartItems = await CartService.getCart(userId);
      return baseController.sendSuccess(res, cartItems);
    } catch (error) {
      next(error);
    }
  }

  async add(req, res, next) {
    try {
      const { productId, quantity = 1 } = req.body;
      const userId = req.user.userId || req.user.makh;

      if (!productId || quantity < 1) {
        return baseController.sendError(res, 'Dữ liệu không hợp lệ', 400);
      }

      await CartService.addToCart(userId, productId, quantity);
      return baseController.sendSuccess(res, null, 'Thêm vào giỏ hàng thành công');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { productId, quantity } = req.body;
      const userId = req.user.userId || req.user.makh;

      if (!productId || quantity < 1) {
        return baseController.sendError(res, 'Dữ liệu không hợp lệ', 400);
      }

      await CartService.updateQuantity(userId, productId, quantity);
      return baseController.sendSuccess(res, null, 'Cập nhật giỏ hàng thành công');
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const productId = req.params.id || req.params.productId || req.body.productId;
      const userId = req.user.userId || req.user.makh;

      if (!productId) {
        return baseController.sendError(res, 'Thiếu mã sản phẩm', 400);
      }

      await CartService.removeFromCart(userId, productId);
      return baseController.sendSuccess(res, null, 'Xóa sản phẩm thành công');
    } catch (error) {
      next(error);
    }
  }

  async toggleSelection(req, res, next) {
    try {
      const { productId, selected } = req.body;
      const userId = req.user.userId || req.user.makh;

      await CartService.toggleSelection(userId, productId, selected);
      return baseController.sendSuccess(res, null, 'Cập nhật trạng thái chọn thành công');
    } catch (error) {
      next(error);
    }
  }

  async clear(req, res, next) {
    try {
      const userId = req.user.userId || req.user.makh;
      await CartService.clearCart(userId);
      return baseController.sendSuccess(res, null, 'Xóa toàn bộ giỏ hàng thành công');
    } catch (error) {
      next(error);
    }
  }

  async reorder(req, res, next) {
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
      next(error);
    }
  }
}

export default new CartController();
