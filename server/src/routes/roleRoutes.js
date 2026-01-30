import express from 'express';
import RoleController from '../controllers/RoleController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbacMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, authorize('ROLE_READ'), RoleController.getAllRoles);
router.get('/functions', authenticateToken, authorize('ROLE_READ'), RoleController.getAllFunctions);
router.get('/list/active', authenticateToken, RoleController.getActiveRoles);
router.post('/', authenticateToken, authorize('ROLE_CREATE'), RoleController.createRole);
router.get('/user/permissions', authenticateToken, RoleController.getUserPermissions);
router.get('/:id', authenticateToken, authorize('ROLE_READ'), RoleController.getById);
router.put('/:id', authenticateToken, authorize('ROLE_UPDATE'), RoleController.updateRole);
router.delete('/:id', authenticateToken, authorize('ROLE_DELETE'), RoleController.deleteRole);

export default router;