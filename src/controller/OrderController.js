import db from '../models/index.js';

/**
 * POST /api/orders/checkout
 * Đặt hàng - chuyển từ giỏ hàng sang đơn hàng
 */
export const checkout = async (req, res) => {
    // Bắt đầu transaction
    const transaction = await db.sequelize.transaction();

    try {
        const userId = req.user.id;
        const { address, phone, customerName, paymentMethod, email } = req.body;

        // 1. Validate body
        if (!address || !phone || !customerName) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin (address, phone, customerName)'
            });
        }

        // Validate phone number
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại không hợp lệ'
            });
        }

        // 2. Lấy cart và cart_items của user
        const cart = await db.Cart.findOne({
            where: { userId: userId },
            include: [
                {
                    model: db.CartItem,
                    as: 'items',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'price', 'priceSale', 'quantity']
                        }
                    ]
                }
            ],
            transaction
        });

        if (!cart || !cart.items || cart.items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.'
            });
        }

        // 3. Kiểm tra số lượng tồn kho của từng sản phẩm
        const outOfStockProducts = [];
        for (const item of cart.items) {
            if (item.product.quantity < item.quantity) {
                outOfStockProducts.push({
                    productId: item.product.id,
                    productName: item.product.title,
                    available: item.product.quantity,
                    requested: item.quantity
                });
            }
        }

        if (outOfStockProducts.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Một số sản phẩm không đủ số lượng trong kho',
                data: {
                    outOfStockProducts: outOfStockProducts
                }
            });
        }

        // 4. Tính tổng tiền
        let totalAmount = 0;
        let totalQuantity = 0;

        for (const item of cart.items) {
            totalAmount += parseFloat(item.price) * item.quantity;
            totalQuantity += item.quantity;
        }

        // 5. Tạo mã đơn hàng unique
        const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 6. Tạo record mới trong bảng Orders
        const newOrder = await db.Order.create({
            code: orderCode,
            userId: userId,
            customerName: customerName,
            phone: phone,
            address: address,
            email: email || req.user.email,
            totalAmount: totalAmount,
            quantity: totalQuantity,
            typePayment: paymentMethod || 1, // 1: COD, 2: Online
            status: 1 // 1: Đang xử lý
        }, { transaction });

        // 7. Chuyển các cart_items thành order_items
        const orderDetailsPromises = cart.items.map(item => {
            return db.OrderDetail.create({
                orderId: newOrder.id,
                productId: item.productId,
                price: item.price,
                quantity: item.quantity
            }, { transaction });
        });

        await Promise.all(orderDetailsPromises);

        // 8. Trừ số lượng tồn kho trong bảng Products
        const updateStockPromises = cart.items.map(item => {
            return db.Product.decrement(
                'quantity',
                {
                    by: item.quantity,
                    where: { id: item.productId },
                    transaction
                }
            );
        });

        await Promise.all(updateStockPromises);

        // 9. Xóa cart_items và cart của user
        await db.CartItem.destroy({
            where: { cartId: cart.id },
            transaction
        });

        await db.Cart.destroy({
            where: { id: cart.id },
            transaction
        });

        // Commit transaction
        await transaction.commit();

        // 10. Lấy lại order với đầy đủ thông tin để trả về
        const orderWithDetails = await db.Order.findByPk(newOrder.id, {
            include: [
                {
                    model: db.OrderDetail,
                    as: 'details',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image', 'price']
                        }
                    ]
                }
            ]
        });

        return res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công',
            data: {
                order: orderWithDetails
            }
        });

    } catch (error) {
        // Rollback transaction nếu có lỗi
        await transaction.rollback();

        console.error('Checkout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi đặt hàng',
            error: error.message
        });
    }
};

/**
 * GET /api/orders
 * Lấy danh sách đơn hàng của user
 */
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: orders } = await db.Order.findAndCountAll({
            where: { userId: userId },
            include: [
                {
                    model: db.OrderDetail,
                    as: 'details',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image', 'price']
                        }
                    ]
                }
            ],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách đơn hàng thành công',
            data: {
                orders: orders,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalOrders: count,
                    limit: limit
                }
            }
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng',
            error: error.message
        });
    }
};

/**
 * GET /api/orders/:id
 * Lấy chi tiết 1 đơn hàng
 */
export const getOrderById = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;

        const order = await db.Order.findOne({
            where: {
                id: orderId,
                userId: userId // Chỉ lấy đơn hàng của chính user
            },
            include: [
                {
                    model: db.OrderDetail,
                    as: 'details',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image', 'price', 'description']
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
            message: 'Lấy chi tiết đơn hàng thành công',
            data: {
                order: order
            }
        });

    } catch (error) {
        console.error('Get order by id error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết đơn hàng',
            error: error.message
        });
    }
};

/**
 * GET /api/orders (Admin)
 * Lấy tất cả đơn hàng với filter và phân trang
 */
export const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status; // Filter theo status

        // Build where clause
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }

        const { count, rows: orders } = await db.Order.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'userName', 'email', 'phone']
                },
                {
                    model: db.OrderDetail,
                    as: 'details',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image', 'price']
                        }
                    ]
                }
            ],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách đơn hàng thành công',
            data: {
                orders: orders,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalOrders: count,
                    limit: limit
                }
            }
        });

    } catch (error) {
        console.error('Get all orders error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng',
            error: error.message
        });
    }
};

/**
 * PUT /api/orders/:id/status (Admin)
 * Cập nhật trạng thái đơn hàng
 * Status: 1 = Đang xử lý, 2 = Đang giao, 3 = Đã giao, 4 = Đã hủy
 */
export const updateOrderStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const orderId = req.params.id;
        const { status } = req.body;

        // Validate status
        const validStatuses = [1, 2, 3, 4]; // 1: processing, 2: shipping, 3: delivered, 4: cancelled
        if (!status || !validStatuses.includes(parseInt(status))) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ. Status phải là: 1 (Đang xử lý), 2 (Đang giao), 3 (Đã giao), 4 (Đã hủy)'
            });
        }

        // Tìm order
        const order = await db.Order.findByPk(orderId, {
            include: [
                {
                    model: db.OrderDetail,
                    as: 'details'
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

        // Kiểm tra logic: không thể thay đổi từ trạng thái đã giao/đã hủy
        if (order.status === 3 || order.status === 4) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Không thể cập nhật trạng thái đơn hàng đã giao hoặc đã hủy'
            });
        }

        const oldStatus = order.status;
        const newStatus = parseInt(status);

        // Nếu status đổi thành 'cancelled' (4), hoàn trả stock
        if (newStatus === 4 && oldStatus !== 4) {
            // Hoàn trả số lượng sản phẩm về kho
            const restoreStockPromises = order.details.map(detail => {
                return db.Product.increment(
                    'quantity',
                    {
                        by: detail.quantity,
                        where: { id: detail.productId },
                        transaction
                    }
                );
            });

            await Promise.all(restoreStockPromises);
        }

        // Cập nhật status
        order.status = newStatus;
        await order.save({ transaction });

        await transaction.commit();

        // Lấy lại order với đầy đủ thông tin
        const updatedOrder = await db.Order.findByPk(orderId, {
            include: [
                {
                    model: db.OrderDetail,
                    as: 'details',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image', 'price']
                        }
                    ]
                }
            ]
        });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công',
            data: {
                order: updatedOrder
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Update order status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái đơn hàng',
            error: error.message
        });
    }
};
