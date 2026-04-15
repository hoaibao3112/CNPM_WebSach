/**
 * MoMo Payment Service
 * Xử lý: Tạo payment request, Xác minh callback, Cập nhật order status
 * Reference: https://momo.vn/docs/develop/payment
 */
import crypto from 'crypto';
import axios from 'axios';
import { HoaDon } from '../models/index.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

class MoMoPaymentService {
  constructor() {
    this.partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
    this.accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
    this.secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    this.apiUrl = process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create';
    this.redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:5000/payments/momo-return';
    this.ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:5000/payments/momo-ipn';
  }

  /**
   * Generate MD5 signature
   */
  generateSignature(data) {
    const rawSignature = `accessKey=${this.accessKey}&amount=${data.amount}&extraData=${data.extraData}&ipnUrl=${data.ipnUrl}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&partnerCode=${data.partnerCode}&redirectUrl=${data.redirectUrl}&requestId=${data.requestId}&requestType=${data.requestType}&secretKey=${this.secretKey}`;
    return crypto.createHash('md5').update(rawSignature).digest('hex');
  }

  /**
   * Create MoMo payment URL
   * @param {number} orderId - Mã đơn hàng
   * @param {number} amount - Số tiền (VND)
   * @param {string} orderInfo - Mô tả đơn hàng
   * @param {number} customerId - ID khách hàng
   * @returns {Promise<{paymentUrl: string, orderId: string, requestId: string}>}
   */
  async createPaymentUrl(orderId, amount, orderInfo, customerId) {
    try {
      if (!orderId || !amount || amount <= 0) {
        throw new AppError('Thông tin đơn hàng không hợp lệ', 400);
      }

      const requestId = `${orderId}-${Date.now()}`;
      const extraData = Buffer.from(JSON.stringify({ customerId, orderId })).toString('base64');

      const paymentData = {
        partnerCode: this.partnerCode,
        partnerName: 'Bookstore VipPro',
        partnerTransId: requestId,
        requestId: requestId,
        amount: Math.round(amount), // Đảm bảo số nguyên
        orderId: String(orderId),
        orderInfo: orderInfo || `Thanh toán đơn hàng #${orderId}`,
        redirectUrl: this.redirectUrl,
        ipnUrl: this.ipnUrl,
        requestType: 'captureWallet',
        autoCapture: true,
        lang: 'vi',
        extraData: extraData,
        signature: '' // Will be set below
      };

      // Generate signature
      paymentData.signature = this.generateSignature(paymentData);

      logger.info('📱 MoMo Payment Request Created:', {
        orderId,
        amount,
        requestId,
        partnerCode: this.partnerCode,
        paymentDataKeys: Object.keys(paymentData)
      });

      logger.info('🔐 MoMo Signature Debug:', {
        signature: paymentData.signature,
        partnerCode: paymentData.partnerCode,
        accessKey: this.accessKey ? 'SET' : 'MISSING',
        secretKey: this.secretKey ? 'SET' : 'MISSING'
      });

      // Call MoMo API
      const response = await axios.post(this.apiUrl, paymentData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      logger.info('✅ MoMo API Response:', {
        status: response.status,
        responseData: response.data
      });

      if (response.data && response.data.payUrl) {
        return {
          paymentUrl: response.data.payUrl,
          orderId: String(orderId),
          requestId: requestId,
          momoOrderId: response.data.orderId
        };
      } else {
        logger.error('❌ MoMo API Error (No payUrl):', response.data);
        throw new AppError(
          response.data?.message || 'Lỗi tạo yêu cầu thanh toán MoMo',
          response.data?.resultCode || 500
        );
      }
    } catch (error) {
      logger.error('❌ MoMo Payment URL Creation Error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        orderId,
        amount
      });
      throw new AppError(`Lỗi tạo thanh toán MoMo: ${error.message}`, 500);
    }
  }

  /**
   * Verify MoMo IPN callback (xác minh tính xác thực của callback)
   * @param {object} data - Dữ liệu callback từ MoMo
   * @returns {boolean} - True nếu callback hợp lệ
   */
  verifyCallback(data) {
    try {
      // Extract signature từ data
      const { signature, ...paymentData } = data;

      // Tái tạo signature
      const rawSignature = `accessKey=${this.accessKey}&amount=${paymentData.amount}&extraData=${paymentData.extraData}&orderId=${paymentData.orderId}&orderInfo=${paymentData.orderInfo}&partnerCode=${paymentData.partnerCode}&partnerTransId=${paymentData.partnerTransId}&requestId=${paymentData.requestId}&requestType=${paymentData.requestType}&responseTime=${paymentData.responseTime}&resultCode=${paymentData.resultCode}&transId=${paymentData.transId}&secretKey=${this.secretKey}`;

      const calculatedSignature = crypto.createHash('md5').update(rawSignature).digest('hex');

      if (signature !== calculatedSignature) {
        logger.warn('❌ MoMo Callback - Invalid Signature:', { orderId: paymentData.orderId });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('❌ MoMo Callback Verification Error:', error.message);
      return false;
    }
  }

  /**
   * Handle MoMo IPN callback
   * @param {object} data - Callback data từ MoMo
   * @returns {Promise<boolean>} - True nếu xử lý thành công
   */
  async handleMoMoCallback(data) {
    try {
      // 1. Verify signature
      if (!this.verifyCallback(data)) {
        throw new AppError('Chữ ký MoMo không hợp lệ', 400);
      }

      const orderId = parseInt(data.orderId);
      const resultCode = parseInt(data.resultCode);
      const transId = data.transId;

      logger.info('📱 MoMo Callback Received:', { orderId, resultCode, transId });

      // 2. Find order
      const order = await HoaDon.findByPk(orderId);
      if (!order) {
        throw new AppError(`Đơn hàng #${orderId} không tồn tại`, 404);
      }

      // 3. Update order status based on MoMo result
      if (resultCode === 0) {
        // Payment successful
        await order.update({
          TinhTrang: 'Đã thanh toán',
          GhiChu: `MoMo Payment - Trans ID: ${transId}`,
          PhuongThucThanhToan: 'MoMo'
        });

        logger.info('✅ MoMo Payment Success:', { orderId, transId });
        return true;
      } else {
        // Payment failed
        await order.update({
          TinhTrang: 'Thanh toán thất bại',
          GhiChu: `MoMo Payment Failed - Result Code: ${resultCode}`
        });

        logger.warn('❌ MoMo Payment Failed:', { orderId, resultCode });
        return false;
      }
    } catch (error) {
      logger.error('❌ MoMo Callback Handler Error:', error.message);
      throw error;
    }
  }

  /**
   * Refund MoMo transaction (if needed)
   * Note: MoMo refund requires additional setup
   */
  async refundTransaction(transId, orderId, amount) {
    try {
      logger.info('📱 MoMo Refund Request:', { transId, orderId, amount });
      // TODO: Implement MoMo refund API
      // Docs: https://momo.vn/docs/develop/refund
      throw new AppError('Tính năng hoàn tiền MoMo đang được phát triển', 501);
    } catch (error) {
      logger.error('❌ MoMo Refund Error:', error.message);
      throw error;
    }
  }
}

export default new MoMoPaymentService();
