import RefundService from '../services/RefundService.js';
import baseController from './baseController.js';

class RefundController {
    // ===== CREATE REFUND REQUEST =====
    async createRefundRequest(req, res) {
        try {
            const customerId = req.user.makh;

            if (!customerId) {
                return baseController.sendError(res, 'Không xác thực được người dùng', 401);
            }

            const refundData = {
                ...req.body,
                customerId
            };

            const result = await RefundService.createRefundRequest(refundData);
            return baseController.sendSuccess(
                res,
                result,
                'Yêu cầu hoàn tiền đã được tạo',
                201
            );

        } catch (error) {
            console.error('Create refund request error:', error);
            return baseController.sendError(
                res,
                error.message || 'Lỗi khi tạo yêu cầu hoàn tiền',
                500,
                error.message
            );
        }
    }

    // ===== GET CUSTOMER REFUNDS =====
    async getCustomerRefunds(req, res) {
        try {
            const { customerId } = req.params;

            // Check authorization
            if (req.user.makh != customerId && req.user.userType !== 'admin') {
                return baseController.sendError(res, 'Không có quyền truy cập', 403);
            }

            const result = await RefundService.getCustomerRefunds(customerId);
            return baseController.sendSuccess(res, result);

        } catch (error) {
            console.error('Get customer refunds error:', error);
            return baseController.sendError(
                res,
                'Lỗi khi lấy danh sách hoàn tiền',
                500,
                error.message
            );
        }
    }

    // ===== GET ADMIN REFUNDS =====
    async getAdminRefunds(req, res) {
        try {
            const filters = {
                status: req.query.status,
                page: req.query.page,
                limit: req.query.limit,
                search: req.query.search
            };

            const result = await RefundService.getAdminRefunds(filters);
            return baseController.sendSuccess(res, result);

        } catch (error) {
            console.error('Get admin refunds error:', error);
            return baseController.sendError(
                res,
                'Lỗi khi lấy danh sách hoàn tiền',
                500,
                error.message
            );
        }
    }

    // ===== GET REFUND BY ID =====
    async getRefundById(req, res) {
        try {
            const { id } = req.params;
            const refund = await RefundService.getRefundById(id);

            // Check authorization (customer can only see their own, admin can see all)
            if (req.user.userType !== 'admin' && req.user.makh != refund.customerId) {
                return baseController.sendError(res, 'Không có quyền truy cập', 403);
            }

            return baseController.sendSuccess(res, refund);

        } catch (error) {
            console.error('Get refund error:', error);
            if (error.message.includes('Không tìm thấy')) {
                return baseController.sendError(res, error.message, 404);
            }
            return baseController.sendError(
                res,
                'Lỗi khi lấy thông tin hoàn tiền',
                500,
                error.message
            );
        }
    }

    // ===== UPDATE REFUND STATUS (ADMIN) =====
    async updateRefundStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, adminNotes } = req.body;
            const processedBy = req.user.MaTK || req.user.userId;

            if (!status) {
                return baseController.sendError(res, 'Thiếu trạng thái hoàn tiền', 400);
            }

            const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'];
            if (!validStatuses.includes(status)) {
                return baseController.sendError(res, 'Trạng thái không hợp lệ', 400);
            }

            const result = await RefundService.updateRefundStatus(
                id,
                status,
                adminNotes,
                processedBy
            );

            return baseController.sendSuccess(res, result, 'Cập nhật trạng thái thành công');

        } catch (error) {
            console.error('Update refund status error:', error);
            return baseController.sendError(
                res,
                error.message || 'Lỗi khi cập nhật trạng thái',
                500,
                error.message
            );
        }
    }

    // ===== PROCESS VNPAY REFUND (ADMIN) =====
    async processVNPayRefund(req, res) {
        try {
            const { id } = req.params;

            const result = await RefundService.processVNPayRefund(id);
            return baseController.sendSuccess(
                res,
                result,
                'Xử lý hoàn tiền VNPay thành công'
            );

        } catch (error) {
            console.error('Process VNPay refund error:', error);
            return baseController.sendError(
                res,
                error.message || 'Lỗi khi xử lý hoàn tiền VNPay',
                500,
                error.message
            );
        }
    }

    // ===== GET VNPAY REFUND LOGS =====
    async getVNPayRefundLogs(req, res) {
        try {
            const customerId = req.query.customerId || null;
            const filters = {
                status: req.query.status
            };

            // If customer is accessing, restrict to their own logs
            if (req.user.userType !== 'admin') {
                if (customerId && customerId != req.user.makh) {
                    return baseController.sendError(res, 'Không có quyền truy cập', 403);
                }
            }

            const result = await RefundService.getVNPayRefundLogs(customerId, filters);
            return baseController.sendSuccess(res, result);

        } catch (error) {
            console.error('Get VNPay refund logs error:', error);
            return baseController.sendError(
                res,
                'Lỗi khi lấy lịch sử hoàn tiền VNPay',
                500,
                error.message
            );
        }
    }

    // ===== CANCEL REFUND REQUEST (CUSTOMER) =====
    async cancelRefundRequest(req, res) {
        try {
            const { id } = req.params;
            const customerId = req.user.makh;

            if (!customerId) {
                return baseController.sendError(res, 'Không xác thực được người dùng', 401);
            }

            // Get refund to verify ownership
            const refund = await RefundService.getRefundById(id);

            if (refund.customerId != customerId) {
                return baseController.sendError(res, 'Không có quyền hủy yêu cầu này', 403);
            }

            if (!['PENDING', 'PROCESSING'].includes(refund.status)) {
                return baseController.sendError(
                    res,
                    'Chỉ có thể hủy yêu cầu đang chờ xử lý hoặc đang xử lý',
                    400
                );
            }

            const result = await RefundService.updateRefundStatus(
                id,
                'CANCELLED',
                'Khách hàng hủy yêu cầu',
                null
            );

            return baseController.sendSuccess(res, result, 'Hủy yêu cầu hoàn tiền thành công');

        } catch (error) {
            console.error('Cancel refund request error:', error);
            return baseController.sendError(
                res,
                error.message || 'Lỗi khi hủy yêu cầu hoàn tiền',
                500,
                error.message
            );
        }
    }
}

export default new RefundController();
