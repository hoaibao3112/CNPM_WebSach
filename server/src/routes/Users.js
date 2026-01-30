import express from 'express';
import AccountController from '../controllers/AccountController.js';
import { authenticateToken } from '../middlewares/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer setup for employee images
const uploadDir = path.join(process.cwd(), 'uploads', 'nhanvien');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.get('/', AccountController.getAllEmployees);
router.get('/me', authenticateToken, AccountController.getMe);
router.get('/:id', AccountController.getEmployeeById);
router.post('/', upload.single('Anh'), AccountController.createEmployee);
router.put('/:id', upload.single('Anh'), AccountController.updateEmployee);
router.delete('/:id', AccountController.deleteEmployee);

export default router;