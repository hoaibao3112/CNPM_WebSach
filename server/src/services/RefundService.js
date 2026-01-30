import pool from '../config/connectDatabase.js';

class RefundService {
    // ===== GENERATE REFUND REQUEST ID =====
    generateRefundRequestId() {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        return `RR-${dateStr}-${random}`;
    }

    // ===== CREATE REFUND REQUEST =====
    async createRefundRequest(data) {
        const {
            orderId,
            customerId,
            refundAmount,
            refundReason,
            refundType = 'FULL',
            bankAccount,
            bankName,
            accountHolder
        } = data;

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Validate order exists and belongs to customer
            const [[order]] = await connection.query(
                'SELECT * FROM hoadon WHERE MaHD = ? AND makh = ?',
                [orderId, customerId]
            );

            if (!order) {
                throw new Error('Không tìm thấy đơn hàng hoặc không có quyền');
            }

            // Check if order is eligible for refund
            const eligibility = await this.validateRefundEligibility(connection, orderId);
            if (!eligibility.eligible) {
                throw new Error(eligibility.reason);
            }

            // Check for existing pending refund
            const [[existingRefund]] = await connection.query(
                `SELECT * FROM refund_requests 
                 WHERE orderId = ? AND status IN ('PENDING', 'PROCESSING')`,
                [orderId]
            );

            if (existingRefund) {
                throw new Error('Đơn hàng này đã có yêu cầu hoàn tiền đang chờ xử lý');
            }

            // Generate refund request ID
            const refundRequestId = this.generateRefundRequestId();

            // Calculate refund amount if not provided
            let finalRefundAmount = refundAmount;
            if (!finalRefundAmount || refundType === 'FULL') {
                finalRefundAmount = order.TongTien;
            }

            // Validate refund amount
            if (finalRefundAmount > order.TongTien) {
                throw new Error('Số tiền hoàn lại không được vượt quá tổng tiền đơn hàng');
            }

            // Create refund request
            const [result] = await connection.query(
                `INSERT INTO refund_requests 
                 (refundRequestId, orderId, customerId, refundAmount, refundReason, refundType, 
                  status, bankAccount, bankName, accountHolder, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, NOW())`,
                [refundRequestId, orderId, customerId, finalRefundAmount, refundReason,
                    refundType, bankAccount, bankName, accountHolder]
            );

            await connection.commit();

            console.log(`✅ Refund request created: ${refundRequestId}`);

            return {
                id: result.insertId,
                refundRequestId,
                orderId,
                customerId,
                refundAmount: finalRefundAmount,
                refundType,
                status: 'PENDING'
            };

        } catch (error) {
            await connection.rollback();
            console.error('❌ Create refund request error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // ===== VALIDATE REFUND ELIGIBILITY =====
    async validateRefundEligibility(connection, orderId) {
        const [[order]] = await connection.query(
            'SELECT * FROM hoadon WHERE MaHD = ?',
            [orderId]
        );

        if (!order) {
            return { eligible: false, reason: 'Đơn hàng không tồn tại' };
        }

        // Check if order is paid
        if (order.TrangThaiThanhToan !== 'Đã thanh toán') {
            return { eligible: false, reason: 'Chỉ có thể hoàn tiền đơn hàng đã thanh toán' };
        }

        // Check if order is already cancelled (unless auto-cancelled by payment failure)
        if (order.tinhtrang === 'Đã hủy' && order.TrangThaiThanhToan !== 'Thất bại') {
            return { eligible: false, reason: 'Đơn hàng đã bị hủy' };
        }

        // Check if already fully refunded
        const alreadyRefunded = order.SoTienHoanTra || 0;
        if (alreadyRefunded >= order.TongTien) {
            return { eligible: false, reason: 'Đơn hàng đã được hoàn tiền đầy đủ' };
        }

        // Check time limit (30 days)
        const orderDate = new Date(order.NgayTao);
        const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceOrder > 30) {
            return { eligible: false, reason: 'Quá thời hạn hoàn tiền (30 ngày kể từ ngày đặt hàng)' };
        }

        return { eligible: true };
    }

    // ===== GET CUSTOMER REFUNDS =====
    async getCustomerRefunds(customerId) {
        const [refunds] = await pool.query(
            `SELECT 
                rr.id,
                rr.refundRequestId,
                rr.orderId,
                rr.customerId,
                rr.refundAmount,
                rr.refundReason,
                rr.refundType,
                rr.status,
                rr.bankAccount,
                rr.bankName,
                rr.accountHolder,
                rr.adminNotes,
                rr.createdAt,
                rr.processedAt,
                hd.NgayTao AS orderDate,
                hd.TongTien AS orderAmount,
                hd.PhuongThucThanhToan AS paymentMethod,
                hd.tinhtrang AS orderStatus,
                CASE rr.status
                    WHEN 'PENDING' THEN 'Chờ xử lý'
                    WHEN 'PROCESSING' THEN 'Đang xử lý'
                    WHEN 'COMPLETED' THEN 'Đã hoàn tiền'
                    WHEN 'REJECTED' THEN 'Từ chối'
                    WHEN 'CANCELLED' THEN 'Đã hủy'
                    ELSE 'Không xác định'
                END AS statusDisplay,
                CONCAT('****', RIGHT(rr.bankAccount, 4)) AS maskedBankAccount
             FROM refund_requests rr
             LEFT JOIN hoadon hd ON rr.orderId = hd.MaHD
             WHERE rr.customerId = ?
             ORDER BY rr.createdAt DESC`,
            [customerId]
        );

        const summary = {
            total: refunds.length,
            pending: refunds.filter(r => r.status === 'PENDING').length,
            processing: refunds.filter(r => r.status === 'PROCESSING').length,
            completed: refunds.filter(r => r.status === 'COMPLETED').length,
            rejected: refunds.filter(r => r.status === 'REJECTED').length,
            totalAmount: refunds.reduce((sum, r) => sum + parseFloat(r.refundAmount || 0), 0)
        };

        return { refunds, summary };
    }

    // ===== GET ADMIN REFUNDS =====
    async getAdminRefunds(filters = {}) {
        const { status, page = 1, limit = 20, search } = filters;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];

        if (status && status !== 'all') {
            whereConditions.push('rr.status = ?');
            params.push(status);
        }

        if (search) {
            whereConditions.push('(rr.refundRequestId LIKE ? OR kh.tenkh LIKE ? OR kh.email LIKE ?)');
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const [refunds] = await pool.query(
            `SELECT 
                rr.id,
                rr.refundRequestId,
                rr.orderId,
                rr.customerId,
                rr.refundAmount,
                rr.refundReason,
                rr.refundType,
                rr.status,
                rr.bankAccount,
                rr.bankName,
                rr.accountHolder,
                rr.adminNotes,
                rr.processedBy,
                rr.createdAt,
                rr.processedAt,
                hd.NgayTao AS orderDate,
                hd.TongTien AS orderAmount,
                hd.PhuongThucThanhToan AS paymentMethod,
                hd.TrangThaiThanhToan AS paymentStatus,
                kh.tenkh AS customerName,
                kh.sdt AS customerPhone,
                kh.email AS customerEmail,
                ta.TenTK AS processedByName,
                CASE rr.status
                    WHEN 'PENDING' THEN 'Chờ xử lý'
                    WHEN 'PROCESSING' THEN 'Đang xử lý'
                    WHEN 'COMPLETED' THEN 'Đã hoàn tiền'
                    WHEN 'REJECTED' THEN 'Từ chối'
                    WHEN 'CANCELLED' THEN 'Đã hủy'
                    ELSE 'Không xác định'
                END AS statusDisplay
             FROM refund_requests rr
             LEFT JOIN hoadon hd ON rr.orderId = hd.MaHD
             LEFT JOIN khachhang kh ON rr.customerId = kh.makh
             LEFT JOIN taikhoan ta ON rr.processedBy = ta.MaTK
             ${whereClause}
             ORDER BY rr.createdAt DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const [[countResult]] = await pool.query(
            `SELECT COUNT(*) as total FROM refund_requests rr
             LEFT JOIN khachhang kh ON rr.customerId = kh.makh
             ${whereClause}`,
            params
        );

        const summary = {
            total: countResult.total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(countResult.total / limit),
            pending: refunds.filter(r => r.status === 'PENDING').length,
            processing: refunds.filter(r => r.status === 'PROCESSING').length,
            completed: refunds.filter(r => r.status === 'COMPLETED').length,
            rejected: refunds.filter(r => r.status === 'REJECTED').length
        };

        return { refunds, summary };
    }

    // ===== GET REFUND BY ID =====
    async getRefundById(refundId) {
        const [[refund]] = await pool.query(
            `SELECT 
                rr.*,
                hd.NgayTao AS orderDate,
                hd.TongTien AS orderAmount,
                hd.PhuongThucThanhToan AS paymentMethod,
                hd.TrangThaiThanhToan AS paymentStatus,
                hd.tinhtrang AS orderStatus,
                kh.tenkh AS customerName,
                kh.sdt AS customerPhone,
                kh.email AS customerEmail,
                ta.TenTK AS processedByName
             FROM refund_requests rr
             LEFT JOIN hoadon hd ON rr.orderId = hd.MaHD
             LEFT JOIN khachhang kh ON rr.customerId = kh.makh
             LEFT JOIN taikhoan ta ON rr.processedBy = ta.MaTK
             WHERE rr.id = ?`,
            [refundId]
        );

        if (!refund) {
            throw new Error('Không tìm thấy yêu cầu hoàn tiền');
        }

        // Get VNPay transaction log if exists
        const [vnpayLogs] = await pool.query(
            `SELECT * FROM nhatky_hoantienvnpay 
             WHERE ma_yc_hoantra = ? 
             ORDER BY ngay_tao DESC`,
            [refund.refundRequestId]
        );

        return { ...refund, vnpayLogs };
    }

    // ===== UPDATE REFUND STATUS =====
    async updateRefundStatus(refundId, status, adminNotes, processedBy) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Get refund request
            const [[refund]] = await connection.query(
                'SELECT * FROM refund_requests WHERE id = ?',
                [refundId]
            );

            if (!refund) {
                throw new Error('Không tìm thấy yêu cầu hoàn tiền');
            }

            // Update refund request
            await connection.query(
                `UPDATE refund_requests 
                 SET status = ?, adminNotes = ?, processedBy = ?, processedAt = NOW() 
                 WHERE id = ?`,
                [status, adminNotes, processedBy, refundId]
            );

            // If completed, update order refund amount
            if (status === 'COMPLETED') {
                await connection.query(
                    `UPDATE hoadon 
                     SET SoTienHoanTra = COALESCE(SoTienHoanTra, 0) + ?,
                         TrangThaiThanhToan = CASE 
                            WHEN COALESCE(SoTienHoanTra, 0) + ? >= TongTien THEN 'Đã hoàn tiền'
                            ELSE 'Hoàn một phần'
                         END
                     WHERE MaHD = ?`,
                    [refund.refundAmount, refund.refundAmount, refund.orderId]
                );
            }

            await connection.commit();

            console.log(`✅ Refund ${refund.refundRequestId} updated to ${status}`);

            return { success: true, refundRequestId: refund.refundRequestId, status };

        } catch (error) {
            await connection.rollback();
            console.error('❌ Update refund status error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // ===== PROCESS VNPAY REFUND =====
    async processVNPayRefund(refundRequestId) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Get refund request
            const [[refund]] = await connection.query(
                `SELECT rr.*, hd.PhuongThucThanhToan 
                 FROM refund_requests rr
                 JOIN hoadon hd ON rr.orderId = hd.MaHD
                 WHERE rr.id = ?`,
                [refundRequestId]
            );

            if (!refund) {
                throw new Error('Không tìm thấy yêu cầu hoàn tiền');
            }

            if (refund.PhuongThucThanhToan !== 'VNPAY') {
                throw new Error('Đơn hàng này không thanh toán qua VNPay');
            }

            // Create VNPay refund log
            const [logResult] = await connection.query(
                `INSERT INTO nhatky_hoantienvnpay 
                 (ma_hoadon, ma_khachhang, ma_yc_hoantra, sotien_hoantra, lydo_hoantra, 
                  trangthai, ngay_tao)
                 VALUES (?, ?, ?, ?, ?, 'DANG_XL', NOW())`,
                [refund.orderId, refund.customerId, refund.refundRequestId,
                refund.refundAmount, refund.refundReason]
            );

            // Simulate VNPay refund API call (in real implementation, call actual VNPay API)
            console.log('🔄 Simulating VNPay refund API call...');
            const vnpaySuccess = true; // Simulate success
            const vnpayTransactionId = `VNPREF${Date.now()}`;

            if (vnpaySuccess) {
                // Update VNPay log
                await connection.query(
                    `UPDATE nhatky_hoantienvnpay 
                     SET trangthai = 'THANH_CONG', 
                         ma_giaodich_vnpay = ?,
                         ngay_vnpay_xuly = NOW(),
                         ngay_capnhat = NOW()
                     WHERE id = ?`,
                    [vnpayTransactionId, logResult.insertId]
                );

                // Update refund request to COMPLETED
                await connection.query(
                    `UPDATE refund_requests 
                     SET status = 'COMPLETED', processedAt = NOW() 
                     WHERE id = ?`,
                    [refundRequestId]
                );

                // Update order
                await connection.query(
                    `UPDATE hoadon 
                     SET SoTienHoanTra = COALESCE(SoTienHoanTra, 0) + ?,
                         TrangThaiThanhToan = CASE 
                            WHEN COALESCE(SoTienHoanTra, 0) + ? >= TongTien THEN 'Đã hoàn tiền'
                            ELSE 'Hoàn một phần'
                         END,
                         GhiChu = CONCAT(IFNULL(GhiChu, ''), ?)
                     WHERE MaHD = ?`,
                    [
                        refund.refundAmount,
                        refund.refundAmount,
                        `\n[${new Date().toLocaleString()}] VNPay hoàn tiền: ${refund.refundAmount.toLocaleString()}đ`,
                        refund.orderId
                    ]
                );

                await connection.commit();

                console.log(`✅ VNPay refund processed: ${refund.refundRequestId}`);

                return {
                    success: true,
                    refundRequestId: refund.refundRequestId,
                    vnpayTransactionId,
                    amount: refund.refundAmount,
                    status: 'COMPLETED'
                };

            } else {
                // Update VNPay log as failed
                await connection.query(
                    `UPDATE nhatky_hoantienvnpay 
                     SET trangthai = 'THAT_BAI', ngay_capnhat = NOW() 
                     WHERE id = ?`,
                    [logResult.insertId]
                );

                await connection.commit();

                throw new Error('VNPay hoàn tiền thất bại');
            }

        } catch (error) {
            await connection.rollback();
            console.error('❌ Process VNPay refund error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // ===== GET VNPAY REFUND LOGS =====
    async getVNPayRefundLogs(customerId = null, filters = {}) {
        let whereConditions = [];
        let params = [];

        if (customerId) {
            whereConditions.push('nt.ma_khachhang = ?');
            params.push(customerId);
        }

        if (filters.status) {
            whereConditions.push('nt.trangthai = ?');
            params.push(filters.status);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const [logs] = await pool.query(
            `SELECT 
                nt.*,
                hd.NgayTao AS orderDate,
                hd.TongTien AS orderAmount,
                kh.tenkh AS customerName,
                CASE nt.trangthai
                    WHEN 'THANH_CONG' THEN 'Thành công'
                    WHEN 'THAT_BAI' THEN 'Thất bại'
                    WHEN 'DANG_XL' THEN 'Đang xử lý'
                    ELSE 'Không xác định'
                END AS statusDisplay
             FROM nhatky_hoantienvnpay nt
             LEFT JOIN hoadon hd ON nt.ma_hoadon = hd.MaHD
             LEFT JOIN khachhang kh ON nt.ma_khachhang = kh.makh
             ${whereClause}
             ORDER BY nt.ngay_tao DESC`,
            params
        );

        const summary = {
            total: logs.length,
            totalAmount: logs.reduce((sum, log) => sum + parseFloat(log.sotien_hoantra || 0), 0),
            successCount: logs.filter(log => log.trangthai === 'THANH_CONG').length,
            pendingCount: logs.filter(log => log.trangthai === 'DANG_XL').length,
            failedCount: logs.filter(log => log.trangthai === 'THAT_BAI').length
        };

        return { logs, summary };
    }
}

export default new RefundService();
