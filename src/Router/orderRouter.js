import express from 'express';
import { checkout, getUserOrders, getOrderById } from '../controller/OrderController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes yêu cầu đăng nhập
router.post('/checkout', verifyToken, checkout);           // Đặt hàng
router.get('/', verifyToken, getUserOrders);               // Lấy danh sách đơn hàng
router.get('/:id', verifyToken, getOrderById);             // Lấy chi tiết 1 đơn hàng

export default router;
