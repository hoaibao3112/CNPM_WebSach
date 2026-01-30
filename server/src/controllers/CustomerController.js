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
            const { maSanPham, makh } = req.body;
            await CustomerService.logActivity(makh, 'view', { masanpham: maSanPham });
            return baseController.sendSuccess(res, null, 'Ghi nhận hành động xem thành công', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi server', 500, error.message);
        }
    }

    async logSearch(req, res) {
        try {
            const { query, makh } = req.body;
            await CustomerService.logActivity(makh, 'search', { query });
            return baseController.sendSuccess(res, null, 'Ghi nhận hành động tìm kiếm thành công', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi server', 500, error.message);
        }
    }
}

export default new CustomerController();
