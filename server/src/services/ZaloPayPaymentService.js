/**
 * ZaloPay Payment Service
 * Xử lý: Tạo payment request, Xác minh callback, Cập nhật order status
 * Reference: https://docs.zalopay.vn/api/openapi
 */
import crypto from 'crypto';
import axios from 'axios';
import qs from 'qs';
import { HoaDon } from '../models/index.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';
import { addLoyaltyPoints } from '../utils/loyalty.js';

class ZaloPayPaymentService {
  constructor() {
    this.appId = process.env.ZALOPAY_APP_ID || '2554';
    this.key1 = process.env.ZALOPAY_KEY1 || 'sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn';
    this.key2 = process.env.ZALOPAY_KEY2 || 'trMrHtvjo6myautxDUiAcYsVtaeQ8nhf';
    this.endpoint = process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create';
    this.redirectUrl = process.env.ZALOPAY_REDIRECT_URL || 'http://localhost:5000/payments/zalopay-return';
    this.ipnUrl = process.env.ZALOPAY_IPN_URL || 'http://localhost:5000/payments/zalopay-ipn';
  }

  /**
   * app_trans_id phải unique theo ngày: yyMMdd_xxx
   * @param {number|string} orderId - Mã đơn hàng
   * @returns {string}
   */
  buildAppTransId(orderId) {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const suffix = `${orderId}_${Date.now()}`;
    return `${yy}${mm}${dd}_${suffix}`;
  }

  /**
   * Generate HMAC-SHA256 signature (ZaloPay sử dụng SHA256)
   * @param {string} data - Data string to sign
   * @param {string} key - Secret key
   * @returns {string} - Hex digest signature
   */
  generateSignature(data, key) {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Create ZaloPay payment URL
   * @param {number} orderId - Mã đơn hàng
   * @param {number} amount - Số tiền (VND)
   * @param {string} orderInfo - Mô tả đơn hàng
   * @param {number} customerId - ID khách hàng
   * @returns {Promise<{returnurl: string, orderid: string, zaloPayOrderId: string}>}
   */
  async createPaymentUrl(orderId, amount, orderInfo, customerId) {
    try {
      if (!orderId || !amount || amount <= 0) {
        throw new AppError('Thông tin đơn hàng không hợp lệ', 400);
      }

      const appTime = Date.now();
      const amountInteger = Math.round(amount);
      const appTransId = this.buildAppTransId(orderId);
      const description = (orderInfo || `Thanh toan don hang #${orderId}`).slice(0, 255);
      const appUser = `customer_${customerId}`;
      const embedData = JSON.stringify({
        redirecturl: this.redirectUrl,
        orderId,
        customerId
      });
      const item = JSON.stringify([
        {
          itemid: `order_${orderId}`,
          itemnumber: 1,
          itemname: 'Thanh toan don hang',
          itemdesc: description,
          itemprice: amountInteger
        }
      ]);

      logger.info('🛠️ ZaloPay Request Data assembling:', {
        appId: this.appId,
        orderId,
        amount: amountInteger,
        appTime,
        key1: this.key1 ? 'SET' : 'MISSING'
      });

      // ZaloPay v2 MAC format: app_id|app_trans_id|app_user|amount|app_time|embed_data|item
      const dataStr = `${this.appId}|${appTransId}|${appUser}|${amountInteger}|${appTime}|${embedData}|${item}`;
      const mac = this.generateSignature(dataStr, this.key1);

      const paymentData = {
        app_id: parseInt(this.appId),
        app_trans_id: appTransId,
        app_user: appUser,
        app_time: appTime,
        amount: amountInteger,
        app_data: JSON.stringify({
          customerId,
          orderId,
          description
        }),
        embed_data: embedData,
        item,
        description,
        bank_code: '',
        callback_url: this.ipnUrl,
        mac
      };

      logger.info('💳 ZaloPay Payment Request Created:', {
        orderId,
        amount: amountInteger,
        appTransId: paymentData.app_trans_id,
        appId: this.appId,
        appTime
      });

      // Call ZaloPay API
      const response = await axios.post(this.endpoint, qs.stringify(paymentData), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      });

      logger.info('✅ ZaloPay API Response:', {
        status: response.status,
        responseStatus: response.data?.return_code,
        returnMessage: response.data?.return_message,
        fullResponse: JSON.stringify(response.data)
      });

      if (response.data && response.data.return_code === 1) {
        return {
          paymentUrl: response.data.order_url,
          orderId: String(orderId),
          appTransId: paymentData.app_trans_id,
          zaloPayOrderId: response.data.zp_order_id || paymentData.app_trans_id
        };
      } else {
        logger.error('❌ ZaloPay API Error:', response.data);
        throw new AppError(
          response.data?.return_message || 'Lỗi tạo yêu cầu thanh toán ZaloPay',
          response.data?.return_code || 500
        );
      }
    } catch (error) {
      logger.error('🔴 ZaloPay Payment URL Creation Error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data,
        orderId,
        amount
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(`Lỗi tạo thanh toán ZaloPay: ${error.message}`, 500);
    }
  }

  /**
   * Verify ZaloPay callback signature
   * @param {object} data - Callback data từ ZaloPay
   * @returns {boolean} - True nếu callback hợp lệ
   */
  verifyCallback(data) {
    try {
      const { data: dataStr = '', mac = '' } = data;

      const calculatedSignature = this.generateSignature(dataStr, this.key2);

      if (mac !== calculatedSignature) {
        logger.warn('❌ ZaloPay Callback - Invalid Signature:', {
          appTransId: 'unknown',
          receivedMac: mac,
          calculatedMac: calculatedSignature
        });
        return false;
      }

      logger.info('✅ ZaloPay Callback - Signature Verified');
      return true;
    } catch (error) {
      logger.error('❌ ZaloPay Callback Verification Error:', error.message);
      return false;
    }
  }

  /**
   * Handle ZaloPay IPN callback
   * @param {object} data - Callback data từ ZaloPay
   * @returns {Promise<boolean>} - True nếu xử lý thành công
   */
  async handleZaloPayCallback(data) {
    try {
      // 1. Verify signature
      if (!this.verifyCallback(data)) {
        throw new AppError('Chữ ký ZaloPay không hợp lệ', 400);
      }

      // IPN payload chuẩn nằm trong field "data"
      const payload = JSON.parse(data.data || '{}');
      const appTransId = payload.app_trans_id;
      const returnCode = parseInt(payload.status, 10);
      const zpTransId = payload.zp_trans_id;
      const serverTime = payload.server_time;

      logger.info('💳 ZaloPay Callback Received:', {
        appTransId,
        returnCode,
        zpTransId,
        serverTime
      });

      // Parse app_data to get orderId
      let appData = {};
      try {
        appData = JSON.parse(payload.app_data || '{}');
      } catch (e) {
        logger.warn('ZaloPay app_data parse error:', e.message);
      }

      const orderId = appData.orderId;
      if (!orderId) {
        throw new AppError('Không tìm thấy ID đơn hàng trong callback', 400);
      }

      // 2. Find order
      const order = await HoaDon.findByPk(parseInt(orderId));
      if (!order) {
        throw new AppError(`Đơn hàng #${orderId} không tồn tại`, 404);
      }

      // 3. Update order status based on ZaloPay result
      if (returnCode === 1) {
        // Payment successful
        await order.update({
          TinhTrang: 'Đã thanh toán',
          GhiChu: `ZaloPay Payment - Trans ID: ${zpTransId}`,
          PhuongThucThanhToan: 'ZaloPay'
        });

        logger.info('✅ ZaloPay Payment Success:', {
          orderId,
          zpTransId,
          amount: payload.amount
        });

        // Get customer info for email
        const customer = order.makh ? await order.getKhachHang() : null;
        if (customer) {
          // Add loyalty points
          try {
            const pointsToAdd = Math.floor(order.TongTien / 1000); // 1 điểm per 1000 VND
            await addLoyaltyPoints(order.makh, pointsToAdd, `ZaloPay payment #${orderId}`);
            logger.info('✅ Loyalty points added:', { orderId, points: pointsToAdd });
          } catch (pointsError) {
            logger.warn('⚠️ Could not add loyalty points:', pointsError.message);
          }

          // Send confirmation email (non-blocking)
          try {
            await sendOrderConfirmationEmail(customer.Email, {
              orderId,
              totalAmount: order.TongTien,
              paymentMethod: 'ZaloPay',
              customerName: customer.TenKhachHang
            });
            logger.info('📧 Confirmation email sent:', { email: customer.Email });
          } catch (emailError) {
            logger.warn('⚠️ Email sending error:', emailError.message);
          }
        }

        return true;
      } else {
        // Payment failed
        await order.update({
          TinhTrang: 'Thanh toán thất bại',
          GhiChu: `ZaloPay Payment Failed - Return Code: ${returnCode}`
        });

        logger.warn('❌ ZaloPay Payment Failed:', {
          orderId,
          returnCode,
          returnMessage: payload.return_message
        });

        return false;
      }
    } catch (error) {
      logger.error('❌ ZaloPay Callback Error:', {
        message: error.message,
        data: { appTransId: data?.app_trans_id, orderId: data?.app_id }
      });
      throw error;
    }
  }

  /**
   * Refund ZaloPay transaction
   * @param {string} zpTransToken - ZaloPay transaction token
   * @param {string} appTransId - App transaction ID
   * @param {number} orderId - Order ID
   * @param {number} amount - Refund amount
   * @returns {Promise<object>} - Refund result
   */
  async refundTransaction(zpTransToken, appTransId, orderId, amount) {
    try {
      logger.info('💳 ZaloPay Refund Request:', {
        zpTransToken,
        appTransId,
        orderId,
        amount
      });

      // TODO: Implement ZaloPay refund API
      // Docs: https://docs.zalopay.vn/api/openapi#refund-api
      throw new AppError('Tính năng hoàn tiền ZaloPay đang được phát triển', 501);
    } catch (error) {
      logger.error('❌ ZaloPay Refund Error:', error.message);
      throw error;
    }
  }
}

export default new ZaloPayPaymentService();
