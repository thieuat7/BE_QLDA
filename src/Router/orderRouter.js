import express from 'express';
import { checkout, getOrderById, getOrders, cancelOrder } from '../controller/OrderController_Simple.js';
import { getMyOrders } from '../controller/OrderController.js';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes (cần login)
router.get('/my-orders', verifyToken, getMyOrders);  // Lấy danh sách đơn hàng của user đã login

// Public routes (không cần login để test)
router.post('/checkout', optionalAuth, checkout);    // Tạo đơn hàng (có thể login hoặc không)
router.get('/:id', getOrderById);             // Lấy chi tiết đơn hàng
router.get('/', getOrders);                   // Lấy danh sách đơn hàng (by phone/email)
router.put('/:id/cancel', cancelOrder);       // Hủy đơn hàng

export default router;
