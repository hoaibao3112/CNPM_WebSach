/**
 * MoMo Payment Controller
 * Xử lý: Tạo payment request, Xử lý callback, Hoàn tiền
 */
import MoMoPaymentService from '../services/MoMoPaymentService.js';
import baseController from './baseController.js';
import logger from '../utils/logger.js';

class MoMoPaymentController {
  /**
   * POST /api/payments/momo/create
   * Tạo yêu cầu thanh toán MoMo
   * Body: { orderId, amount, orderInfo }
   */
  async createPayment(req, res) {
    try {
      const { orderId, amount, orderInfo } = req.body;
      const customerId = req.user?.makh;

      if (!customerId) {
        return baseController.sendError(res, 'Vui lòng đăng nhập trước', 401);
      }

      if (!orderId || !amount) {
        return baseController.sendError(res, 'Thông tin đơn hàng không đầy đủ', 400);
      }

      const paymentUrl = await MoMoPaymentService.createPaymentUrl(
        orderId,
        amount,
        orderInfo,
        customerId
      );

      return baseController.sendSuccess(res, paymentUrl, 'Tạo link thanh toán MoMo thành công');
    } catch (error) {
      logger.error('MoMo Create Payment Error:', error);
      const statusCode = error.statusCode || 500;
      return baseController.sendError(res, error.message, statusCode);
    }
  }

  /**
   * GET /api/payments/momo-return
   * Xử lý redirect sau khi customer hoàn thành thanh toán
   * (Redirect từ MoMo website về đây)
   */
  async momoReturn(req, res) {
    try {
      const { orderId, resultCode, transId } = req.query;

      logger.info('📱 MoMo Return Redirect Params:', { orderId, resultCode, transId });

      // Determine FrontEnd URL
      const rawFrontendUrl = process.env.CLIENT_CUSTOMER_URL || 'http://localhost:5501';
      // Clean target URL (ensure it's a string, no trailing slash duplication)
      const frontendUrl = String(rawFrontendUrl).replace(/\/$/, '');
      
      const redirectPath = '/order-confirmation.html';
      const redirectUrl = `${frontendUrl}${redirectPath}?orderId=${orderId || ''}&resultCode=${resultCode || ''}&transId=${transId || ''}`;

      logger.info(`📱 Redirecting user back to frontend: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    } catch (error) {
      logger.error('MoMo Return Error:', error);
      return res.status(400).json({
        statusCode: 400,
        message: 'Lỗi xử lý thanh toán',
        error: error.message
      });
    }
  }

  /**
   * POST /api/payments/momo-ipn
   * Xử lý IPN callback từ MoMo
   * MoMo sẽ gửi POST request đến endpoint này để thông báo kết quả thanh toán
   */
  async momoIPN(req, res) {
    try {
      const callbackData = req.body;

      logger.info('📱 MoMo IPN Callback Received:', {
        orderId: callbackData.orderId,
        resultCode: callbackData.resultCode,
        transId: callbackData.transId
      });

      // Xử lý callback
      const success = await MoMoPaymentService.handleMoMoCallback(callbackData);

      // Luôn trả về 200 OK để MoMo biết rằng chúng ta đã nhận được callback
      return res.status(200).json({
        statusCode: 200,
        message: success ? 'Xử lý thanh toán thành công' : 'Thanh toán thất bại',
        data: {
          orderId: callbackData.orderId,
          resultCode: callbackData.resultCode,
          processed: success
        }
      });
    } catch (error) {
      logger.error('MoMo IPN Error:', error.message);

      // Vẫn trả về 200 để MoMo không retry, nhưng log chi tiết lỗi
      return res.status(200).json({
        statusCode: 200,
        message: 'Callback received but processing failed',
        error: error.message,
        data: {
          orderId: req.body?.orderId,
          processed: false
        }
      });
    }
  }

  /**
   * POST /api/payments/momo/refund
   * Hoàn tiền MoMo (nếu cần)
   * Body: { transId, orderId, amount }
   */
  async refundPayment(req, res) {
    try {
      const { transId, orderId, amount } = req.body;
      const customerId = req.user?.makh;

      if (!customerId) {
        return baseController.sendError(res, 'Vui lòng đăng nhập trước', 401);
      }

      const result = await MoMoPaymentService.refundTransaction(transId, orderId, amount);

      return baseController.sendSuccess(res, result, 'Yêu cầu hoàn tiền đã được gửi');
    } catch (error) {
      logger.error('MoMo Refund Error:', error);
      const statusCode = error.statusCode || 500;
      return baseController.sendError(res, error.message, statusCode);
    }
  }
}

export default new MoMoPaymentController();
