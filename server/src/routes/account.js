import express from 'express';
import AccountController from '../controllers/AccountController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', AccountController.getAllAccounts);
router.get('/:id', AccountController.getAccountById);
router.post('/', AccountController.createAccount);
router.put('/change-password', authenticateToken, AccountController.changePassword);
router.put('/:id', AccountController.updateAccount);
router.delete('/:id', AccountController.deleteAccount);

export default router;