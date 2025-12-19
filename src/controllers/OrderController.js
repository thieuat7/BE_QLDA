import db from '../models/index.js';

/**
 * POST /api/orders/checkout
 * Đặt hàng - chuyển từ giỏ hàng sang đơn hàng
 */
export const checkout = async (req, res) => {
    console.debug('OrderController.checkout body:', req.body);
    // Bắt đầu transaction
    const transaction = await db.sequelize.transaction();

    try {
        const userId = req.user.id;
        const { address, phone, customerName, paymentMethod, email, discountCode, reserveOnly } = req.body;

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
        let subtotal = 0;
        let totalQuantity = 0;

        for (const item of cart.items) {
            subtotal += parseFloat(item.price) * item.quantity;
            totalQuantity += item.quantity;
        }

        // 4.5. Xử lý mã giảm giá (nếu có)
        let discount = null;
        let discountAmount = 0;
        let finalAmount = subtotal;

        if (discountCode) {
            // Tìm discount
            discount = await db.Discount.findOne({
                where: {
                    code: discountCode.toUpperCase(),
                    isActive: true
                },
                transaction
            });

            if (discount) {
                // Kiểm tra thời hạn
                const now = new Date();
                if (now >= new Date(discount.startDate) && now <= new Date(discount.endDate)) {
                    // Kiểm tra số lượt sử dụng
                    if (!discount.usageLimit || discount.usedCount < discount.usageLimit) {
                        // Kiểm tra giá trị đơn hàng tối thiểu
                        if (!discount.minOrderAmount || subtotal >= parseFloat(discount.minOrderAmount)) {
                            // Tính số tiền giảm
                            if (discount.type === 'percent') {
                                discountAmount = (subtotal * parseFloat(discount.value)) / 100;
                                // Áp dụng giảm tối đa nếu có
                                if (discount.maxDiscount && discountAmount > parseFloat(discount.maxDiscount)) {
                                    discountAmount = parseFloat(discount.maxDiscount);
                                }
                            } else {
                                // type === 'amount'
                                discountAmount = parseFloat(discount.value);
                            }

                            finalAmount = Math.max(0, subtotal - discountAmount);

                            // Tăng usedCount
                            await discount.increment('usedCount', { transaction });
                        }
                    }
                }
            }
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
            totalAmount: finalAmount,
            quantity: totalQuantity,
            typePayment: paymentMethod || 1, // 1: COD, 2: Online
            status: 1, // 1: Đang xử lý
            discountId: discount ? discount.id : null,
            discountValue: discountAmount,
            paymentStatus: paymentMethod === 2 ? 'pending' : 'paid', // COD = paid ngay, Online = pending
            reserveOnly: reserveOnly === true || reserveOnly === 'true' ? true : false
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

        // 8. Trừ số lượng tồn kho trong bảng Products (nếu không phải reserveOnly)
        if (!newOrder.reserveOnly) {
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
        }

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
                },
                {
                    model: db.Discount,
                    as: 'discount',
                    attributes: ['id', 'code', 'description', 'type', 'value']
                }
            ]
        });

        return res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công',
            data: {
                order: orderWithDetails,
                summary: {
                    subtotal: subtotal,
                    discountAmount: discountAmount,
                    finalAmount: finalAmount
                }
            }
        });

    } catch (error) {
        // Rollback transaction nếu có lỗi
        await transaction.rollback();

        console.error('Checkout error:', error.stack || error);
        const isProd = process.env.NODE_ENV === 'production';
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi đặt hàng',
            error: error.message,
            ...(isProd ? {} : { stack: error.stack })
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
                    as: 'OrderDetails',
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
        const orderId = req.params.id;
        const user = req.user;

        // Build where clause
        const whereClause = { id: orderId };

        // Nếu không phải admin, chỉ lấy đơn hàng của chính user
        if (user.role !== 'admin') {
            whereClause.userId = user.id;
        }

        const order = await db.Order.findOne({
            where: whereClause,
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'userName', 'email', 'phone', 'fullName'],
                    required: false
                },
                {
                    model: db.OrderDetail,
                    as: 'OrderDetails',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image', 'price', 'productCode', 'description']
                        }
                    ]
                },
                {
                    model: db.Discount,
                    as: 'discount',
                    attributes: ['id', 'code', 'description', 'type', 'value'],
                    required: false
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
        const { Op } = await import('sequelize');
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const paymentStatus = req.query.paymentStatus;
        const search = req.query.search;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        // Build where clause
        const whereClause = {};

        if (status) {
            whereClause.status = status;
        }

        if (paymentStatus) {
            whereClause.paymentStatus = paymentStatus;
        }

        if (search) {
            whereClause[Op.or] = [
                { code: { [Op.like]: `%${search}%` } },
                { customerName: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const { count, rows: orders } = await db.Order.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'userName', 'email', 'phone'],
                    required: false
                },
                {
                    model: db.OrderDetail,
                    as: 'OrderDetails',
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

        // Calculate summary statistics
        const allOrders = await db.Order.findAll({
            attributes: ['status', 'totalAmount']
        });

        const summary = {
            totalRevenue: allOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0),
            pendingCount: allOrders.filter(o => o.status === 'pending').length,
            confirmedCount: allOrders.filter(o => o.status === 'confirmed').length,
            shippingCount: allOrders.filter(o => o.status === 'shipping').length,
            deliveredCount: allOrders.filter(o => o.status === 'delivered').length,
            cancelledCount: allOrders.filter(o => o.status === 'cancelled').length
        };

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
                },
                summary: summary
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
 * PUT /api/admin/orders/:id/status (Admin)
 * Cập nhật trạng thái đơn hàng
 * Status: pending, confirmed, shipping, delivered, cancelled
 */
export const updateOrderStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
        const orderId = req.params.id;
        const { status, note } = req.body;

        // Validate status
        const validStatuses = ['pending', 'processing', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Trạng thái không hợp lệ. Status phải là một trong: ${validStatuses.join(', ')}`
            });
        }

        // Tìm order
        const order = await db.Order.findByPk(orderId, {
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

        // Kiểm tra logic: không thể thay đổi từ trạng thái đã giao/đã hủy
        if (order.status === 'delivered' || order.status === 'completed' || order.status === 'cancelled') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Không thể cập nhật trạng thái đơn hàng đã giao hoặc đã hủy'
            });
        }

        const oldStatus = order.status;
        const newStatus = status;

        // Nếu status đổi thành 'cancelled', hoàn trả stock
        if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
            // Hoàn trả số lượng sản phẩm về kho
            if (order.OrderDetails && order.OrderDetails.length > 0) {
                const restoreStockPromises = order.OrderDetails.map(detail => {
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
        }

        // Cập nhật status và note
        order.status = newStatus;
        if (note) {
            order.note = note;
        }
        await order.save({ transaction });

        await transaction.commit();

        // Lấy lại order với đầy đủ thông tin
        const updatedOrder = await db.Order.findByPk(orderId, {
            include: [
                {
                    model: db.OrderDetail,
                    as: 'OrderDetails',
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

/**
 * PUT /api/admin/orders/:id/payment-status (Admin)
 * Cập nhật trạng thái thanh toán và transactionId của đơn hàng
 */
export const updatePaymentStatus = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        const orderId = req.params.id;
        const { paymentStatus, transactionId, note } = req.body;

        const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        if (!paymentStatus || !validPaymentStatuses.includes(paymentStatus)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `paymentStatus không hợp lệ. Phải là một trong: ${validPaymentStatuses.join(', ')}`
            });
        }

        const order = await db.Order.findByPk(orderId, { transaction });
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        // Update paymentStatus and optionally transactionId and note
        order.paymentStatus = paymentStatus;
        if (transactionId !== undefined) order.transactionId = transactionId;
        if (note) order.note = note;

        await order.save({ transaction });
        await transaction.commit();

        // Return updated order (fresh)
        const updated = await db.Order.findByPk(orderId, {
            include: [
                { model: db.OrderDetail, as: 'OrderDetails', include: [{ model: db.Product, as: 'product', attributes: ['id', 'title', 'image'] }] },
                { model: db.User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] },
                { model: db.Discount, as: 'discount' }
            ]
        });

        return res.status(200).json({ success: true, message: 'Cập nhật trạng thái thanh toán thành công', data: { order: updated } });

    } catch (error) {
        await transaction.rollback();
        console.error('Update payment status error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái thanh toán', error: error.message });
    }
};

/**
 * GET /api/orders/my-orders
 * Lấy danh sách đơn hàng của user (có phân trang)
 */
export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status; // Filter theo status
        const paymentStatus = req.query.paymentStatus; // Filter theo paymentStatus

        // Lấy thông tin user để query theo phone/email nếu cần
        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin user'
            });
        }

        // Build where clause: Tìm theo userId HOẶC phone HOẶC email
        const { Op } = db.Sequelize;
        const whereClause = {
            [Op.or]: [
                { userId: userId },
                { phone: user.phone },
                { email: user.email }
            ]
        };

        if (status) {
            whereClause.status = status;
        }
        if (paymentStatus) {
            whereClause.paymentStatus = paymentStatus;
        }

        // Đếm tổng số đơn hàng
        const totalOrders = await db.Order.count({
            where: whereClause
        });

        // Lấy danh sách đơn hàng với pagination
        const orders = await db.Order.findAll({
            where: whereClause,
            include: [
                {
                    model: db.OrderDetail,
                    as: 'OrderDetails',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image', 'price', 'priceSale']
                        }
                    ]
                }
            ],
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        // Format lại data để frontend dễ xử lý
        const formattedOrders = orders.map(order => {
            return order.toJSON();
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách đơn hàng thành công',
            data: {
                orders: formattedOrders,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalOrders / limit),
                    totalOrders: totalOrders,
                    limit: limit
                }
            }
        });

    } catch (error) {
        console.error('Get my orders error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách đơn hàng',
            error: error.message
        });
    }
};
