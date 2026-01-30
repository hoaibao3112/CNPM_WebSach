import AccountService from '../services/AccountService.js';
import baseController from './baseController.js';
import path from 'path';
import fs from 'fs';

class AccountController {
    // Account Handlers
    async getAllAccounts(req, res) {
        try {
            const accounts = await AccountService.getAllAccounts();
            return baseController.sendSuccess(res, accounts);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách tài khoản', 500, error.message);
        }
    }

    async getAccountById(req, res) {
        try {
            const account = await AccountService.getAccountById(req.params.id);
            return baseController.sendSuccess(res, account);
        } catch (error) {
            return baseController.sendError(res, error.message, 404);
        }
    }

    async createAccount(req, res) {
        try {
            const id = await AccountService.createAccount(req.body);
            return baseController.sendSuccess(res, { MaTK: id }, 'Thêm tài khoản thành công', 201);
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async updateAccount(req, res) {
        try {
            await AccountService.updateAccount(req.params.id, req.body);
            return baseController.sendSuccess(res, null, 'Cập nhật tài khoản thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async deleteAccount(req, res) {
        try {
            await AccountService.deleteAccount(req.params.id);
            return baseController.sendSuccess(res, null, 'Xóa tài khoản thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.userId;
            if (!oldPassword || !newPassword) return baseController.sendError(res, 'Thiếu thông tin mật khẩu', 400);

            await AccountService.changePassword(userId, oldPassword, newPassword);
            return baseController.sendSuccess(res, null, 'Đổi mật khẩu thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    // Employee & Profile Handlers
    async getMe(req, res) {
        try {
            const profile = await AccountService.getProfile(req.user.userId);
            return baseController.sendSuccess(res, profile);
        } catch (error) {
            return baseController.sendError(res, error.message, 404);
        }
    }

    async getAllEmployees(req, res) {
        try {
            const employees = await AccountService.getAllEmployees();
            return baseController.sendSuccess(res, employees);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách nhân viên', 500, error.message);
        }
    }

    async getEmployeeById(req, res) {
        try {
            const employee = await AccountService.getEmployeeById(req.params.id);
            return baseController.sendSuccess(res, employee);
        } catch (error) {
            return baseController.sendError(res, error.message, 404);
        }
    }

    async createEmployee(req, res) {
        try {
            const imagePath = req.file ? `/uploads/nhanvien/${req.file.filename}` : null;
            const id = await AccountService.createEmployee({ ...req.body, Anh: imagePath });
            return baseController.sendSuccess(res, { MaNV: id }, 'Thêm nhân viên thành công!', 201);
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async updateEmployee(req, res) {
        try {
            const imagePath = req.file ? `/uploads/nhanvien/${req.file.filename}` : null;
            await AccountService.updateEmployee(req.params.id, { ...req.body, Anh: imagePath });
            return baseController.sendSuccess(res, null, 'Cập nhật nhân viên thành công!');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async deleteEmployee(req, res) {
        try {
            const image = await AccountService.deleteEmployee(req.params.id);
            if (image) {
                const imgPath = path.join(process.cwd(), image);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }
            return baseController.sendSuccess(res, null, 'Xóa nhân viên thành công!');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }
}

export default new AccountController();
