import db from '../models/index.js';

/**
 * GET /api/categories
 * Lấy tất cả danh mục (Public)
 */
export const getAllCategories = async (req, res) => {
    try {
        const categories = await db.ProductCategory.findAll({
            attributes: ['id', 'title', 'alias', 'icon', 'createdAt', 'updatedAt'],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách danh mục thành công',
            data: {
                categories: categories,
                total: categories.length
            }
        });

    } catch (error) {
        console.error('Get categories error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách danh mục',
            error: error.message
        });
    }
};

/**
 * POST /api/categories
 * Tạo danh mục mới (Admin only)
 */
export const createCategory = async (req, res) => {
    try {
        const { title, alias, icon } = req.body;

        // Validate
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tên danh mục'
            });
        }

        // Kiểm tra alias đã tồn tại chưa
        if (alias) {
            const existingCategory = await db.ProductCategory.findOne({
                where: { alias: alias }
            });

            if (existingCategory) {
                return res.status(409).json({
                    success: false,
                    message: 'Alias đã tồn tại, vui lòng chọn alias khác'
                });
            }
        }

        // Tạo danh mục mới
        const newCategory = await db.ProductCategory.create({
            title,
            alias: alias || null,
            icon: icon || null
        });

        return res.status(201).json({
            success: true,
            message: 'Tạo danh mục thành công',
            data: {
                category: newCategory
            }
        });

    } catch (error) {
        console.error('Create category error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo danh mục',
            error: error.message
        });
    }
};

/**
 * PUT /api/categories/:id
 * Cập nhật danh mục (Admin only)
 */
export const updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { title, alias, icon } = req.body;

        // Validate
        if (!title && !alias && icon === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ít nhất một thông tin để cập nhật (title, alias, icon)'
            });
        }

        // Kiểm tra danh mục có tồn tại không
        const category = await db.ProductCategory.findByPk(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục với ID này'
            });
        }

        // Kiểm tra alias mới có bị trùng không (trừ chính category này)
        if (alias) {
            const existingCategory = await db.ProductCategory.findOne({
                where: { alias: alias }
            });

            if (existingCategory && existingCategory.id !== parseInt(categoryId)) {
                return res.status(409).json({
                    success: false,
                    message: 'Alias đã tồn tại, vui lòng chọn alias khác'
                });
            }
        }

        // Tạo object update
        const updateData = {};
        if (title) updateData.title = title;
        if (alias) updateData.alias = alias;
        if (icon !== undefined) updateData.icon = icon;

        // Cập nhật
        await db.ProductCategory.update(updateData, {
            where: { id: categoryId }
        });

        // Lấy lại category sau khi update
        const updatedCategory = await db.ProductCategory.findByPk(categoryId);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật danh mục thành công',
            data: {
                category: updatedCategory
            }
        });

    } catch (error) {
        console.error('Update category error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật danh mục',
            error: error.message
        });
    }
};

/**
 * DELETE /api/categories/:id
 * Xóa danh mục (Admin only)
 */
export const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Kiểm tra danh mục có tồn tại không
        const category = await db.ProductCategory.findByPk(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục với ID này'
            });
        }

        // Kiểm tra xem có sản phẩm nào đang dùng danh mục này không
        const productsCount = await db.Product.count({
            where: { productCategoryId: categoryId }
        });

        if (productsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa danh mục này vì còn ${productsCount} sản phẩm đang sử dụng`
            });
        }

        // Xóa danh mục
        await db.ProductCategory.destroy({
            where: { id: categoryId }
        });

        return res.status(200).json({
            success: true,
            message: 'Xóa danh mục thành công',
            data: {
                deletedCategoryId: categoryId
            }
        });

    } catch (error) {
        console.error('Delete category error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa danh mục',
            error: error.message
        });
    }
};
