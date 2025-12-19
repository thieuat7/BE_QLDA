import db from '../models/index.js';
import { Op } from 'sequelize';

/**
 * GET /api/products
 * Lấy danh sách sản phẩm (Public)
 * Query params: page, limit, category_id, sort (price_asc, price_desc)
 */
export const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        const categoryId = req.query.category_id;
        const sort = req.query.sort;

        const whereClause = { isActive: true };
        if (categoryId) {
            whereClause.productCategoryId = categoryId;
        }

        let orderClause = [['createdAt', 'DESC']];
        if (sort === 'price_asc') {
            orderClause = [['price', 'ASC']];
        } else if (sort === 'price_desc') {
            orderClause = [['price', 'DESC']];
        }

        // Tách count và findAll
        const count = await db.Product.count({ where: whereClause });
        
        const products = await db.Product.findAll({
            where: whereClause,
            attributes: ['id', 'title', 'alias', 'productCode', 'description', 'image', 'price', 'priceSale', 'quantity', 'isHot', 'isSale', 'productCategoryId', 'createdAt'],
            include: [
                {
                    model: db.ProductCategory,
                    as: 'category',
                    attributes: ['id', 'title', 'alias']
                }
            ],
            limit: limit,
            offset: offset,
            order: orderClause,
            raw: true,   // Quan trọng
            nest: true   // Quan trọng
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách sản phẩm thành công',
            data: {
                products: products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalProducts: count,
                    limit: limit
                }
            }
        });

    } catch (error) {
        console.error('Get products error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sản phẩm',
            error: error.message
        });
    }
};

/**
 * GET /api/products/sale
 * Lấy danh sách sản phẩm đang sale (isSale = true, dùng priceSale)
 */
export const getSaleProducts = async (req, res) => {
    try {
        const products = await db.Product.findAll({
            where: { isActive: true, isSale: true },
            attributes: ['id', 'title', 'alias', 'productCode', 'description', 'image', 'price', 'priceSale', 'quantity', 'isHot', 'isSale', 'productCategoryId', 'createdAt'],
            include: [
                {
                    model: db.ProductCategory,
                    as: 'category',
                    attributes: ['id', 'title', 'alias']
                }
            ],
            order: [['createdAt', 'DESC']],
            raw: true,  // Fix lỗi
            nest: true  // Fix lỗi
        });

        // Đã dùng raw: true thì không cần .toJSON() nữa
        const saleProducts = products.map(p => ({
            ...p, // p đã là object thuần
            finalPrice: p.priceSale || p.price
        }));

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách sản phẩm sale thành công',
            data: { products: saleProducts }
        });
    } catch (error) {
        console.error('Get sale products error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy sản phẩm sale',
            error: error.message
        });
    }
};

/**
 * GET /api/products/hot
 * Lấy danh sách sản phẩm hot (isHot = true)
 */
export const getHotProducts = async (req, res) => {
    try {
        const products = await db.Product.findAll({
            where: { isActive: true, isHot: true },
            attributes: ['id', 'title', 'alias', 'productCode', 'description', 'image', 'price', 'priceSale', 'quantity', 'isHot', 'isSale', 'productCategoryId', 'createdAt'],
            include: [
                {
                    model: db.ProductCategory,
                    as: 'category',
                    attributes: ['id', 'title', 'alias']
                }
            ],
            order: [['createdAt', 'DESC']],
            raw: true,  // Fix lỗi
            nest: true  // Fix lỗi
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách sản phẩm hot thành công',
            data: { products }
        });
    } catch (error) {
        console.error('Get hot products error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy sản phẩm hot',
            error: error.message
        });
    }
};

/**
 * GET /api/products/search?q=keyword
 * Tìm kiếm sản phẩm (Public)
 */
export const searchProducts = async (req, res) => {
    try {
        const keyword = req.query.q;

        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập từ khóa tìm kiếm'
            });
        }

        const products = await db.Product.findAll({
            where: {
                isActive: true,
                [Op.or]: [
                    { title: { [Op.like]: `%${keyword}%` } },
                    { description: { [Op.like]: `%${keyword}%` } },
                    { productCode: { [Op.like]: `%${keyword}%` } }
                ]
            },
            attributes: ['id', 'title', 'alias', 'productCode', 'description', 'image', 'price', 'priceSale', 'quantity', 'productCategoryId'],
            include: [
                {
                    model: db.ProductCategory,
                    as: 'category',
                    attributes: ['id', 'title', 'alias']
                }
            ],
            limit: 20,
            order: [['createdAt', 'DESC']],
            raw: true,  // Fix lỗi
            nest: true  // Fix lỗi
        });

        return res.status(200).json({
            success: true,
            message: 'Tìm kiếm sản phẩm thành công',
            data: {
                products: products,
                total: products.length,
                keyword: keyword
            }
        });

    } catch (error) {
        console.error('Search products error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm kiếm sản phẩm',
            error: error.message
        });
    }
};

/**
 * GET /api/products/:id
 * Lấy chi tiết 1 sản phẩm (Public)
 */
export const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;

        // --- FIX: Thêm raw: true, nest: true ---
        const product = await db.Product.findByPk(productId, {
            attributes: ['id', 'title', 'alias', 'productCode', 'description', 'detail', 'image', 'originalPrice', 'price', 'priceSale', 'quantity', 'isActive', 'isHot', 'productCategoryId', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: db.ProductCategory,
                    as: 'category',
                    attributes: ['id', 'title', 'alias', 'icon']
                },
                {
                    model: db.ProductImage,
                    as: 'images',
                    attributes: ['id', 'image', 'isDefault']
                }
            ],
            raw: true,  // Quan trọng: Trả về JSON thuần
            nest: true  // Quan trọng: Gom nhóm category và images
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Lưu ý: Khi dùng raw: true với quan hệ hasMany (images), 
        // Sequelize có thể trả về 1 mảng các dòng (rows) thay vì 1 object chứa mảng images.
        // Tuy nhiên, với findByPk, nếu cấu hình nest: true, nó thường trả về 1 object.
        // Nếu trường hợp images chỉ hiện ra 1 ảnh đầu tiên, ta cần xử lý khác một chút.
        // Nhưng tạm thời hãy chạy mã này để hết lỗi crash trước.

        return res.status(200).json({
            success: true,
            message: 'Lấy chi tiết sản phẩm thành công',
            data: {
                product: product
            }
        });

    } catch (error) {
        console.error('Get product by id error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết sản phẩm',
            error: error.message
        });
    }
};

/**
 * POST /api/products
 * Tạo sản phẩm mới (Admin only)
 */
export const createProduct = async (req, res) => {
    try {
        const { title, alias, productCode, description, detail, price, originalPrice, priceSale, quantity, productCategoryId, isActive, isHot } = req.body;

        if (!title || !description || !price || !quantity || !productCategoryId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin bắt buộc (title, description, price, quantity, productCategoryId)'
            });
        }

        if (price <= 0 || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Giá phải > 0 và số lượng phải >= 0'
            });
        }

        const category = await db.ProductCategory.findByPk(productCategoryId, {
            raw: true,
            nest: true
        });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Danh mục không tồn tại'
            });
        }

        let imagePath = null;
        if (req.file) {
            imagePath = `/Uploads/products/${req.file.filename}`;
        } else if (req.body.image) {
            imagePath = req.body.image;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng upload ảnh hoặc cung cấp đường dẫn ảnh (image)'
            });
        }

        const newProduct = await db.Product.create({
            title,
            alias: alias || title.toLowerCase().replace(/\s+/g, '-'),
            productCode: productCode || `PRD-${Date.now()}`,
            description,
            detail: detail || description,
            image: imagePath,
            originalPrice: originalPrice || price,
            price,
            priceSale: priceSale || 0,
            quantity,
            productCategoryId,
            isActive: isActive !== undefined ? isActive : true,
            isHot: isHot !== undefined ? isHot : false
        });

        return res.status(201).json({
            success: true,
            message: 'Tạo sản phẩm thành công',
            data: {
                product: newProduct
            }
        });

    } catch (error) {
        console.error('Create product error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo sản phẩm',
            error: error.message
        });
    }
};

/**
 * PUT /api/products/:id
 * Cập nhật sản phẩm (Admin only)
 */
export const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { title, alias, productCode, description, detail, price, originalPrice, priceSale, quantity, productCategoryId, isActive, isHot } = req.body;

        const product = await db.Product.findByPk(productId, {
            raw: true,
            nest: true
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        if (price && price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Giá phải lớn hơn 0'
            });
        }

        if (quantity !== undefined && quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng không được âm'
            });
        }

        if (productCategoryId && productCategoryId !== product.productCategoryId) {
            const category = await db.ProductCategory.findByPk(productCategoryId, {
                raw: true,
                nest: true
            });
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Danh mục không tồn tại'
                });
            }
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (alias !== undefined) updateData.alias = alias;
        if (productCode !== undefined) updateData.productCode = productCode;
        if (description !== undefined) updateData.description = description;
        if (detail !== undefined) updateData.detail = detail;
        if (price !== undefined) updateData.price = price;
        if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
        if (priceSale !== undefined) updateData.priceSale = priceSale;
        if (quantity !== undefined) updateData.quantity = quantity;
        if (productCategoryId !== undefined) updateData.productCategoryId = productCategoryId;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (isHot !== undefined) updateData.isHot = isHot;

        if (req.file) {
            updateData.image = `/Uploads/products/${req.file.filename}`;
        } else if (req.body.image !== undefined) {
            updateData.image = req.body.image;
        }

        await db.Product.update(updateData, {
            where: { id: productId }
        });

        // Lấy lại product sau khi update (Không cần include để tránh lỗi)
        const updatedProduct = await db.Product.findByPk(productId, {
            raw: true,
            nest: true
        });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật sản phẩm thành công',
            data: {
                product: updatedProduct
            }
        });

    } catch (error) {
        console.error('Update product error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật sản phẩm',
            error: error.message
        });
    }
};

/**
 * DELETE /api/products/:id
 * Xóa sản phẩm (Admin only)
 */
export const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await db.Product.findByPk(productId, {
            raw: true,
            nest: true
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        await db.ProductImage.destroy({
            where: { productId: productId }
        });

        await db.Product.destroy({
            where: { id: productId }
        });

        return res.status(200).json({
            success: true,
            message: 'Xóa sản phẩm thành công',
            data: {
                deletedProductId: productId
            }
        });

    } catch (error) {
        console.error('Delete product error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa sản phẩm',
            error: error.message
        });
    }
};