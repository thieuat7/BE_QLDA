import db from '../models/index.js';
import { Op } from 'sequelize';

/**
 * GET /api/payment-history/user
 * Lấy lịch sử thanh toán của user đang đăng nhập
 */
export const getUserPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            page = 1,
            limit = 10,
            status,
            paymentStatus,
            startDate,
            endDate,
            searchTerm
        } = req.query;

        const offset = (page - 1) * limit;

        // Tạo điều kiện where
        const whereCondition = { userId };

        // Filter theo status đơn hàng
        if (status) {
            whereCondition.status = status;
        }

        // Filter theo paymentStatus
        if (paymentStatus) {
            whereCondition.paymentStatus = paymentStatus;
        }

        // Filter theo khoảng thời gian
        if (startDate || endDate) {
            whereCondition.createdAt = {};
            if (startDate) {
                whereCondition.createdAt[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereCondition.createdAt[Op.lte] = new Date(endDate);
            }
        }

        // Search theo code, customerName, phone
        if (searchTerm) {
            whereCondition[Op.or] = [
                { code: { [Op.like]: `%${searchTerm}%` } },
                { customerName: { [Op.like]: `%${searchTerm}%` } },
                { phone: { [Op.like]: `%${searchTerm}%` } }
            ];
        }

        // Lấy danh sách đơn hàng với phân trang
        const { count, rows: orders } = await db.Order.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: db.OrderDetail,
                    as: 'OrderDetails',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image', 'productCode']
                        }
                    ]
                },
                {
                    model: db.Discount,
                    as: 'discount',
                    attributes: ['id', 'code', 'description', 'type', 'value']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Format dữ liệu trả về
        const formattedOrders = orders.map(order => ({
            id: order.id,
            code: order.code,
            customerName: order.customerName,
            phone: order.phone,
            address: order.address,
            email: order.email,
            totalAmount: parseFloat(order.totalAmount),
            discountValue: parseFloat(order.discountValue || 0),
            finalAmount: parseFloat(order.totalAmount) - parseFloat(order.discountValue || 0),
            quantity: order.quantity,
            typePayment: order.typePayment,
            paymentMethod: order.typePayment === 1
                ? 'COD'
                : order.typePayment === 2
                    ? 'VNPAY'
                    : order.typePayment === 3
                        ? 'MoMo'
                        : order.typePayment === 4
                            ? 'Bank Transfer'
                            : 'Unknown',
            status: order.status,
            paymentStatus: order.paymentStatus,
            transactionId: order.transactionId,
            discount: order.discount,
            items: order.OrderDetails.map(detail => ({
                productId: detail.productId,
                productName: detail.product?.title || 'N/A',
                productImage: detail.product?.image || '',
                productCode: detail.product?.productCode || '',
                price: parseFloat(detail.price),
                quantity: detail.quantity,
                subtotal: parseFloat(detail.price) * detail.quantity
            })),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        }));

        // Tính toán thống kê
        const totalSpent = orders.reduce((sum, order) => {
            return sum + (parseFloat(order.totalAmount) - parseFloat(order.discountValue || 0));
        }, 0);

        const totalOrders = count;
        const totalPages = Math.ceil(count / limit);

        return res.status(200).json({
            success: true,
            message: 'Lấy lịch sử thanh toán thành công',
            data: {
                orders: formattedOrders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalOrders,
                    limit: parseInt(limit),
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                statistics: {
                    totalSpent: totalSpent.toFixed(2),
                    totalOrders,
                    averageOrderValue: totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : 0
                }
            }
        });
    } catch (error) {
        console.error('Error in getUserPaymentHistory:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử thanh toán',
            error: error.message
        });
    }
};

/**
 * GET /api/payment-history/user/:orderId
 * Lấy chi tiết một đơn hàng của user
 */
export const getUserOrderDetail = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;

        const order = await db.Order.findOne({
            where: {
                id: orderId,
                userId: userId // Đảm bảo chỉ lấy đơn hàng của user này
            },
            include: [
                {
                    model: db.OrderDetail,
                    as: 'OrderDetails',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image', 'productCode', 'description']
                        }
                    ]
                },
                {
                    model: db.Discount,
                    as: 'discount'
                }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        const formattedOrder = {
            id: order.id,
            code: order.code,
            customerName: order.customerName,
            phone: order.phone,
            address: order.address,
            email: order.email,
            totalAmount: parseFloat(order.totalAmount),
            discountValue: parseFloat(order.discountValue || 0),
            finalAmount: parseFloat(order.totalAmount) - parseFloat(order.discountValue || 0),
            quantity: order.quantity,
            typePayment: order.typePayment,
            paymentMethod: order.typePayment === 1 ? 'COD' : order.typePayment === 2 ? 'Bank Transfer' : order.typePayment === 3 ? 'MoMo' : 'Unknown',
            status: order.status,
            paymentStatus: order.paymentStatus,
            transactionId: order.transactionId,
            discount: order.discount,
            items: order.OrderDetails.map(detail => ({
                productId: detail.productId,
                productName: detail.product?.title || 'N/A',
                productImage: detail.product?.image || '',
                productCode: detail.product?.productCode || '',
                productDescription: detail.product?.description || '',
                price: parseFloat(detail.price),
                quantity: detail.quantity,
                subtotal: parseFloat(detail.price) * detail.quantity
            })),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };

        return res.status(200).json({
            success: true,
            message: 'Lấy chi tiết đơn hàng thành công',
            data: formattedOrder
        });
    } catch (error) {
        console.error('Error in getUserOrderDetail:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết đơn hàng',
            error: error.message
        });
    }
};

/**
 * GET /api/payment-history/admin
 * [ADMIN] Lấy tất cả lịch sử thanh toán
 */
export const getAllPaymentHistory = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            paymentStatus,
            startDate,
            endDate,
            searchTerm,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        // Tạo điều kiện where
        const whereCondition = {};

        // Filter theo status đơn hàng
        if (status) {
            whereCondition.status = status;
        }

        // Filter theo paymentStatus
        if (paymentStatus) {
            whereCondition.paymentStatus = paymentStatus;
        }

        // Filter theo khoảng thời gian
        if (startDate || endDate) {
            whereCondition.createdAt = {};
            if (startDate) {
                whereCondition.createdAt[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereCondition.createdAt[Op.lte] = new Date(endDate);
            }
        }

        // Search theo code, customerName, phone, email
        if (searchTerm) {
            whereCondition[Op.or] = [
                { code: { [Op.like]: `%${searchTerm}%` } },
                { customerName: { [Op.like]: `%${searchTerm}%` } },
                { phone: { [Op.like]: `%${searchTerm}%` } },
                { email: { [Op.like]: `%${searchTerm}%` } },
                { transactionId: { [Op.like]: `%${searchTerm}%` } }
            ];
        }

        // Validate sortBy
        const allowedSortFields = ['createdAt', 'totalAmount', 'status', 'paymentStatus', 'code'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Lấy danh sách đơn hàng với phân trang
        const { count, rows: orders } = await db.Order.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email', 'phone']
                },
                {
                    model: db.OrderDetail,
                    as: 'OrderDetails',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image', 'productCode']
                        }
                    ]
                },
                {
                    model: db.Discount,
                    as: 'discount',
                    attributes: ['id', 'code', 'description', 'type', 'value']
                }
            ],
            order: [[sortField, order]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Format dữ liệu trả về
        const formattedOrders = orders.map(order => ({
            id: order.id,
            code: order.code,
            userId: order.userId,
            user: order.user ? {
                id: order.user.id,
                fullName: order.user.fullName,
                email: order.user.email,
                phone: order.user.phone
            } : null,
            customerName: order.customerName,
            phone: order.phone,
            address: order.address,
            email: order.email,
            totalAmount: parseFloat(order.totalAmount),
            discountValue: parseFloat(order.discountValue || 0),
            finalAmount: parseFloat(order.totalAmount) - parseFloat(order.discountValue || 0),
            quantity: order.quantity,
            typePayment: order.typePayment,
            paymentMethod: order.typePayment === 1
                ? 'COD'
                : order.typePayment === 2
                    ? 'VNPAY'
                    : order.typePayment === 3
                        ? 'MoMo'
                        : order.typePayment === 4
                            ? 'Bank Transfer'
                            : 'Unknown',
            status: order.status,
            paymentStatus: order.paymentStatus,
            transactionId: order.transactionId,
            discount: order.discount,
            itemsCount: order.OrderDetails.length,
            items: order.OrderDetails.map(detail => ({
                productId: detail.productId,
                productName: detail.product?.title || 'N/A',
                productImage: detail.product?.image || '',
                productCode: detail.product?.productCode || '',
                price: parseFloat(detail.price),
                quantity: detail.quantity,
                subtotal: parseFloat(detail.price) * detail.quantity
            })),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        }));

        // Tính toán thống kê tổng quan
        const allOrders = await db.Order.findAll({
            where: whereCondition,
            attributes: ['totalAmount', 'discountValue', 'paymentStatus', 'status']
        });

        const statistics = {
            totalRevenue: allOrders.reduce((sum, order) => {
                return sum + (parseFloat(order.totalAmount) - parseFloat(order.discountValue || 0));
            }, 0).toFixed(2),
            totalOrders: count,
            paidOrders: allOrders.filter(o => o.paymentStatus === 'paid').length,
            pendingOrders: allOrders.filter(o => o.paymentStatus === 'pending').length,
            failedOrders: allOrders.filter(o => o.paymentStatus === 'failed').length,
            completedOrders: allOrders.filter(o => o.status === 'completed').length,
            cancelledOrders: allOrders.filter(o => o.status === 'cancelled').length,
            averageOrderValue: count > 0 ? (allOrders.reduce((sum, order) => {
                return sum + (parseFloat(order.totalAmount) - parseFloat(order.discountValue || 0));
            }, 0) / count).toFixed(2) : 0
        };

        const totalPages = Math.ceil(count / limit);

        return res.status(200).json({
            success: true,
            message: 'Lấy lịch sử thanh toán thành công',
            data: {
                orders: formattedOrders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalOrders: count,
                    limit: parseInt(limit),
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                statistics
            }
        });
    } catch (error) {
        console.error('Error in getAllPaymentHistory:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử thanh toán',
            error: error.message
        });
    }
};

/**
 * GET /api/payment-history/admin/:orderId
 * [ADMIN] Lấy chi tiết một đơn hàng bất kỳ
 */
export const getAdminOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await db.Order.findOne({
            where: { id: orderId },
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email', 'phone', 'userName']
                },
                {
                    model: db.OrderDetail,
                    as: 'OrderDetails',
                    include: [
                        {
                            model: db.Product,
                            as: 'product'
                        }
                    ]
                },
                {
                    model: db.Discount,
                    as: 'discount'
                }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        const formattedOrder = {
            id: order.id,
            code: order.code,
            userId: order.userId,
            user: order.user,
            customerName: order.customerName,
            phone: order.phone,
            address: order.address,
            email: order.email,
            totalAmount: parseFloat(order.totalAmount),
            discountValue: parseFloat(order.discountValue || 0),
            finalAmount: parseFloat(order.totalAmount) - parseFloat(order.discountValue || 0),
            quantity: order.quantity,
            typePayment: order.typePayment,
            paymentMethod: order.typePayment === 1 ? 'COD' : order.typePayment === 2 ? 'Bank Transfer' : order.typePayment === 3 ? 'MoMo' : 'Unknown',
            status: order.status,
            paymentStatus: order.paymentStatus,
            transactionId: order.transactionId,
            discount: order.discount,
            items: order.OrderDetails.map(detail => ({
                id: detail.id,
                productId: detail.productId,
                product: detail.product,
                price: parseFloat(detail.price),
                quantity: detail.quantity,
                subtotal: parseFloat(detail.price) * detail.quantity
            })),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };

        return res.status(200).json({
            success: true,
            message: 'Lấy chi tiết đơn hàng thành công',
            data: formattedOrder
        });
    } catch (error) {
        console.error('Error in getAdminOrderDetail:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết đơn hàng',
            error: error.message
        });
    }
};

/**
 * GET /api/payment-history/admin/statistics
 * [ADMIN] Lấy thống kê thanh toán theo thời gian
 */
export const getPaymentStatistics = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        const whereCondition = {};

        // Filter theo khoảng thời gian
        if (startDate || endDate) {
            whereCondition.createdAt = {};
            if (startDate) {
                whereCondition.createdAt[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereCondition.createdAt[Op.lte] = new Date(endDate);
            }
        }

        // Lấy tất cả đơn hàng trong khoảng thời gian
        const orders = await db.Order.findAll({
            where: whereCondition,
            attributes: ['id', 'totalAmount', 'discountValue', 'paymentStatus', 'status', 'createdAt', 'typePayment'],
            order: [['createdAt', 'ASC']]
        });

        // Thống kê theo phương thức thanh toán
        const paymentMethodStats = {
            cod: { count: 0, revenue: 0 },
            vnpay: { count: 0, revenue: 0 },
            momo: { count: 0, revenue: 0 },
            bankTransfer: { count: 0, revenue: 0 }
        };

        orders.forEach(order => {
            const revenue = parseFloat(order.totalAmount) - parseFloat(order.discountValue || 0);
            if (order.typePayment === 1) {
                paymentMethodStats.cod.count++;
                paymentMethodStats.cod.revenue += revenue;
            } else if (order.typePayment === 2) {
                paymentMethodStats.vnpay.count++;
                paymentMethodStats.vnpay.revenue += revenue;
            } else if (order.typePayment === 3) {
                paymentMethodStats.momo.count++;
                paymentMethodStats.momo.revenue += revenue;
            } else if (order.typePayment === 4) {
                paymentMethodStats.bankTransfer.count++;
                paymentMethodStats.bankTransfer.revenue += revenue;
            }
        });

        // Thống kê theo trạng thái thanh toán
        const paymentStatusStats = {
            pending: { count: 0, revenue: 0 },
            paid: { count: 0, revenue: 0 },
            failed: { count: 0, revenue: 0 },
            refunded: { count: 0, revenue: 0 }
        };

        orders.forEach(order => {
            const revenue = parseFloat(order.totalAmount) - parseFloat(order.discountValue || 0);
            const status = order.paymentStatus || 'pending';
            if (paymentStatusStats[status]) {
                paymentStatusStats[status].count++;
                paymentStatusStats[status].revenue += revenue;
            }
        });

        // Tổng quan
        const overview = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => {
                return sum + (parseFloat(order.totalAmount) - parseFloat(order.discountValue || 0));
            }, 0).toFixed(2),
            averageOrderValue: orders.length > 0 ? (orders.reduce((sum, order) => {
                return sum + (parseFloat(order.totalAmount) - parseFloat(order.discountValue || 0));
            }, 0) / orders.length).toFixed(2) : 0,
            totalDiscount: orders.reduce((sum, order) => {
                return sum + parseFloat(order.discountValue || 0);
            }, 0).toFixed(2)
        };

        return res.status(200).json({
            success: true,
            message: 'Lấy thống kê thanh toán thành công',
            data: {
                overview,
                paymentMethodStats,
                paymentStatusStats,
                period: {
                    startDate: startDate || 'N/A',
                    endDate: endDate || 'N/A'
                }
            }
        });
    } catch (error) {
        console.error('Error in getPaymentStatistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê thanh toán',
            error: error.message
        });
    }
};
