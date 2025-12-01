import express from 'express';
import { checkout, getUserOrders, getOrderById, getAllOrders, updateOrderStatus } from '../controller/OrderController.js';
import { verifyToken, checkAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin routes - phải đặt trước các routes có param động
router.get('/admin/all', verifyToken, checkAdmin, getAllOrders);              // Admin: Lấy tất cả đơn hàng
router.put('/:id/status', verifyToken, checkAdmin, updateOrderStatus);       // Admin: Cập nhật trạng thái đơn hàng

// User routes
router.post('/checkout', verifyToken, checkout);           // Đặt hàng
router.get('/', verifyToken, getUserOrders);               // Lấy danh sách đơn hàng của user
router.get('/:id', verifyToken, getOrderById);             // Lấy chi tiết 1 đơn hàng

export default router;
