import express from 'express';
import {
    getOverview,
    getRevenueChart,
    getTopProducts,
    getRecentOrders
} from '../controller/StatsController.js';
import { verifyToken, checkAdmin } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes yêu cầu Admin
router.get('/overview', verifyToken, checkAdmin, getOverview);              // Tổng quan dashboard
router.get('/revenue-chart', verifyToken, checkAdmin, getRevenueChart);    // Biểu đồ doanh thu
router.get('/top-products', verifyToken, checkAdmin, getTopProducts);      // Top sản phẩm bán chạy
router.get('/recent-orders', verifyToken, checkAdmin, getRecentOrders);    // Đơn hàng gần đây

export default router;
