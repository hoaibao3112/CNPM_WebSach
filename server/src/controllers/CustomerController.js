import CustomerService from '../services/CustomerService.js';
import baseController from './baseController.js';

class CustomerController {
    async getProfile(req, res) {
        try {
            const makh = req.user.makh;
            const profile = await CustomerService.getProfile(makh);
            return baseController.sendSuccess(res, profile);
        } catch (error) {
            return baseController.sendError(res, error.message, 404);
        }
    }

    async updateProfile(req, res) {
        try {
            const makh = req.user.makh;
            await CustomerService.updateProfile(makh, req.body);
            return baseController.sendSuccess(res, null, 'Cập nhật profile thành công');
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi cập nhật profile', 500, error.message);
        }
    }

    async getPromoUsage(req, res) {
        try {
            const makh = req.params.makh || req.user?.makh;
            const usage = await CustomerService.getPromoUsage(makh);
            return baseController.sendSuccess(res, usage);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy thông tin khuyến mãi', 500, error.message);
        }
    }

    async getPromoList(req, res) {
        try {
            const makh = req.params.makh || req.user?.makh;
            const list = await CustomerService.getPromoList(makh);
            return baseController.sendSuccess(res, list);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách khuyến mãi', 500, error.message);
        }
    }

    async logView(req, res) {
        try {
            const { maSanPham } = req.body;
            const makh = req.user?.makh; // Always from JWT, never from client body
            await CustomerService.logActivity(makh, 'view', { masanpham: maSanPham });
            return baseController.sendSuccess(res, null, 'Ghi nhận hành động xem thành công', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi server', 500, error.message);
        }
    }

    async logSearch(req, res) {
        try {
            const { query } = req.body;
            const makh = req.user?.makh; // Always from JWT, never from client body
            await CustomerService.logActivity(makh, 'search', { query });
            return baseController.sendSuccess(res, null, 'Ghi nhận hành động tìm kiếm thành công', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi server', 500, error.message);
        }
    }

    async getAllCustomers(req, res) {
        try {
            const result = await CustomerService.getAllCustomers(req.query);
            return baseController.sendSuccess(res, result);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách khách hàng', 500, error.message);
        }
    }

    async toggleStatus(req, res) {
        try {
            const { makh } = req.params;
            const { tinhtrang } = req.body;
            await CustomerService.toggleStatus(makh, tinhtrang);
            return baseController.sendSuccess(res, null, 'Cập nhật trạng thái thành công');
        } catch (error) {
            return baseController.sendError(res, 'Lỗi cập nhật trạng thái', 500, error.message);
        }
    }
}

export default new CustomerController();
