import db from '../models/index.js';

/**
 * GET /api/cart
 * Lấy giỏ hàng của user đang đăng nhập
 */
export const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Tìm hoặc tạo cart cho user
        let cart = await db.Cart.findOne({
            where: { userId: userId },
            include: [
                {
                    model: db.CartItem,
                    as: 'items',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image', 'price', 'priceSale', 'quantity'],
                            include: [
                                {
                                    model: db.ProductCategory,
                                    as: 'category',
                                    attributes: ['id', 'title']
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        // Nếu chưa có cart thì tạo mới
        if (!cart) {
            cart = await db.Cart.create({ userId: userId });
            cart.items = [];
        }

        // Tính tổng tiền
        const totalAmount = cart.items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

        return res.status(200).json({
            success: true,
            message: 'Lấy giỏ hàng thành công',
            data: {
                cart: {
                    id: cart.id,
                    userId: cart.userId,
                    items: cart.items,
                    totalItems: cart.items.length,
                    totalAmount: totalAmount
                }
            }
        });

    } catch (error) {
        console.error('Get cart error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy giỏ hàng',
            error: error.message
        });
    }
};

/**
 * POST /api/cart/add
 * Thêm sản phẩm vào giỏ hàng
 */
export const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        // Validate
        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp productId và quantity'
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải lớn hơn 0'
            });
        }

        // Kiểm tra sản phẩm có tồn tại không
        const product = await db.Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Kiểm tra số lượng tồn kho
        if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Sản phẩm chỉ còn ${product.quantity} trong kho`
            });
        }

        // Tìm hoặc tạo cart
        let cart = await db.Cart.findOne({ where: { userId: userId } });
        if (!cart) {
            cart = await db.Cart.create({ userId: userId });
        }

        // Kiểm tra sản phẩm đã có trong cart chưa
        let cartItem = await db.CartItem.findOne({
            where: {
                cartId: cart.id,
                productId: productId
            }
        });

        if (cartItem) {
            // Nếu đã có thì tăng số lượng
            const newQuantity = cartItem.quantity + parseInt(quantity);

            // Kiểm tra tồn kho với số lượng mới
            if (product.quantity < newQuantity) {
                return res.status(400).json({
                    success: false,
                    message: `Chỉ có thể thêm tối đa ${product.quantity - cartItem.quantity} sản phẩm nữa`
                });
            }

            cartItem.quantity = newQuantity;
            await cartItem.save();
        } else {
            // Nếu chưa có thì tạo mới
            const priceToUse = product.priceSale > 0 ? product.priceSale : product.price;
            cartItem = await db.CartItem.create({
                cartId: cart.id,
                productId: productId,
                quantity: parseInt(quantity),
                price: priceToUse
            });
        }

        // Lấy lại cart với đầy đủ thông tin
        cart = await db.Cart.findOne({
            where: { userId: userId },
            include: [
                {
                    model: db.CartItem,
                    as: 'items',
                    include: [
                        {
                            model: db.Product,
                            as: 'product',
                            attributes: ['id', 'title', 'image', 'price', 'priceSale', 'quantity']
                        }
                    ]
                }
            ]
        });

        return res.status(200).json({
            success: true,
            message: 'Thêm vào giỏ hàng thành công',
            data: {
                cart: cart
            }
        });

    } catch (error) {
        console.error('Add to cart error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm vào giỏ hàng',
            error: error.message
        });
    }
};

/**
 * PUT /api/cart/update
 * Cập nhật số lượng sản phẩm trong giỏ hàng
 */
export const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartItemId, quantity } = req.body;

        // Validate
        if (!cartItemId || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp cartItemId và quantity'
            });
        }

        if (quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng không được âm'
            });
        }

        // Nếu quantity = 0 thì xóa item
        if (quantity === 0) {
            const cartItem = await db.CartItem.findByPk(cartItemId, {
                include: [{
                    model: db.Cart,
                    as: 'cart',
                    where: { userId: userId }
                }]
            });

            if (!cartItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm trong giỏ hàng'
                });
            }

            await cartItem.destroy();

            return res.status(200).json({
                success: true,
                message: 'Đã xóa sản phẩm khỏi giỏ hàng'
            });
        }

        // Tìm cart item và kiểm tra quyền
        const cartItem = await db.CartItem.findByPk(cartItemId, {
            include: [
                {
                    model: db.Cart,
                    as: 'cart',
                    where: { userId: userId }
                },
                {
                    model: db.Product,
                    as: 'product'
                }
            ]
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm trong giỏ hàng'
            });
        }

        // Kiểm tra tồn kho
        if (cartItem.product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Sản phẩm chỉ còn ${cartItem.product.quantity} trong kho`
            });
        }

        // Cập nhật số lượng
        cartItem.quantity = quantity;
        await cartItem.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật giỏ hàng thành công',
            data: {
                cartItem: cartItem
            }
        });

    } catch (error) {
        console.error('Update cart item error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật giỏ hàng',
            error: error.message
        });
    }
};

/**
 * DELETE /api/cart/remove/:cartItemId
 * Xóa sản phẩm khỏi giỏ hàng
 */
export const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cartItemId = req.params.cartItemId;

        // Tìm cart item và kiểm tra quyền
        const cartItem = await db.CartItem.findByPk(cartItemId, {
            include: [{
                model: db.Cart,
                as: 'cart',
                where: { userId: userId }
            }]
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm trong giỏ hàng'
            });
        }

        // Xóa cart item
        await cartItem.destroy();

        return res.status(200).json({
            success: true,
            message: 'Đã xóa sản phẩm khỏi giỏ hàng',
            data: {
                deletedCartItemId: cartItemId
            }
        });

    } catch (error) {
        console.error('Remove from cart error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng',
            error: error.message
        });
    }
};

/**
 * POST /api/cart/apply-discount
 * Áp dụng mã giảm giá vào giỏ hàng
 * Có thể áp dụng cho toàn bộ giỏ hoặc chỉ một số sản phẩm cụ thể
 */
export const applyDiscount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { discountCode, productIds } = req.body; // productIds: array các product ID muốn áp dụng discount

        if (!discountCode) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã giảm giá'
            });
        }

        // Tìm cart của user
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
                            attributes: ['id', 'title', 'image', 'price', 'priceSale', 'quantity']
                        }
                    ]
                }
            ]
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Giỏ hàng trống'
            });
        }

        // Lọc các item cần áp dụng discount
        let applicableItems = cart.items;
        if (productIds && Array.isArray(productIds) && productIds.length > 0) {
            applicableItems = cart.items.filter(item => productIds.includes(item.productId));

            if (applicableItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm nào trong giỏ hàng khớp với danh sách đã chọn'
                });
            }
        }

        // Tính tổng tiền của các item được áp dụng discount
        const subtotal = applicableItems.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

        // Tính tổng tiền các item không áp dụng discount
        const remainingItems = cart.items.filter(item =>
            !applicableItems.some(appItem => appItem.id === item.id)
        );
        const remainingAmount = remainingItems.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

        // Tìm mã giảm giá
        const discount = await db.Discount.findOne({
            where: {
                code: discountCode.toUpperCase(),
                isActive: true
            }
        });

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa'
            });
        }

        // Kiểm tra thời hạn
        const now = new Date();
        if (now < new Date(discount.startDate) || now > new Date(discount.endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã hết hạn hoặc chưa đến thời gian sử dụng'
            });
        }

        // Kiểm tra số lượt sử dụng
        if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã hết lượt sử dụng'
            });
        }

        // Kiểm tra giá trị đơn hàng tối thiểu
        if (discount.minOrderAmount && subtotal < parseFloat(discount.minOrderAmount)) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng tối thiểu ${discount.minOrderAmount.toLocaleString('vi-VN')} VNĐ để áp dụng mã này`
            });
        }

        // Tính số tiền giảm
        let discountAmount = 0;
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

        // Tính tổng tiền sau giảm giá (chỉ áp dụng cho các item được chọn)
        const finalAmountAfterDiscount = Math.max(0, subtotal - discountAmount);

        // Tổng tiền toàn bộ giỏ hàng
        const totalCartAmount = finalAmountAfterDiscount + remainingAmount;

        return res.status(200).json({
            success: true,
            message: productIds && productIds.length > 0
                ? `Áp dụng mã giảm giá thành công cho ${applicableItems.length} sản phẩm`
                : 'Áp dụng mã giảm giá thành công cho toàn bộ giỏ hàng',
            data: {
                discount: {
                    id: discount.id,
                    code: discount.code,
                    description: discount.description,
                    type: discount.type,
                    value: discount.value
                },
                applicableItems: applicableItems.map(item => ({
                    productId: item.productId,
                    productTitle: item.product.title,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: parseFloat(item.price) * item.quantity
                })),
                remainingItems: remainingItems.map(item => ({
                    productId: item.productId,
                    productTitle: item.product.title,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: parseFloat(item.price) * item.quantity
                })),
                calculation: {
                    applicableSubtotal: subtotal,
                    discountAmount: discountAmount,
                    finalAmountAfterDiscount: finalAmountAfterDiscount,
                    remainingAmount: remainingAmount,
                    totalCartAmount: totalCartAmount
                },
                cart: cart
            }
        });

    } catch (error) {
        console.error('Apply discount error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi áp dụng mã giảm giá',
            error: error.message
        });
    }
};
