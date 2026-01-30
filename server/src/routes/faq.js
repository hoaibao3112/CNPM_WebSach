import express from 'express';
import FAQController from '../controllers/FAQController.js';

const router = express.Router();

router.get('/faq', FAQController.getAll);
router.post('/faq', FAQController.create);
router.put('/faq/:id', FAQController.update);
router.delete('/faq/:id', FAQController.delete);

export default router;