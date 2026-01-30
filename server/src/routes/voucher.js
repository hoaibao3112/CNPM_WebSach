import express from "express";
import PromotionController from "../controllers/PromotionController.js";

const router = express.Router();

router.get("/", PromotionController.getAllVouchers);
// Other voucher routes...

export default router;
