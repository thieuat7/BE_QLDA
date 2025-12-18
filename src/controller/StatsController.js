import db from '../models/index.js';
import { Op } from 'sequelize';

/**
 * GET /api/stats/overview (Admin)
 * Tổng quan dashboard: Doanh thu, Đơn hàng, User
 */
export const getOverview = async (req, res) => {
    try {
        // 1. Tổng doanh thu (chỉ đơn đã thanh toán)
        const revenueResult = await db.Order.findOne({
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('totalAmount')), 'totalRevenue'],
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalPaidOrders']
            ],
            where: {
                paymentStatus: 'paid'
            },
            raw: true
        });

        // 2. Tổng số đơn hàng (tất cả trạng thái)
        const totalOrders = await db.Order.count();

        // 3. Đơn hàng theo status
        const ordersByStatus = await db.Order.findAll({
            attributes: [
                'status',
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        // 4. Đơn hàng theo payment status
        const ordersByPaymentStatus = await db.Order.findAll({
            attributes: [
                'paymentStatus',
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
            ],
            group: ['paymentStatus'],
            raw: true
        });

        // 5. Tổng số user
        const totalUsers = await db.User.count();

        // 6. Tổng số sản phẩm
        const totalProducts = await db.Product.count();

        // 7. Tổng số mã giảm giá
        const totalDiscounts = await db.Discount.count();

        // 8. Doanh thu tháng này
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const monthRevenue = await db.Order.findOne({
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('totalAmount')), 'revenue']
            ],
            where: {
                paymentStatus: 'paid',
                createdAt: {
                    [Op.gte]: startOfMonth
                }
            },
            raw: true
        });

        // 9. Doanh thu hôm nay
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayRevenue = await db.Order.findOne({
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('totalAmount')), 'revenue']
            ],
            where: {
                paymentStatus: 'paid',
                createdAt: {
                    [Op.gte]: startOfDay
                }
            },
            raw: true
        });

        // Format response
        const statusMap = {
            1: 'processing',
            2: 'shipping',
            3: 'delivered',
            4: 'cancelled'
        };

        return res.status(200).json({
            success: true,
            message: 'Lấy thống kê tổng quan thành công',
            data: {
                revenue: {
                    total: parseFloat(revenueResult?.totalRevenue || 0),
                    today: parseFloat(todayRevenue?.revenue || 0),
                    thisMonth: parseFloat(monthRevenue?.revenue || 0)
                },
                orders: {
                    total: totalOrders,
                    paid: parseInt(revenueResult?.totalPaidOrders || 0),
                    byStatus: ordersByStatus.reduce((acc, item) => {
                        acc[statusMap[item.status] || item.status] = parseInt(item.count);
                        return acc;
                    }, {}),
                    byPaymentStatus: ordersByPaymentStatus.reduce((acc, item) => {
                        acc[item.paymentStatus] = parseInt(item.count);
                        return acc;
                    }, {})
                },
                users: {
                    total: totalUsers
                },
                products: {
                    total: totalProducts
                },
                discounts: {
                    total: totalDiscounts
                }
            }
        });

    } catch (error) {
        console.error('Get overview stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê tổng quan',
            error: error.message
        });
    }
};

/**
 * GET /api/stats/revenue-chart (Admin)
 * Biểu đồ doanh thu theo ngày (7 hoặc 30 ngày gần nhất)
 */
export const getRevenueChart = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7; // Mặc định 7 ngày

        if (![7, 30].includes(days)) {
            return res.status(400).json({
                success: false,
                message: 'Tham số days chỉ chấp nhận 7 hoặc 30'
            });
        }

        // Tính ngày bắt đầu
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Lấy doanh thu theo ngày
        const revenueByDay = await db.Order.findAll({
            attributes: [
                [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
                [db.sequelize.fn('SUM', db.sequelize.col('totalAmount')), 'revenue'],
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'orderCount']
            ],
            where: {
                paymentStatus: 'paid',
                createdAt: {
                    [Op.gte]: startDate
                }
            },
            group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt'))],
            order: [[db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC']],
            raw: true
        });

        // Tạo mảng đầy đủ các ngày (bao gồm ngày không có doanh thu)
        const chartData = [];
        for (let i = 0; i < days; i++) {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() - (days - 1 - i));
            const dateString = currentDate.toISOString().split('T')[0];

            const dayData = revenueByDay.find(item => item.date === dateString);

            chartData.push({
                date: dateString,
                revenue: parseFloat(dayData?.revenue || 0),
                orderCount: parseInt(dayData?.orderCount || 0)
            });
        }

        // Tính tổng
        const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
        const totalOrders = chartData.reduce((sum, item) => sum + item.orderCount, 0);
        const averageRevenue = totalOrders > 0 ? totalRevenue / days : 0;

        return res.status(200).json({
            success: true,
            message: `Lấy dữ liệu doanh thu ${days} ngày thành công`,
            data: {
                chartData: chartData,
                summary: {
                    days: days,
                    totalRevenue: totalRevenue,
                    totalOrders: totalOrders,
                    averageRevenuePerDay: averageRevenue
                }
            }
        });

    } catch (error) {
        console.error('Get revenue chart error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu biểu đồ doanh thu',
            error: error.message
        });
    }
};

/**
 * GET /api/stats/top-products (Admin)
 * Top 5 sản phẩm bán chạy nhất
 */
export const getTopProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        // Lấy top sản phẩm từ OrderDetails
        const topProducts = await db.OrderDetail.findAll({
            attributes: [
                'productId',
                [db.sequelize.fn('SUM', db.sequelize.col('OrderDetail.quantity')), 'totalSold'],
                [db.sequelize.fn('SUM', db.sequelize.literal('OrderDetail.price * OrderDetail.quantity')), 'totalRevenue'],
                [db.sequelize.fn('COUNT', db.sequelize.col('OrderDetail.orderId')), 'orderCount']
            ],
            include: [
                {
                    model: db.Product,
                    as: 'product',
                    attributes: ['id', 'title', 'image', 'price', 'priceSale', 'productCode'],
                    include: [
                        {
                            model: db.ProductCategory,
                            as: 'category',
                            attributes: ['id', 'title']
                        }
                    ]
                },
                {
                    model: db.Order,
                    as: 'order',
                    attributes: [],
                    where: {
                        paymentStatus: 'paid' // Chỉ tính đơn đã thanh toán
                    }
                }
            ],
            group: ['productId', 'product.id', 'product->category.id'],
            order: [[db.sequelize.literal('totalSold'), 'DESC']],
            limit: limit,
            subQuery: false
        });

        // Format response
        const formattedData = topProducts.map((item, index) => ({
            rank: index + 1,
            product: {
                id: item.product.id,
                title: item.product.title,
                image: item.product.image,
                price: item.product.price,
                priceSale: item.product.priceSale,
                productCode: item.product.productCode,
                category: item.product.category
            },
            stats: {
                totalSold: parseInt(item.dataValues.totalSold),
                totalRevenue: parseFloat(item.dataValues.totalRevenue),
                orderCount: parseInt(item.dataValues.orderCount)
            }
        }));

        return res.status(200).json({
            success: true,
            message: `Lấy top ${limit} sản phẩm bán chạy thành công`,
            data: {
                topProducts: formattedData
            }
        });

    } catch (error) {
        console.error('Get top products error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy top sản phẩm',
            error: error.message
        });
    }
};

/**
 * GET /api/stats/recent-orders (Admin)
 * Đơn hàng gần đây (bonus)
 */
export const getRecentOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const recentOrders = await db.Order.findAll({
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'userName', 'email']
                },
                {
                    model: db.OrderDetail,
                    as: 'OrderDetails',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image']
                        }
                    ]
                }
            ],
            limit: limit,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách đơn hàng gần đây thành công',
            data: {
                recentOrders: recentOrders
            }
        });

    } catch (error) {
        console.error('Get recent orders error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy đơn hàng gần đây',
            error: error.message
        });
    }
};
