import express from 'express';
import ReceiptController from '../controllers/ReceiptController.js';

const router = express.Router();

router.get('/', ReceiptController.getAll);
router.get('/search', ReceiptController.search);
router.get('/:id', ReceiptController.getById);
router.post('/', ReceiptController.create);

export default router;