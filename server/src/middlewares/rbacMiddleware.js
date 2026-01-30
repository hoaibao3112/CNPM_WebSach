import RoleService from '../services/RoleService.js';
import baseController from '../controllers/baseController.js';

/**
 * Middleware to check if user has a specific permission
 * @param {string} requiredPermission - Format: RESOURCE_ACTION (e.g., PRODUCT_READ)
 */
export const authorize = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const roleId = req.user.role;
            if (!roleId) {
                return baseController.sendError(res, 'Không tìm thấy vai trò người dùng', 403);
            }

            // Fetch user permissions (RoleService should return standardized keys)
            const permissions = await RoleService.getUserPermissions(roleId);

            // Standardized keys will look like 'PRODUCT_READ'
            const hasAccess = permissions.some(p => p.Key === requiredPermission);

            if (!hasAccess) {
                return baseController.sendError(res, `Bạn không có quyền thực hiện hành động này (${requiredPermission})`, 403);
            }

            next();
        } catch (error) {
            console.error('RBAC Middleware Error:', error);
            return baseController.sendError(res, 'Lỗi kiểm tra quyền hạn', 500, error.message);
        }
    };
};
