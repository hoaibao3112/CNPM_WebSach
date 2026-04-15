/**
 * Facebook OAuth Authentication Service
 * Xử lý: Verify Facebook token, Auto-register/Login, Generate JWT
 */
import { KhachHang } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import axios from 'axios';

class FacebookAuthService {
  /**
   * Verify Facebook Access Token
   * Reference: https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow
   */
  async verifyFacebookToken(accessToken) {
    try {
      const response = await axios.get('https://graph.facebook.com/me', {
        params: {
          fields: 'id,name,email,picture.width(200).height(200)',
          access_token: accessToken
        }
      });

      if (!response.data) {
        throw new AppError('Token Facebook không hợp lệ', 401);
      }

      return response.data;
    } catch (error) {
      logger.error('Facebook token verification failed:', error.message);
      throw new AppError('Xác minh token Facebook thất bại', 401);
    }
  }

  /**
   * Facebook OAuth login/registration
   */
  async facebookAuth(accessToken) {
    try {
      // 1. Verify token
      const fbPayload = await this.verifyFacebookToken(accessToken);

      const fbId = fbPayload.id;
      const email = fbPayload.email;
      const name = fbPayload.name;
      const picture = fbPayload.picture?.data?.url || null;

      if (!email) {
        throw new AppError(
          'Email không được làm công khai trên tài khoản Facebook của bạn. Vui lòng cập nhật quyền riêng tư.',
          400
        );
      }

      logger.info('✅ Facebook token verified', { fbId, email, name });

      // 2. Find or create user
      let customer = await KhachHang.findOne({ where: { email } });

      if (customer) {
        // User exists - log in
        if (!customer.facebook_id) {
          await customer.update({ facebook_id: fbId, avatar: picture || customer.avatar });
        }
        logger.info('✅ Existing user login via Facebook', { email });
      } else {
        // New user - auto-register
        logger.info('✅ New Facebook user, auto-registering', { email, name });

        customer = await KhachHang.create({
          email,
          tenkh: name || email.split('@')[0],
          matkhau: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
          facebook_id: fbId,
          avatar: picture || null,
          // Default values
          sdt: null,
          diachi: null,
          ngaysinh: null
        });
      }

      // 3. Generate JWT tokens
      const token = jwt.sign(
        {
          userId: customer.makh,
          makh: customer.makh,
          email: customer.email,
          tenkh: customer.tenkh,
          userType: 'customer',
          authProvider: 'facebook',
          loyalty_tier: customer.loyalty_tier || 0,
          loyalty_points: customer.loyalty_points || 0
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { userId: customer.makh, userType: 'customer', authProvider: 'facebook' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        refreshToken,
        user: {
          makh: customer.makh,
          email: customer.email,
          tenkh: customer.tenkh,
          avatar: customer.avatar
        }
      };
    } catch (error) {
      logger.error('❌ Facebook Auth Error:', error.message);
      throw error;
    }
  }
}

export default new FacebookAuthService();
