/**
 * Supplier Routes - Thin route file
 * Mounts: /api/company
 */
import express from 'express';
import SupplierController from '../controllers/Supplier.controller.js';

const router = express.Router();

// IMPORTANT: Specific routes MUST come before parameterized routes
router.get('/search', SupplierController.search);
router.get('/search/advanced', SupplierController.advancedSearch);

// CRUD
router.get('/', SupplierController.getAll);
router.get('/:id', SupplierController.getById);
router.post('/', SupplierController.create);
router.put('/:id', SupplierController.update);
router.delete('/:id', SupplierController.delete);

export default router;