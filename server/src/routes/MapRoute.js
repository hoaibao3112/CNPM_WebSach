import express from 'express';
import SpecialController from '../controllers/SpecialController.js';

const router = express.Router();

router.get('/geocode', SpecialController.geocode);

export default router;