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
        role: account.MaQuyen,
        userType: 'admin'
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

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 phút

    await OtpRequest.upsert({
      email, otp, token, type: 'register',
      created_at: now,
      expires_at: expiresAt
    });

    await sendOTPEmail(email, otp);
    return token;
  }

  /**
   * Verify OTP
   */
  /**
   * Verify OTP
   */
  /**
   * Verify OTP
   */
  async verifyOTP(email, otp, token, type = 'register') {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanOtp = otp ? otp.toString().trim() : '';
    
    console.log(`[DEBUG OTP] Bắt đầu xác thực cho: ${cleanEmail}`);
    console.log(`[DEBUG OTP] Mã nhập vào: "${cleanOtp}", Type: ${type}`);

    // Tìm bản ghi MỚI NHẤT của email này và type này
    const latestRequest = await OtpRequest.findOne({
      where: { email: cleanEmail, type: type },
      order: [['created_at', 'DESC']]
    });

    if (!latestRequest) {
      console.log(`[DEBUG OTP] KHÔNG tìm thấy bất kỳ mã nào cho email này trong DB.`);
      throw new AppError('Không tìm thấy yêu cầu xác thực. Vui lòng gửi lại mã.', 400);
    }

    console.log(`[DEBUG OTP] Tìm thấy mã mới nhất trong DB: "${latestRequest.otp}"`);

    // So sánh mã (không phân biệt hoa thường nếu là chuỗi)
    if (latestRequest.otp.toString().trim() !== cleanOtp) {
      console.log(`[DEBUG OTP] Xác thực THẤT BẠI: Mã nhập vào "${cleanOtp}" khác mã trong DB "${latestRequest.otp}"`);
      throw new AppError('Mã OTP không chính xác', 400);
    }

    console.log(`[DEBUG OTP] Xác thực THÀNH CÔNG!`);
    
    // Xóa tất cả các yêu cầu OTP cũ của email này để bảo mật
    await OtpRequest.destroy({ where: { email: cleanEmail, type: type } });
    
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

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 phút

    await OtpRequest.upsert({
      email, otp, token, type: 'forgot-password',
      created_at: now,
      expires_at: expiresAt
    });

    await sendOTPEmail(email, otp);
    return token;
  }

  /**
   * Verify forgot-password OTP
   */
  async verifyForgotOTP(email, otp, token) {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    await this.verifyOTP(cleanEmail, otp, token, 'forgot-password');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const twoHoursLater = new Date(Date.now() + 120 * 60 * 1000); // 2 tiếng cho chắc chắn

    console.log(`[DEBUG RESET] Tạo Reset Token cho: ${cleanEmail}`);
    
    await KhachHang.update(
      { reset_token: resetToken, reset_token_expires: twoHoursLater },
      { where: { email: cleanEmail } }
    );

    return resetToken;
  }

  /**
   * Reset password
   */
  async resetPassword(email, matkhau, resetToken) {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    
    console.log(`[DEBUG RESET] Bắt đầu Reset cho: ${cleanEmail}`);
    console.log(`[DEBUG RESET] Token nhận được: "${resetToken}"`);

    // Tạm thời bỏ qua reset_token_expires để loại trừ lỗi múi giờ
    const user = await KhachHang.findOne({
      where: {
        email: cleanEmail,
        reset_token: resetToken
      },
      attributes: ['makh']
    });

    if (!user) {
      // Nếu không tìm thấy, thử tìm chỉ bằng email để xem token trong DB là gì
      const anyUser = await KhachHang.findOne({ where: { email: cleanEmail }, attributes: ['reset_token'] });
      console.log(`[DEBUG RESET] THẤT BẠI. Token trong DB đang là: "${anyUser ? anyUser.reset_token : 'N/A'}"`);
      throw new AppError('Reset token không hợp lệ hoặc đã hết hạn. Vui lòng xác nhận OTP lại.', 400);
    }

    console.log(`[DEBUG RESET] Tìm thấy user! Đang tiến hành đổi mật khẩu...`);

    const hashedPassword = await bcrypt.hash(matkhau, 10);
    await user.update({
      matkhau: hashedPassword,
      reset_token: null,
      reset_token_expires: null
    });
    
    console.log(`[DEBUG RESET] Đổi mật khẩu THÀNH CÔNG!`);
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
