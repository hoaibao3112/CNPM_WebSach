/**
 * Cart Service - Business logic cho giỏ hàng
 * Sử dụng Sequelize ORM thay vì raw SQL
 */
import { GioHangChiTiet, SanPham, HoaDon, ChiTietHoaDon, sequelize } from '../models/index.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

class CartService {
  /**
   * Lấy giỏ hàng của khách hàng
   */
  async getCart(userId) {
    const cartItems = await GioHangChiTiet.findAll({
      where: { MaKH: userId },
      include: [{
        model: SanPham,
        as: 'sanPham',
        attributes: ['MaSP', 'TenSP', 'DonGia', 'HinhAnh', 'SoLuong']
      }]
    });

    // Map to format frontend expects
    return cartItems.map(item => ({
      id: item.MaSP,
      MaSP: item.MaSP,
      name: item.sanPham?.TenSP,
      price: item.sanPham?.DonGia,
      image: item.sanPham?.HinhAnh,
      quantity: item.SoLuong
    }));
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  async addToCart(userId, productId, quantity) {
    // Check stock
    const product = await SanPham.findByPk(productId, {
      attributes: ['MaSP', 'SoLuong']
    });
    if (!product) throw new AppError('Sản phẩm không tồn tại', 400);
    if (product.SoLuong < quantity) throw new AppError('Sản phẩm đã hết hàng hoặc không đủ số lượng', 400);

    // Upsert: add or increment quantity
    const existing = await GioHangChiTiet.findOne({
      where: { MaKH: userId, MaSP: productId }
    });

    if (existing) {
      await existing.update({ SoLuong: existing.SoLuong + quantity });
    } else {
      await GioHangChiTiet.create({ MaKH: userId, MaSP: productId, SoLuong: quantity });
    }

    return true;
  }

  /**
   * Cập nhật số lượng sản phẩm trong giỏ
   */
  async updateQuantity(userId, productId, quantity) {
    const [affectedRows] = await GioHangChiTiet.update(
      { SoLuong: quantity },
      { where: { MaKH: userId, MaSP: productId } }
    );

    if (affectedRows === 0) throw new AppError('Sản phẩm không tồn tại trong giỏ hàng', 400);
    return true;
  }

  /**
   * Toggle selection (placeholder - frontend manages state)
   */
  async toggleSelection(userId, productId, selected) {
    logger.warn('toggleSelection called but giohang_chitiet has no Selected column');
    return true;
  }

  /**
   * Xóa sản phẩm khỏi giỏ
   */
  async removeFromCart(userId, productId) {
    const deleted = await GioHangChiTiet.destroy({
      where: { MaKH: userId, MaSP: productId }
    });
    if (deleted === 0) throw new AppError('Sản phẩm không có trong giỏ hàng', 400);
    return true;
  }

  /**
   * Xóa toàn bộ giỏ hàng
   */
  async clearCart(userId) {
    await GioHangChiTiet.destroy({ where: { MaKH: userId } });
    return true;
  }

  /**
   * Mua lại đơn hàng (re-order) - có kiểm tra tồn kho
   */
  async reorderFromOrder(customerId, orderId) {
    const t = await sequelize.transaction();

    try {
      // Verify order belongs to customer
      const order = await HoaDon.findOne({
        where: { MaHD: orderId, makh: customerId },
        transaction: t
      });
      if (!order) throw new AppError('Không tìm thấy đơn hàng hoặc không có quyền', 404);

      // Get order items with stock info
      const items = await ChiTietHoaDon.findAll({
        where: { MaHD: orderId },
        include: [{ model: SanPham, as: 'sanPham', attributes: ['MaSP', 'SoLuong', 'TenSP'] }],
        transaction: t
      });

      if (items.length === 0) throw new AppError('Đơn hàng không có sản phẩm', 400);

      let addedCount = 0;
      const skippedItems = [];

      for (const item of items) {
        const stock = item.sanPham?.SoLuong || 0;

        if (stock < item.SoLuong) {
          skippedItems.push({
            productId: item.MaSP,
            productName: item.sanPham?.TenSP,
            reason: 'Không đủ hàng'
          });
          continue;
        }

        // Check existing cart item
        const existing = await GioHangChiTiet.findOne({
          where: { MaKH: customerId, MaSP: item.MaSP },
          transaction: t
        });

        if (existing) {
          const newQty = existing.SoLuong + item.SoLuong;
          if (newQty > stock) {
            skippedItems.push({
              productId: item.MaSP,
              productName: item.sanPham?.TenSP,
              reason: `Vượt quá tồn kho (${stock})`
            });
            continue;
          }
          await existing.update({ SoLuong: newQty }, { transaction: t });
        } else {
          await GioHangChiTiet.create(
            { MaKH: customerId, MaSP: item.MaSP, SoLuong: item.SoLuong },
            { transaction: t }
          );
        }
        addedCount++;
      }

      await t.commit();

      logger.info(`Reorder: Added ${addedCount} items, skipped ${skippedItems.length}`);

      return {
        success: true,
        addedCount,
        skippedCount: skippedItems.length,
        skippedItems
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

export default new CartService();
