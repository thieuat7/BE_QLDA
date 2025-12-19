import db from '../models/index.js';

/**
 * POST /api/orders/checkout
 * Tạo đơn hàng từ giỏ hàng (không cần Cart database)
 * Frontend gửi items trực tiếp từ localStorage
 */
export const checkout = async (req, res) => {
    console.debug('OrderController_Simple.checkout body:', req.body);
    const transaction = await db.sequelize.transaction();

    try {
        const {
            customerName,
            email,
            phone,
            address,
            note,
            items, // Array: [{ productId, quantity, price, size, color }]
            totalAmount,
            typePayment,
            reserveOnly // if true, create order without decrementing stock
        } = req.body;

        // 1. Validate
        if (!customerName || !phone || !address) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin (customerName, phone, address)'
            });
        }

        if (!items || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Giỏ hàng trống'
            });
        }

        // Validate phone
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại không hợp lệ'
            });
        }

        // Validate email
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Email không hợp lệ'
                });
            }
        }

        // 2. Kiểm tra tồn kho và validate giá
        const outOfStockProducts = [];
        let calculatedTotal = 0;
        let totalQuantity = 0;

        for (const item of items) {
            // Lấy thông tin product từ DB
            const product = await db.Product.findByPk(item.productId, { transaction });

            if (!product) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Sản phẩm ID ${item.productId} không tồn tại`
                });
            }

            // Kiểm tra tồn kho
            if (product.quantity < item.quantity) {
                outOfStockProducts.push({
                    productId: product.id,
                    productName: product.title,
                    available: product.quantity,
                    requested: item.quantity
                });
            }

            // Tính tổng tiền (dùng giá từ DB để tránh hack)
            const actualPrice = product.priceSale || product.price;
            calculatedTotal += parseFloat(actualPrice) * item.quantity;
            totalQuantity += item.quantity;
        }

        // Kiểm tra hết hàng
        if (outOfStockProducts.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Một số sản phẩm không đủ số lượng trong kho',
                data: { outOfStockProducts }
            });
        }

        // 3. Tạo mã đơn hàng
        const orderCode = `ORD${Date.now()}`;

        // 3.1. Lấy userId từ token nếu user đã đăng nhập (optional)
        let userId = null;
        if (req.user && req.user.id) {
            userId = req.user.id;
        }

        // 4. Tạo Order
        const newOrder = await db.Order.create({
            code: orderCode,
            userId: userId, // Lưu userId nếu có (user đã login)
            customerName,
            phone,
            address,
            email: email || null,
            note: note || null,
            totalAmount: calculatedTotal,
            quantity: totalQuantity,
            typePayment: typePayment || 1, // 1=COD, 2=VNPAY, 3=MOMO, 4=Bank Transfer
            status: 'pending', // pending, processing, confirmed, shipping, delivered, cancelled
            paymentStatus: 'pending', // pending, paid, failed
            reserveOnly: reserveOnly === true || reserveOnly === 'true' ? true : false
        }, { transaction });

        // 5. Tạo OrderDetails
        const orderDetails = [];
        for (const item of items) {
            const product = await db.Product.findByPk(item.productId, { transaction });
            const actualPrice = product.priceSale || product.price;

            const detail = await db.OrderDetail.create({
                orderId: newOrder.id,
                productId: item.productId,
                price: actualPrice,
                quantity: item.quantity,
                size: item.size || null,
                color: item.color || null
            }, { transaction });

            orderDetails.push(detail);

            // 6. Giảm số lượng tồn kho (nếu không phải reserveOnly)
            if (!newOrder.reserveOnly) {
                await product.decrement('quantity', {
                    by: item.quantity,
                    transaction
                });
            }
        }

        // Commit transaction
        await transaction.commit();

        // 7. Trả về kết quả
        return res.status(200).json({
            success: true,
            message: 'Tạo đơn hàng thành công',
            data: {
                order: {
                    id: newOrder.id,
                    code: newOrder.code,
                    customerName: newOrder.customerName,
                    phone: newOrder.phone,
                    address: newOrder.address,
                    email: newOrder.email,
                    totalAmount: newOrder.totalAmount,
                    quantity: newOrder.quantity,
                    typePayment: newOrder.typePayment,
                    status: newOrder.status,
                    paymentStatus: newOrder.paymentStatus,
                    createdAt: newOrder.createdAt
                },
                orderDetails: orderDetails
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Checkout error:', error.stack || error);
        const isProd = process.env.NODE_ENV === 'production';
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo đơn hàng',
            error: error.message,
            ...(isProd ? {} : { stack: error.stack })
        });
    }
};

/**
 * GET /api/orders/:id
 * Lấy chi tiết đơn hàng
 */
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await db.Order.findByPk(id, {
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
                }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        return res.status(200).json({
            success: true,
            data: { order }
        });

    } catch (error) {
        console.error('Get order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin đơn hàng',
            error: error.message
        });
    }
};

/**
 * GET /api/orders
 * Lấy danh sách đơn hàng (theo phone hoặc email)
 */
export const getOrders = async (req, res) => {
    try {
        const { phone, email, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (phone) whereClause.phone = phone;
        if (email) whereClause.email = email;

        const { count, rows: orders } = await db.Order.findAndCountAll({
            where: whereClause,
            include: [
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
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalOrders: count,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get orders error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng',
            error: error.message
        });
    }
};

/**
 * PUT /api/orders/:id/cancel
 * Hủy đơn hàng
 */
export const cancelOrder = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const { id } = req.params;

        const order = await db.Order.findByPk(id, {
            include: [
                {
                    model: db.OrderDetail,
                    as: 'OrderDetails'
                }
            ],
            transaction
        });

        if (!order) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Chỉ cho phép hủy đơn hàng khi status = 'pending'
        if (order.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy đơn hàng này'
            });
        }

        // Hoàn lại số lượng tồn kho (nếu trước đó đã trừ)
        if (!order.reserveOnly && order.OrderDetails && order.OrderDetails.length > 0) {
            for (const detail of order.OrderDetails) {
                await db.Product.increment('quantity', {
                    by: detail.quantity,
                    where: { id: detail.productId },
                    transaction
                });
            }
        }

        // Cập nhật status = 'cancelled'
        order.status = 'cancelled';
        await order.save({ transaction });

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Hủy đơn hàng thành công',
            data: { order }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Cancel order error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi hủy đơn hàng',
            error: error.message
        });
    }
};
