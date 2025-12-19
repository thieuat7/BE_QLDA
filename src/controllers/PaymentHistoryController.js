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
        const whereCondition = { userId };

        if (status) whereCondition.status = status;
        if (paymentStatus) whereCondition.paymentStatus = paymentStatus;

        if (startDate || endDate) {
            whereCondition.createdAt = {};
            if (startDate) whereCondition.createdAt[Op.gte] = new Date(startDate);
            if (endDate) whereCondition.createdAt[Op.lte] = new Date(endDate);
        }

        if (searchTerm) {
            whereCondition[Op.or] = [
                { code: { [Op.like]: `%${searchTerm}%` } },
                { customerName: { [Op.like]: `%${searchTerm}%` } },
                { phone: { [Op.like]: `%${searchTerm}%` } }
            ];
        }

        // ❌ ĐÃ XÓA raw: true ĐỂ TRÁNH LỖI .map()
        const { count, rows: ordersInstance } = await db.Order.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: db.OrderDetail,
                    as: 'OrderDetails',
                    include: [{ model: db.Product, as: 'product', attributes: ['id', 'title', 'image', 'productCode'] }]
                },
                { model: db.Discount, as: 'discount', attributes: ['id', 'code', 'type', 'value'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true // Quan trọng: Đếm chính xác khi dùng include
        });

        // Chuyển instance thành object thuần và format
        const formattedOrders = ordersInstance.map(instance => {
            const order = instance.get({ plain: true });
            const total = parseFloat(order.totalAmount || 0);
            const discount = parseFloat(order.discountValue || 0);

            return {
                ...order,
                totalAmount: total,
                discountValue: discount,
                finalAmount: total - discount,
                paymentMethod: getPaymentMethodName(order.typePayment),
                // ✅ Kiểm tra an toàn trước khi map
                items: (order.OrderDetails || []).map(detail => ({
                    productId: detail.productId,
                    productName: detail.product?.title || 'N/A',
                    productImage: detail.product?.image || '',
                    productCode: detail.product?.productCode || '',
                    price: parseFloat(detail.price),
                    quantity: detail.quantity,
                    subtotal: parseFloat(detail.price) * detail.quantity
                }))
            };
        });

        const totalSpent = formattedOrders.reduce((sum, o) => sum + o.finalAmount, 0);

        return res.status(200).json({
            success: true,
            data: {
                orders: formattedOrders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalOrders: count
                },
                statistics: {
                    totalSpent: totalSpent.toFixed(0),
                    totalOrders: count
                }
            }
        });
    } catch (error) {
        console.error('Error in getUserPaymentHistory:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

/**
 * GET /api/payment-history/admin
 * [ADMIN] Lấy tất cả lịch sử thanh toán
 */
export const getAllPaymentHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, paymentStatus, searchTerm } = req.query;
        const offset = (page - 1) * limit;
        const whereCondition = {};

        if (status) whereCondition.status = status;
        if (paymentStatus) whereCondition.paymentStatus = paymentStatus;
        if (searchTerm) {
            whereCondition[Op.or] = [
                { code: { [Op.like]: `%${searchTerm}%` } },
                { customerName: { [Op.like]: `%${searchTerm}%` } }
            ];
        }

        // ❌ ĐÃ XÓA raw: true ĐỂ TRÁNH LỖI .map()
        const { count, rows: ordersInstance } = await db.Order.findAndCountAll({
            where: whereCondition,
            include: [
                { model: db.User, as: 'user', attributes: ['id', 'fullName', 'email'] },
                { 
                    model: db.OrderDetail, 
                    as: 'OrderDetails',
                    include: [{ model: db.Product, as: 'product', attributes: ['title', 'image'] }]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            distinct: true
        });

        const formattedOrders = ordersInstance.map(instance => {
            const order = instance.get({ plain: true });
            return {
                ...order,
                paymentMethod: getPaymentMethodName(order.typePayment),
                items: (order.OrderDetails || []).map(d => ({
                    productName: d.product?.title,
                    price: parseFloat(d.price),
                    quantity: d.quantity
                }))
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                orders: formattedOrders,
                pagination: { totalOrders: count, totalPages: Math.ceil(count / limit) }
            }
        });
    } catch (error) {
        console.error('Error in getAllPaymentHistory:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Hàm bổ trợ để tránh lặp code (Helper)
const getPaymentMethodName = (type) => {
    const methods = { 1: 'COD', 2: 'VNPAY', 3: 'MoMo', 4: 'Bank Transfer' };
    return methods[type] || 'Unknown';
};

// Các hàm getUserOrderDetail và getPaymentStatistics cũng cần xóa raw: true 
// và dùng .get({ plain: true }) tương tự như trên.