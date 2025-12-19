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
            order: orderClause
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
            order: [['createdAt', 'DESC']]
        });

        // Đảm bảo trả về giá sale
        const saleProducts = products.map(p => ({
            ...p.toJSON(),
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
            order: [['createdAt', 'DESC']]
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
            order: [['createdAt', 'DESC']]
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
            ]
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

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

        // Validate đầy đủ
        if (!title || !description || !price || !quantity || !productCategoryId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin bắt buộc (title, description, price, quantity, productCategoryId)'
            });
        }

        // Validate số âm
        if (price <= 0 || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Giá phải > 0 và số lượng phải >= 0'
            });
        }

        // Kiểm tra category có tồn tại không
        const category = await db.ProductCategory.findByPk(productCategoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Danh mục không tồn tại'
            });
        }

        // Xử lý ảnh: upload file HOẶC đường dẫn có sẵn
        let imagePath = null;
        if (req.file) {
            // Upload file mới
            imagePath = `/Uploads/products/${req.file.filename}`;
        } else if (req.body.image) {
            // Dùng ảnh có sẵn từ body
            imagePath = req.body.image;
        } else {
            // Không có ảnh
            return res.status(400).json({
                success: false,
                message: 'Vui lòng upload ảnh hoặc cung cấp đường dẫn ảnh (image)'
            });
        }

        // Tạo sản phẩm mới
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

        // Kiểm tra sản phẩm có tồn tại không
        const product = await db.Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Validate dữ liệu nếu có
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

        // Kiểm tra category nếu có thay đổi
        if (productCategoryId && productCategoryId !== product.productCategoryId) {
            const category = await db.ProductCategory.findByPk(productCategoryId);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Danh mục không tồn tại'
                });
            }
        }

        // Build update data - cập nhật TẤT CẢ các field được gửi lên
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

        // Xử lý cập nhật ảnh
        if (req.file) {
            // Upload file mới
            updateData.image = `/Uploads/products/${req.file.filename}`;
        } else if (req.body.image !== undefined) {
            // Cập nhật bằng đường dẫn ảnh có sẵn
            updateData.image = req.body.image;
        }

        // Cập nhật
        await db.Product.update(updateData, {
            where: { id: productId }
        });

        // Lấy lại product sau khi update
        const updatedProduct = await db.Product.findByPk(productId);

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

        // Kiểm tra sản phẩm có tồn tại không
        const product = await db.Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Xóa product images liên quan
        await db.ProductImage.destroy({
            where: { productId: productId }
        });

        // Xóa sản phẩm
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