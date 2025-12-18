import express from 'express';
import { getAllOrders, updateOrderStatus, getOrderById } from '../controller/OrderController.js';
import { verifyToken, checkAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * Admin Order Management Routes
 * Base path: /api/admin/orders
 * All routes require: verifyToken + checkAdmin
 */

// GET /api/admin/orders - Lấy tất cả đơn hàng (có filter, pagination)
router.get('/', verifyToken, checkAdmin, getAllOrders);

// GET /api/admin/orders/stats - Thống kê đơn hàng
router.get('/stats', verifyToken, checkAdmin, async (req, res) => {
    try {
        const db = (await import('../models/index.js')).default;
        const { Op } = await import('sequelize');

        const period = req.query.period || 'month'; // today, week, month, year, custom
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        // Build date filter
        let dateFilter = {};
        const now = new Date();

        if (period === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = {
                createdAt: {
                    [Op.gte]: today
                }
            };
        } else if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = {
                createdAt: {
                    [Op.gte]: weekAgo
                }
            };
        } else if (period === 'month') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = {
                createdAt: {
                    [Op.gte]: monthStart
                }
            };
        } else if (period === 'year') {
            const yearStart = new Date(now.getFullYear(), 0, 1);
            dateFilter = {
                createdAt: {
                    [Op.gte]: yearStart
                }
            };
        } else if (period === 'custom' && startDate && endDate) {
            dateFilter = {
                createdAt: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                }
            };
        }

        // Get all orders with filter
        const orders = await db.Order.findAll({
            where: dateFilter,
            include: [{
                model: db.OrderDetail,
                as: 'OrderDetails',
                include: [{
                    model: db.Product,
                    as: 'product',
                    attributes: ['id', 'title']
                }]
            }]
        });

        // Calculate summary
        const summary = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0),
            averageOrderValue: 0,
            totalProducts: orders.reduce((sum, order) => sum + (order.quantity || 0), 0)
        };

        if (summary.totalOrders > 0) {
            summary.averageOrderValue = Math.round(summary.totalRevenue / summary.totalOrders);
        }

        // By status
        const byStatus = {};
        const statusMap = {
            'pending': 'pending',
            'processing': 'processing',
            'confirmed': 'confirmed',
            'shipping': 'shipping',
            'delivered': 'delivered',
            'completed': 'completed',
            'cancelled': 'cancelled'
        };

        Object.keys(statusMap).forEach(status => {
            const statusOrders = orders.filter(o => o.status === status);
            byStatus[status] = {
                count: statusOrders.length,
                revenue: statusOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0)
            };
        });

        // By payment method
        const byPaymentMethod = {
            cod: { count: 0, revenue: 0 },
            vnpay: { count: 0, revenue: 0 },
            momo: { count: 0, revenue: 0 },
            bank: { count: 0, revenue: 0 }
        };

        orders.forEach(order => {
            const amount = parseFloat(order.totalAmount || 0);
            switch (order.typePayment) {
                case 1:
                    byPaymentMethod.cod.count++;
                    byPaymentMethod.cod.revenue += amount;
                    break;
                case 2:
                    byPaymentMethod.vnpay.count++;
                    byPaymentMethod.vnpay.revenue += amount;
                    break;
                case 3:
                    byPaymentMethod.momo.count++;
                    byPaymentMethod.momo.revenue += amount;
                    break;
                case 4:
                    byPaymentMethod.bank.count++;
                    byPaymentMethod.bank.revenue += amount;
                    break;
            }
        });

        // Top products
        const productMap = {};
        orders.forEach(order => {
            order.OrderDetails?.forEach(detail => {
                const productId = detail.productId;
                if (!productMap[productId]) {
                    productMap[productId] = {
                        productId: productId,
                        productName: detail.product?.title || 'Unknown',
                        soldQuantity: 0,
                        revenue: 0
                    };
                }
                productMap[productId].soldQuantity += detail.quantity;
                productMap[productId].revenue += parseFloat(detail.price) * detail.quantity;
            });
        });

        const topProducts = Object.values(productMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Revenue by day (last 7 days)
        const revenueByDay = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            const dayOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= dayStart && orderDate < dayEnd;
            });

            revenueByDay.push({
                date: dateStr,
                revenue: dayOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0),
                orderCount: dayOrders.length
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Lấy thống kê đơn hàng thành công',
            data: {
                summary,
                byStatus,
                byPaymentMethod,
                topProducts,
                revenueByDay
            }
        });

    } catch (error) {
        console.error('Get order stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê đơn hàng',
            error: error.message
        });
    }
});

// PUT /api/admin/orders/:id/status - Cập nhật trạng thái đơn hàng (phải đặt TRƯỚC /:id)
router.put('/:id/status', verifyToken, checkAdmin, updateOrderStatus);

// PUT /api/admin/orders/:id/payment-status - Cập nhật trạng thái thanh toán của đơn hàng
router.put('/:id/payment-status', verifyToken, checkAdmin, async (req, res, next) => {
    // Lazy import controller function to avoid circular deps
    try {
        const { updatePaymentStatus } = await import('../controller/OrderController.js');
        return updatePaymentStatus(req, res, next);
    } catch (err) {
        next(err);
    }
});

// GET /api/admin/orders/:id - Lấy chi tiết 1 đơn hàng bất kỳ (đặt sau /stats và /:id/status)
router.get('/:id', verifyToken, checkAdmin, getOrderById);

export default router;
