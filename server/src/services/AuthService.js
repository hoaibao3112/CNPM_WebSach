/**
 * Auth Service - Refactored to use Sequelize ORM + AppError
 * Xử lý: Login (admin/customer), Register (OTP flow), Forgot password, Google Auth
 */
import { KhachHang, TaiKhoan, OtpRequest } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import { sendOTPEmail } from '../utils/emailService.js';
import { OAuth2Client } from 'google-auth-library';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  /**
   * Admin login
   */
  async login(username, password) {
    const account = await TaiKhoan.findOne({
      where: { TenTK: username.trim() }
    });

    if (!account) {
      throw new AppError('Tên đăng nhập không chính xác', 401);
    }

    // Handle BIT(1) type
    const isTrue = (val) => {
      if (Buffer.isBuffer(val)) return val[0] === 1 || val[0] === 49;
      return val === 1 || val === true || val === '1';
    };

    if (!isTrue(account.TinhTrang)) {
      throw new AppError('Tài khoản đã bị khóa', 403);
    }

    let passwordMatch = false;
    const stored = account.MatKhau || '';

    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
      passwordMatch = await bcrypt.compare(password, stored);
    } else {
      passwordMatch = stored === password;
      if (passwordMatch) {
        // Migrate plaintext to hash
        const newHash = await bcrypt.hash(password, 10);
        await account.update({ MatKhau: newHash });
      }
    }

    if (!passwordMatch) {
      throw new AppError('Mật khẩu không chính xác', 401);
    }

    const token = jwt.sign(
      {
        userId: account.MaTK,
        username: account.TenTK,
        role: account.MaQuyen
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const accountData = account.toJSON();
    const { MatKhau: _, ...userWithoutPassword } = accountData;

    return {
      token,
      user: userWithoutPassword,
      expiresIn: 3600
    };
  }

  /**
   * Customer login
   */
  async customerLogin(email, password) {
    const user = await KhachHang.findOne({
      where: { email },
      attributes: ['makh', 'tenkh', 'email', 'matkhau']
    });

    if (!user || !(await bcrypt.compare(password, user.matkhau))) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    const accessToken = generateToken(user.makh, 'customer');
    const refreshToken = generateRefreshToken(user.makh, 'customer');

    return {
      user: { makh: user.makh, tenkh: user.tenkh, email: user.email },
      token: accessToken,
      refreshToken
    };
  }

  /**
   * Send registration OTP
   */
  async sendOTP(email, tenkh) {
    const existing = await KhachHang.findOne({ where: { email } });
    if (existing) throw new AppError('Email đã được sử dụng', 409);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');

    await OtpRequest.upsert({
      email, otp, token, type: 'register'
    });

    await sendOTPEmail(email, otp);
    return token;
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email, otp, token, type = 'register') {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const otpRecord = await OtpRequest.findOne({
      where: {
        email,
        token,
        otp,
        type,
        created_at: { [Op.gt]: tenMinutesAgo }
      }
    });

    if (!otpRecord) throw new AppError('OTP không hợp lệ hoặc đã hết hạn', 400);

    await OtpRequest.destroy({ where: { email, token } });
    return true;
  }

  /**
   * Complete registration (set password)
   */
  async setPassword(data) {
    const { email, tenkh, matkhau, sdt, diachi } = data;
    const hashedPassword = await bcrypt.hash(matkhau, 10);

    const customer = await KhachHang.create({
      tenkh, email, matkhau: hashedPassword,
      sdt: sdt || null, diachi: diachi || null
    });

    return {
      user: { makh: customer.makh, tenkh, email },
      token: generateToken(customer.makh, 'customer'),
      refreshToken: generateRefreshToken(customer.makh, 'customer')
    };
  }

  /**
   * Send forgot-password OTP
   */
  async sendForgotOTP(email) {
    const user = await KhachHang.findOne({
      where: { email },
      attributes: ['makh', 'tenkh']
    });
    if (!user) throw new AppError('Email không tồn tại', 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');

    await OtpRequest.upsert({
      email, otp, token, type: 'forgot-password'
    });

    await sendOTPEmail(email, otp);
    return token;
  }

  /**
   * Verify forgot-password OTP
   */
  async verifyForgotOTP(email, otp, token) {
    await this.verifyOTP(email, otp, token, 'forgot-password');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);

    await KhachHang.update(
      { reset_token: resetToken, reset_token_expires: oneHourLater },
      { where: { email } }
    );

    return resetToken;
  }

  /**
   * Reset password
   */
  async resetPassword(email, matkhau, resetToken) {
    const user = await KhachHang.findOne({
      where: {
        email,
        reset_token: resetToken,
        reset_token_expires: { [Op.gt]: new Date() }
      },
      attributes: ['makh']
    });
    if (!user) throw new AppError('Reset token không hợp lệ hoặc đã hết hạn', 400);

    const hashedPassword = await bcrypt.hash(matkhau, 10);
    await user.update({
      matkhau: hashedPassword,
      reset_token: null,
      reset_token_expires: null
    });
    return true;
  }

  /**
   * Change password
   */
  async changePassword(makh, oldPass, newPass) {
    const user = await KhachHang.findByPk(makh, { attributes: ['makh', 'matkhau'] });
    if (!user || !(await bcrypt.compare(oldPass, user.matkhau))) {
      throw new AppError('Mật khẩu cũ không đúng', 400);
    }

    const hashed = await bcrypt.hash(newPass, 10);
    await user.update({ matkhau: hashed });
    return true;
  }

  /**
   * Google OAuth login/registration
   */
  async googleAuth(idToken) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      const googleId = payload.sub;
      const email = payload.email;
      const name = payload.name;
      const picture = payload.picture;

      logger.info('Google token verified', { email, name });

      let customer = await KhachHang.findOne({ where: { email } });

      if (customer) {
        // User exists - log in
        if (!customer.google_id) {
          await customer.update({ google_id: googleId });
        }
      } else {
        // New user - auto-register
        logger.info('New Google user, auto-registering', { email });

        customer = await KhachHang.create({
          email,
          tenkh: name || email.split('@')[0],
          matkhau: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
          google_id: googleId,
          avatar: picture || null
        });
      }

      // Generate JWT tokens
      const token = jwt.sign(
        {
          userId: customer.makh,
          makh: customer.makh,
          email: customer.email,
          tenkh: customer.tenkh,
          userType: 'customer',
          loyalty_tier: customer.loyalty_tier || 0,
          loyalty_points: customer.loyalty_points || 0
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { userId: customer.makh, userType: 'customer' },
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
          sdt: customer.sdt,
          avatar: customer.avatar || picture,
          loyalty_tier: customer.loyalty_tier || 0,
          loyalty_points: customer.loyalty_points || 0
        }
      };
    } catch (error) {
      logger.error('Google Auth error', { message: error.message });
      if (error.message?.includes('Token used too late')) {
        throw new AppError('Google token đã hết hạn, vui lòng đăng nhập lại', 401);
      }
      throw new AppError('Xác thực Google thất bại: ' + error.message, 401);
    }
  }
}

export default new AuthService();
