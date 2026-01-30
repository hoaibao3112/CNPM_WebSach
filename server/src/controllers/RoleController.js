import RoleService from '../services/RoleService.js';
import baseController from './baseController.js';

class RoleController {
    async getAllFunctions(req, res) {
        try {
            const funcs = await RoleService.getAllFunctions();
            return baseController.sendSuccess(res, funcs);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi lấy danh sách chức năng', 500, error.message);
        }
    }

    async createRole(req, res) {
        try {
            const id = await RoleService.createRole(req.body);
            return baseController.sendSuccess(res, { MaQuyen: id }, 'Thêm nhóm quyền thành công', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi thêm nhóm quyền', 500, error.message);
        }
    }

    async getById(req, res) {
        try {
            const role = await RoleService.getRoleById(req.params.id);
            return baseController.sendSuccess(res, role);
        } catch (error) {
            return baseController.sendError(res, error.message, 404);
        }
    }

    async getAllRoles(req, res) {
        try {
            const roles = await RoleService.getAllRoles();
            return baseController.sendSuccess(res, roles);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi lấy danh sách nhóm quyền', 500, error.message);
        }
    }

    async updateRole(req, res) {
        try {
            await RoleService.updateRole(req.params.id, req.body);
            return baseController.sendSuccess(res, null, 'Cập nhật nhóm quyền thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async deleteRole(req, res) {
        try {
            await RoleService.deleteRole(req.params.id);
            return baseController.sendSuccess(res, null, 'Xóa nhóm quyền thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    // Get active roles for dropdown selections
    async getActiveRoles(req, res) {
        try {
            const roles = await RoleService.getActiveRoles();
            return baseController.sendSuccess(res, roles);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi lấy danh sách nhóm quyền hoạt động', 500, error.message);
        }
    }

    async getUserPermissions(req, res) {
        try {
            const roleId = req.user.role;
            const permissions = await RoleService.getUserPermissions(roleId);
            return baseController.sendSuccess(res, permissions);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi lấy quyền người dùng', 500, error.message);
        }
    }
}

export default new RoleController();
