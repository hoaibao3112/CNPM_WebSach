import OrderService from '../services/OrderService.js';
import baseController from './baseController.js';
import { addLoyaltyPoints } from '../utils/loyalty.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';
import pool from '../config/connectDatabase.js';

class OrderController {
    // ===== PLACE ORDER =====
    async placeOrder(req, res) {
        try {
            const orderResult = await OrderService.placeOrder(req.body, req.user);

            // Handle payment methods
            if (req.body.paymentMethod === 'VNPAY') {
                try {
                    const paymentUrl = await OrderService.generateVNPayUrl(
                        orderResult.orderId,
                        orderResult.finalTotalAmount,
                        req.ip
                    );

                    console.log('✅ VNPay URL generated:', paymentUrl);

                    // Return flat response format expected by frontend
                    return res.status(200).json({
                        success: true,
                        orderId: orderResult.orderId,
                        paymentUrl,
                        message: 'Đơn hàng đã tạo, chuyển hướng thanh toán VNPay',
                        appliedTier: orderResult.userTier,
                        discountAmount: orderResult.discountAmount,
                        memberDiscountAmount: orderResult.memberDiscountAmount,
                        shippingFee: orderResult.shippingFee,
                        finalTotalAmount: orderResult.finalTotalAmount
                    });

                } catch (vnpayError) {
                    console.error('❌ VNPay error:', vnpayError);
                    // Rollback order
                    await pool.query(
                        'UPDATE hoadon SET tinhtrang = "Đã hủy", GhiChu = "Lỗi VNPay" WHERE MaHD = ?',
                        [orderResult.orderId]
                    );
                    return baseController.sendError(res, 'Lỗi tạo URL thanh toán VNPay', 500, vnpayError.message);
                }

            } else if (req.body.paymentMethod === 'COD') {
                // Add loyalty points for COD (non-blocking)
                try {
                    const connection = await pool.getConnection();
                    await addLoyaltyPoints(connection, orderResult.customer.makh, orderResult.finalTotalAmount);
                    connection.release();
                    console.log(`Loyalty points added for COD order ${orderResult.orderId}`);
                } catch (e) {
                    console.warn('Loyalty add failed (non-blocking):', e.message);
                }

                // Send email non-blocking
                this.sendOrderEmail(orderResult).catch(e =>
                    console.error('Email failed (non-blocking):', e.message)
                );

                return baseController.sendSuccess(res, {
                    orderId: orderResult.orderId,
                    message: 'Đặt hàng COD thành công',
                    paymentMethod: 'COD',
                    appliedTier: orderResult.userTier,
                    discountAmount: orderResult.discountAmount,
                    memberDiscountAmount: orderResult.memberDiscountAmount,
                    shippingFee: orderResult.shippingFee,
                    finalTotalAmount: orderResult.finalTotalAmount
                });

            } else {
                return baseController.sendError(res, 'Phương thức thanh toán không hợp lệ', 400);
            }

        } catch (error) {
            console.error('❌ Place order error:', error);
            return baseController.sendError(res, error.message || 'Lỗi khi đặt hàng', 500, error.message);
        }
    }

    // ===== HELPER: SEND ORDER EMAIL =====
    async sendOrderEmail(orderResult, paymentUrl = null) {
        try {
            if (!orderResult.customerEmail) return;

            // Use raw address values (resolve methods don't exist yet)
            const emailShippingAddress = {
                detail: orderResult.shippingAddress.detail,
                province: orderResult.shippingAddress.province,
                district: orderResult.shippingAddress.district,
                ward: orderResult.shippingAddress.ward
            };

            const orderPayload = {
                id: orderResult.orderId,
                total: orderResult.finalTotalAmount,
                subtotal: orderResult.amountAfterDiscount,
                shippingFee: orderResult.shippingFee,
                paymentMethod: orderResult.paymentMethod || 'VNPAY',
                paymentUrl,
                customerName: orderResult.customer.name,
                shippingAddress: emailShippingAddress,
                items: orderResult.cartItems
            };

            await sendOrderConfirmationEmail(orderResult.customerEmail, orderPayload);
            console.log(`✅ Email sent to ${orderResult.customerEmail}`);
        } catch (e) {
            console.error('Email send failed:', e.message);
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
            const { orderId } = req.params;
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

            const [result] = await pool.query(
                'UPDATE hoadon SET tinhtrang = ? WHERE MaHD = ?',
                [status, id]
            );

            if (result.affectedRows === 0) {
                return baseController.sendError(res, 'Không tìm thấy đơn hàng', 404);
            }

            return baseController.sendSuccess(res, { id, status }, 'Cập nhật trạng thái thành công');

        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi cập nhật trạng thái', 500, error.message);
        }
    }

    // ===== DELETE ORDER (ADMIN) =====
    async deleteOrder(req, res) {
        try {
            const { id } = req.params;

            // Delete order items first
            await pool.query('DELETE FROM chitiethoadon WHERE MaHD = ?', [id]);

            // Delete order
            const [result] = await pool.query('DELETE FROM hoadon WHERE MaHD = ?', [id]);

            if (result.affectedRows === 0) {
                return baseController.sendError(res, 'Không tìm thấy đơn hàng', 404);
            }

            return baseController.sendSuccess(res, { id }, 'Xóa đơn hàng thành công');

        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi xóa đơn hàng', 500, error.message);
        }
    }

    // ===== GET ALL ORDERS (ADMIN) =====
    async getAllOrders(req, res) {
        try {
            const [orders] = await pool.query(`
                SELECT 
                    hd.MaHD AS id,
                    hd.makh,
                    hd.NgayTao AS createdAt,
                    hd.TongTien AS totalAmount,
                    hd.tinhtrang AS status,
                    kh.tenkh AS customerName,
                    kh.sdt AS customerPhone,
                    dc.DiaChiChiTiet AS shippingAddress,
                    dc.TinhThanh AS province,
                    dc.QuanHuyen AS district,
                    hd.PhuongThucThanhToan AS paymentMethod,
                    hd.TrangThaiThanhToan AS paymentStatus
                FROM hoadon hd
                LEFT JOIN khachhang kh ON hd.makh = kh.makh
                LEFT JOIN diachi dc ON hd.MaDiaChi = dc.MaDiaChi
                ORDER BY hd.NgayTao DESC
            `);

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
            const vnpParams = req.query;
            const orderId = vnpParams.vnp_TxnRef;
            const rspCode = vnpParams.vnp_ResponseCode;
            const amount = parseInt(vnpParams.vnp_Amount) / 100;

            console.log('🔍 VNPay callback:', { orderId, rspCode, amount });

            if (rspCode === '00') {
                // Payment successful
                await pool.query(
                    `UPDATE hoadon SET TrangThaiThanhToan = 'Đã thanh toán', tinhtrang = 'Đã xác nhận' WHERE MaHD = ?`,
                    [orderId]
                );

                // Add loyalty points (non-blocking)
                try {
                    const [[order]] = await pool.query('SELECT makh, TongTien FROM hoadon WHERE MaHD = ?', [orderId]);
                    if (order) {
                        const connection = await pool.getConnection();
                        await addLoyaltyPoints(connection, order.makh, order.TongTien);
                        connection.release();
                        console.log(`Loyalty: added points after VNPay success for order ${orderId}`);
                    }
                } catch (e) {
                    console.warn('Loyalty after VNPay failed:', e.message);
                }

                return res.redirect(
                    `${process.env.CLIENT_CUSTOMER_URL}/GiaoDien/order-confirmation.html?orderId=${orderId}&amount=${amount}&status=success`
                );

            } else {
                // Payment failed
                await pool.query(
                    `UPDATE hoadon SET TrangThaiThanhToan = 'Thất bại', tinhtrang = 'Đã hủy' WHERE MaHD = ?`,
                    [orderId]
                );

                // Restore stock
                const [items] = await pool.query('SELECT MaSP, Soluong FROM chitiethoadon WHERE MaHD = ?', [orderId]);
                for (const item of items) {
                    await pool.query('UPDATE sanpham SET SoLuong = SoLuong + ? WHERE MaSP = ?', [item.Soluong, item.MaSP]);
                }

                console.log(`❌ Payment failed for order ${orderId}, code: ${rspCode}`);
                return res.redirect(
                    `${process.env.CLIENT_CUSTOMER_URL}/GiaoDien/order-confirmation.html?orderId=${orderId}&amount=${amount}&status=failed&code=${rspCode}`
                );
            }

        } catch (error) {
            console.error('🔥 VNPay return error:', error);
            return res.redirect(
                `${process.env.CLIENT_CUSTOMER_URL}/GiaoDien/order-confirmation.html?status=error`
            );
        }
    }
}

export default new OrderController();
