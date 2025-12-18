import express from 'express';
import { getVnexpressNews } from '../controllers/VnExpressController.js';

const router = express.Router();

// GET /api/tin-tuc  -> fetch default VNExpress RSS
router.get('/', getVnexpressNews);

export default router;
