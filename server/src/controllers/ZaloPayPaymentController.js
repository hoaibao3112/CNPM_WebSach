/**
 * ZaloPay Payment Controller
 * Xử lý: Tạo payment request, Xử lý callback, Hoàn tiền
 */
import ZaloPayPaymentService from '../services/ZaloPayPaymentService.js';
import baseController from './baseController.js';
import logger from '../utils/logger.js';

class ZaloPayPaymentController {
  /**
   * POST /api/payments/zalopay/create
   * Tạo yêu cầu thanh toán ZaloPay
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

      const paymentUrl = await ZaloPayPaymentService.createPaymentUrl(
        orderId,
        amount,
        orderInfo,
        customerId
      );

      return baseController.sendSuccess(res, paymentUrl, 'Tạo link thanh toán ZaloPay thành công');
    } catch (error) {
      logger.error('ZaloPay Create Payment Error:', error);
      const statusCode = error.statusCode || 500;
      return baseController.sendError(res, error.message, statusCode);
    }
  }

  /**
   * GET /api/payments/zalopay-return
   * Xử lý redirect sau khi customer hoàn thành thanh toán
   * (Redirect từ ZaloPay website về đây)
   */
  async zaloPayReturn(req, res) {
    try {
      const { app_trans_id, return_code, zp_trans_token } = req.query;

      logger.info('💳 ZaloPay Return Redirect Params:', {
        appTransId: app_trans_id,
        returnCode: return_code,
        zpTransToken: zp_trans_token
      });

      // Determine FrontEnd URL
      const rawFrontendUrl = process.env.CLIENT_CUSTOMER_URL || 'http://localhost:5501';
      // Clean target URL (ensure it's a string, no trailing slash duplication)
      const frontendUrl = String(rawFrontendUrl).replace(/\/$/, '');

      const redirectPath = '/order-confirmation.html';
      const redirectUrl = `${frontendUrl}${redirectPath}?appTransId=${app_trans_id || ''}&returnCode=${return_code || ''}&zpTransToken=${zp_trans_token || ''}&paymentMethod=zalopay`;

      logger.info(`💳 Redirecting user back to frontend: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    } catch (error) {
      logger.error('ZaloPay Return Error:', error);
      return res.status(400).json({
        statusCode: 400,
        message: 'Lỗi xử lý thanh toán',
        error: error.message
      });
    }
  }

  /**
   * POST /api/payments/zalopay-ipn
   * Xử lý IPN callback từ ZaloPay
   * ZaloPay sẽ gửi POST request đến endpoint này để thông báo kết quả thanh toán
   */
  async zaloPayIPN(req, res) {
    try {
      const callbackData = req.body;
      const parsedData = callbackData?.data ? JSON.parse(callbackData.data) : {};

      logger.info('💳 ZaloPay IPN Callback Received:', {
        appTransId: parsedData.app_trans_id,
        returnCode: parsedData.status,
        zpTransId: parsedData.zp_trans_id,
        amount: parsedData.amount
      });

      // Xử lý callback
      const success = await ZaloPayPaymentService.handleZaloPayCallback(callbackData);

      // ZaloPay yêu cầu return_code để xác nhận callback
      return res.status(200).json({
        return_code: success ? 1 : 2,
        return_message: success ? 'success' : 'payment failed'
      });
    } catch (error) {
      logger.error('ZaloPay IPN Error:', error.message);

      // return_code != 1 để ZaloPay có thể retry callback
      return res.status(200).json({
        return_code: -1,
        return_message: error.message || 'invalid callback'
      });
    }
  }

  /**
   * POST /api/payments/zalopay/refund
   * Hoàn tiền ZaloPay (nếu cần)
   * Body: { zpTransToken, appTransId, orderId, amount }
   */
  async refundPayment(req, res) {
    try {
      const { zpTransToken, appTransId, orderId, amount } = req.body;
      const customerId = req.user?.makh;

      if (!customerId) {
        return baseController.sendError(res, 'Vui lòng đăng nhập trước', 401);
      }

      const result = await ZaloPayPaymentService.refundTransaction(
        zpTransToken,
        appTransId,
        orderId,
        amount
      );

      return baseController.sendSuccess(res, result, 'Yêu cầu hoàn tiền đã được gửi');
    } catch (error) {
      logger.error('ZaloPay Refund Error:', error);
      const statusCode = error.statusCode || 500;
      return baseController.sendError(res, error.message, statusCode);
    }
  }
}

export default new ZaloPayPaymentController();
