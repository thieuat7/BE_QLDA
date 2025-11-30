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
