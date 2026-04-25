import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ProductController from '../controllers/ProductController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbacMiddleware.js';

import AuthorController from '../controllers/AuthorController.js';
import CategoryController from '../controllers/CategoryController.js';

const router = express.Router();

// Public routes
router.get('/', ProductController.getAll);
router.get('/new', ProductController.getNew); // Get new products
router.get('/promotion', ProductController.getPromotionProducts); // Get promotion products

// Aliases for Product Management
router.get('/authors', AuthorController.getAll);
router.get('/categories', CategoryController.getAll);
router.get('/suppliers', (req, res) => res.redirect('/api/company')); // Redirect to company API

router.get('/sorted/:type', ProductController.getSorted);
router.get('/category/:id', ProductController.getByCategory);
router.get('/recommendations', ProductController.getRecommendations);
router.get('/low-stock', authenticateToken, authorize('PRODUCT_READ'), ProductController.getLowStock);
router.get('/:id', ProductController.getById);

// Multer setup for product images
const uploadDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const handleProductUploads = upload.fields([
  { name: 'HinhAnh', maxCount: 1 },
  { name: 'ExtraImages', maxCount: 10 }
]);

// Helper to map files to body
const processFiles = (req, res, next) => {
  if (req.files) {
    if (req.files['HinhAnh'] && req.files['HinhAnh'].length > 0) {
      req.body.HinhAnh = req.files['HinhAnh'][0].filename;
    }
    if (req.files['ExtraImages'] && req.files['ExtraImages'].length > 0) {
      req.body.ExtraImages = req.files['ExtraImages'].map(f => f.filename);
    }
  }
  next();
};

// Admin routes
router.post('/', authenticateToken, authorize('PRODUCT_CREATE'), handleProductUploads, processFiles, ProductController.create);
router.put('/:id', authenticateToken, authorize('PRODUCT_UPDATE'), handleProductUploads, processFiles, ProductController.update);
router.patch('/:id/min-stock', authenticateToken, authorize('PRODUCT_UPDATE'), ProductController.updateMinStock);
router.delete('/:id', authenticateToken, authorize('PRODUCT_DELETE'), ProductController.delete);

export default router;