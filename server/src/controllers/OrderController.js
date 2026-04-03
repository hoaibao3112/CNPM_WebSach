import OrderService from '../services/OrderService.js';
import baseController from './baseController.js';

class OrderController {
    // ===== PLACE ORDER =====
    async placeOrder(req, res) {
        try {
            const orderResult = await OrderService.placeOrder(req.body, req.user);

            const checkoutResult = await OrderService.finalizeCheckout(
                orderResult,
                req.body.paymentMethod,
                req.ip,
            );

            if (checkoutResult.responseType === 'raw') {
                return res.status(checkoutResult.statusCode || 200).json(checkoutResult.payload);
            }

            return baseController.sendSuccess(res, checkoutResult.payload);

        } catch (error) {
            return baseController.sendError(res, error.message || 'Lỗi khi đặt hàng', 500, error.message);
        }
    }

    // ===== GET CUSTOMER ORDERS =====
    async getCustomerOrders(req, res) {
        try {
            const { customerId } = req.params;

            // Check authorization
            if (req.user.makh != customerId && req.user.userType !== 'admin') {
                return baseController.sendError(res, 'Không có quyền truy cập', 403);
            }

            const orders = await OrderService.getCustomerOrders(customerId);
            return baseController.sendSuccess(res, orders);

        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách đơn hàng', 500, error.message);
        }
    }

    // ===== GET ORDER DETAILS =====
    async getOrderDetails(req, res) {
        try {
            const orderId = req.params.orderId || req.params.id;
            const order = await OrderService.getOrderById(orderId);

            // Check authorization
            if (req.user.makh != order.customerId && req.user.userType !== 'admin') {
                return baseController.sendError(res, 'Không có quyền truy cập', 403);
            }

            return baseController.sendSuccess(res, order);

        } catch (error) {
            if (error.message === 'Không tìm thấy đơn hàng') {
                return baseController.sendError(res, error.message, 404);
            }
            return baseController.sendError(res, 'Lỗi khi lấy chi tiết đơn hàng', 500, error.message);
        }
    }

    // ===== CANCEL ORDER =====
    async cancelOrder(req, res) {
        try {
            const { orderId } = req.params;
            const { reason } = req.body;
            const customerId = req.user.makh;

            if (!customerId) {
                return baseController.sendError(res, 'Không xác thực được người dùng', 401);
            }

            const result = await OrderService.cancelOrder(orderId, customerId, reason);
            return baseController.sendSuccess(res, result);

        } catch (error) {
            return baseController.sendError(res, error.message || 'Lỗi khi hủy đơn hàng', 500, error.message);
        }
    }

    // ===== UPDATE ORDER STATUS (ADMIN) =====
    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            // Accept both 'status' (English) and 'trangthai' (Vietnamese) for compatibility
            const status = req.body.status || req.body.trangthai;

            if (!status) {
                return baseController.sendError(res, 'Thiếu trạng thái đơn hàng (status hoặc trangthai)', 400);
            }

            const result = await OrderService.updateOrderStatus(id, status);
            return baseController.sendSuccess(res, result, 'Cập nhật trạng thái thành công');

        } catch (error) {
            if (error.message === 'ORDER_NOT_FOUND') {
                return baseController.sendError(res, 'Không tìm thấy đơn hàng', 404);
            }
            return baseController.sendError(res, 'Lỗi khi cập nhật trạng thái', 500, error.message);
        }
    }

    // ===== DELETE ORDER (ADMIN) =====
    async deleteOrder(req, res) {
        try {
            const { id } = req.params;
            const result = await OrderService.deleteOrder(id);
            return baseController.sendSuccess(res, result, 'Xóa đơn hàng thành công');

        } catch (error) {
            if (error.message === 'ORDER_NOT_FOUND') {
                return baseController.sendError(res, 'Không tìm thấy đơn hàng', 404);
            }
            return baseController.sendError(res, 'Lỗi khi xóa đơn hàng', 500, error.message);
        }
    }

    // ===== GET ALL ORDERS (ADMIN) =====
    async getAllOrders(req, res) {
        try {
            const orders = await OrderService.getAllOrders();

            return baseController.sendSuccess(res, orders);

        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách đơn hàng', 500, error.message);
        }
    }

    // ===== ADDRESS MANAGEMENT =====
    async getCustomerAddresses(req, res) {
        try {
            const { customerId } = req.params;

            if (req.user.makh != customerId && req.user.userType !== 'admin') {
                return baseController.sendError(res, 'Không có quyền truy cập', 403);
            }

            const addresses = await OrderService.getCustomerAddresses(customerId);
            return baseController.sendSuccess(res, addresses);

        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách địa chỉ', 500, error.message);
        }
    }

    async createAddress(req, res) {
        try {
            const customerId = req.user.makh;
            if (!customerId) {
                return baseController.sendError(res, 'Không xác thực được người dùng', 401);
            }

            const addressId = await OrderService.createAddress(customerId, req.body);
            return baseController.sendSuccess(res, { id: addressId }, 'Tạo địa chỉ thành công');

        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi tạo địa chỉ', 500, error.message);
        }
    }

    async updateAddress(req, res) {
        try {
            const { id } = req.params;
            const customerId = req.user.makh;

            if (!customerId) {
                return baseController.sendError(res, 'Không xác thực được người dùng', 401);
            }

            await OrderService.updateAddress(id, customerId, req.body);
            return baseController.sendSuccess(res, { id }, 'Cập nhật địa chỉ thành công');

        } catch (error) {
            if (error.message === 'Địa chỉ không tồn tại') {
                return baseController.sendError(res, error.message, 404);
            }
            return baseController.sendError(res, 'Lỗi khi cập nhật địa chỉ', 500, error.message);
        }
    }

    async deleteAddress(req, res) {
        try {
            const { id } = req.params;
            const customerId = req.user.makh;

            if (!customerId) {
                return baseController.sendError(res, 'Không xác thực được người dùng', 401);
            }

            await OrderService.deleteAddress(id, customerId);
            return baseController.sendSuccess(res, { id }, 'Xóa địa chỉ thành công');

        } catch (error) {
            if (error.message === 'Địa chỉ không tồn tại') {
                return baseController.sendError(res, error.message, 404);
            }
            return baseController.sendError(res, 'Lỗi khi xóa địa chỉ', 500, error.message);
        }
    }

    async setDefaultAddress(req, res) {
        try {
            const { id: addressId } = req.params;
            const customerId = req.user?.makh || req.user?.id;

            if (!customerId) {
                return baseController.sendError(res, 'Unauthorized', 401);
            }

            await OrderService.setDefaultAddress(addressId, customerId);
            return baseController.sendSuccess(res, null, 'Đã đặt địa chỉ mặc định');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    // ===== LOCATION RESOLUTION =====

    async resolveProvince(req, res) {
        try {
            const { code } = req.params;
            const name = OrderService.resolveProvinceName(code);
            return baseController.sendSuccess(res, { name });
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi resolve province', 500, error.message);
        }
    }

    async resolveDistrict(req, res) {
        try {
            const { code } = req.params;
            const name = OrderService.resolveDistrictName(code);
            return baseController.sendSuccess(res, { name });
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi resolve district', 500, error.message);
        }
    }

    async resolveWard(req, res) {
        try {
            const { code } = req.params;
            const name = OrderService.resolveWardName(code);
            return baseController.sendSuccess(res, { name });
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi resolve ward', 500, error.message);
        }
    }

    // ===== VNPAY CALLBACK =====
    async vnpayReturn(req, res) {
        try {
            const result = await OrderService.processVNPayReturn(req.query);
            if (result.status === 'success') {
                return res.redirect(
                    `${process.env.CLIENT_CUSTOMER_URL}/GiaoDien/order-confirmation.html?orderId=${result.orderId}&amount=${result.amount}&status=success`
                );
            }

            return res.redirect(
                `${process.env.CLIENT_CUSTOMER_URL}/GiaoDien/order-confirmation.html?orderId=${result.orderId}&amount=${result.amount}&status=failed&code=${result.rspCode}`
            );

        } catch (error) {
            return res.redirect(
                `${process.env.CLIENT_CUSTOMER_URL}/GiaoDien/order-confirmation.html?status=error`
            );
        }
    }
}

export default new OrderController();
