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
