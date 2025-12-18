import express from 'express';
import { verifyToken, checkAdmin } from '../middleware/auth.js';
import {
    getUserPaymentHistory,
    getUserOrderDetail,
    getAllPaymentHistory,
    getAdminOrderDetail,
    getPaymentStatistics
} from '../controller/PaymentHistoryController.js';

const router = express.Router();

/**
 * Routes cho User - Xem lịch sử thanh toán của chính mình
 */

// GET /api/payment-history/user
// Lấy danh sách lịch sử thanh toán của user
router.get('/user', verifyToken, getUserPaymentHistory);

// GET /api/payment-history/user/:orderId
// Lấy chi tiết một đơn hàng của user
router.get('/user/:orderId', verifyToken, getUserOrderDetail);

/**
 * Routes cho Admin - Xem tất cả lịch sử thanh toán
 */

// GET /api/payment-history/admin
// Lấy tất cả lịch sử thanh toán (có phân trang, filter, search)
router.get('/admin', verifyToken, checkAdmin, getAllPaymentHistory);

// GET /api/payment-history/admin/statistics
// Lấy thống kê thanh toán
router.get('/admin/statistics', verifyToken, checkAdmin, getPaymentStatistics);

// GET /api/payment-history/admin/:orderId
// Lấy chi tiết một đơn hàng bất kỳ
router.get('/admin/:orderId', verifyToken, checkAdmin, getAdminOrderDetail);

export default router;
