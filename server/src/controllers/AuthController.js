import AuthService from '../services/AuthService.js';
import baseController from './baseController.js';

class AuthController {
    async login(req, res) {
        try {
            const { TenTK, MatKhau, email, matkhau } = req.body;

            // Handle both Admin (TenTK) and Customer (email) logins
            if (email) {
                const result = await AuthService.customerLogin(email, matkhau);
                return baseController.sendSuccess(res, result, 'Đăng nhập thành công');
            }

            if (!TenTK || !MatKhau) {
                return baseController.sendError(res, 'Vui lòng cung cấp tên tài khoản và mật khẩu', 400);
            }

            const result = await AuthService.login(TenTK, MatKhau);
            return baseController.sendSuccess(res, result, 'Đăng nhập thành công');
        } catch (error) {
            const status = error.message.includes('không chính xác') || error.message.includes('không đúng') ? 401 : 500;
            return baseController.sendError(res, error.message, status);
        }
    }

    async sendOTP(req, res) {
        try {
            const { email, tenkh } = req.body;
            const token = await AuthService.sendOTP(email, tenkh);
            return baseController.sendSuccess(res, { token }, 'OTP đã được gửi đến email của bạn');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async verifyOTP(req, res) {
        try {
            const { email, otp, token } = req.body;
            await AuthService.verifyOTP(email, otp, token);
            return baseController.sendSuccess(res, { verified: true }, 'OTP xác thực thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async setPassword(req, res) {
        try {
            const result = await AuthService.setPassword(req.body);
            return baseController.sendSuccess(res, result, 'Đăng ký thành công', 201);
        } catch (error) {
            return baseController.sendError(res, error.message, 500);
        }
    }

    async sendForgotOTP(req, res) {
        try {
            const { email } = req.body;
            const token = await AuthService.sendForgotOTP(email);
            return baseController.sendSuccess(res, { token }, 'OTP đã được gửi đến email của bạn');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async verifyForgotOTP(req, res) {
        try {
            const { email, otp, token } = req.body;
            const resetToken = await AuthService.verifyForgotOTP(email, otp, token);
            return baseController.sendSuccess(res, { resetToken }, 'OTP xác thực thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async resetPassword(req, res) {
        try {
            const { email, matkhau, resetToken } = req.body;
            await AuthService.resetPassword(email, matkhau, resetToken);
            return baseController.sendSuccess(res, null, 'Đặt lại mật khẩu thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 500);
        }
    }

    async changePassword(req, res) {
        try {
            const { matkhau_cu, matkhau_moi } = req.body;
            await AuthService.changePassword(req.user.makh, matkhau_cu, matkhau_moi);
            return baseController.sendSuccess(res, null, 'Đổi mật khẩu thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async googleAuth(req, res) {
        try {
            const { id_token } = req.body;

            if (!id_token) {
                return baseController.sendError(res, 'Thiếu Google ID token', 400);
            }

            const result = await AuthService.googleAuth(id_token);
            return baseController.sendSuccess(res, result, 'Đăng nhập Google thành công');

        } catch (error) {
            console.error('Google Auth error:', error);
            return baseController.sendError(res, error.message || 'Lỗi xác thực Google', 500);
        }
    }

    async logout(req, res) {
        return baseController.sendSuccess(res, null, 'Đăng xuất thành công');
    }
}

export default new AuthController();
