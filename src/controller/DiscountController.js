import db from '../models/index.js';
import { Op } from 'sequelize';

/**
 * POST /api/discounts (Admin)
 * Tạo mã giảm giá mới
 */
export const createDiscount = async (req, res) => {
    try {
        const { code, description, type, value, minOrderAmount, maxDiscount, startDate, endDate, usageLimit, isActive } = req.body;

        // Validate required fields
        if (!code || !type || !value || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: code, type, value, startDate, endDate'
            });
        }

        // Validate type
        if (!['percent', 'amount'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type phải là "percent" hoặc "amount"'
            });
        }

        // Validate value
        if (parseFloat(value) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Giá trị giảm giá phải lớn hơn 0'
            });
        }

        // Validate percent range
        if (type === 'percent' && (parseFloat(value) < 0 || parseFloat(value) > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Giảm giá theo phần trăm phải từ 0 đến 100'
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: 'Ngày bắt đầu phải trước ngày kết thúc'
            });
        }

        // Check duplicate code
        const existingDiscount = await db.Discount.findOne({
            where: { code: code.toUpperCase() }
        });

        if (existingDiscount) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã tồn tại'
            });
        }

        // Create discount
        const discount = await db.Discount.create({
            code: code.toUpperCase(),
            description: description || null,
            type: type,
            value: parseFloat(value),
            minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
            maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
            startDate: start,
            endDate: end,
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            usedCount: 0,
            isActive: isActive !== undefined ? isActive : true
        });

        return res.status(201).json({
            success: true,
            message: 'Tạo mã giảm giá thành công',
            data: { discount }
        });

    } catch (error) {
        console.error('Create discount error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo mã giảm giá',
            error: error.message
        });
    }
};

/**
 * GET /api/discounts (Admin)
 * Lấy danh sách mã giảm giá
 */
export const getAllDiscounts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const isActive = req.query.isActive;

        const whereClause = {};
        if (isActive !== undefined) {
            whereClause.isActive = isActive === 'true';
        }

        const { count, rows: discounts } = await db.Discount.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách mã giảm giá thành công',
            data: {
                discounts: discounts,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalDiscounts: count,
                    limit: limit
                }
            }
        });

    } catch (error) {
        console.error('Get all discounts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách mã giảm giá',
            error: error.message
        });
    }
};

/**
 * PUT /api/discounts/:id (Admin)
 * Cập nhật mã giảm giá
 */
export const updateDiscount = async (req, res) => {
    try {
        const discountId = req.params.id;
        const { description, value, minOrderAmount, maxDiscount, startDate, endDate, usageLimit, isActive } = req.body;

        const discount = await db.Discount.findByPk(discountId);
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }

        // Update fields if provided
        if (description !== undefined) discount.description = description;
        if (value !== undefined) {
            if (parseFloat(value) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Giá trị giảm giá phải lớn hơn 0'
                });
            }
            if (discount.type === 'percent' && (parseFloat(value) < 0 || parseFloat(value) > 100)) {
                return res.status(400).json({
                    success: false,
                    message: 'Giảm giá theo phần trăm phải từ 0 đến 100'
                });
            }
            discount.value = parseFloat(value);
        }
        if (minOrderAmount !== undefined) discount.minOrderAmount = parseFloat(minOrderAmount);
        if (maxDiscount !== undefined) discount.maxDiscount = parseFloat(maxDiscount);
        if (startDate !== undefined) discount.startDate = new Date(startDate);
        if (endDate !== undefined) discount.endDate = new Date(endDate);
        if (usageLimit !== undefined) discount.usageLimit = parseInt(usageLimit);
        if (isActive !== undefined) discount.isActive = isActive;

        // Validate dates if both are present
        if (discount.startDate >= discount.endDate) {
            return res.status(400).json({
                success: false,
                message: 'Ngày bắt đầu phải trước ngày kết thúc'
            });
        }

        await discount.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật mã giảm giá thành công',
            data: { discount }
        });

    } catch (error) {
        console.error('Update discount error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật mã giảm giá',
            error: error.message
        });
    }
};

/**
 * DELETE /api/discounts/:id (Admin)
 * Xóa mã giảm giá
 */
export const deleteDiscount = async (req, res) => {
    try {
        const discountId = req.params.id;

        const discount = await db.Discount.findByPk(discountId);
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }

        await discount.destroy();

        return res.status(200).json({
            success: true,
            message: 'Xóa mã giảm giá thành công'
        });

    } catch (error) {
        console.error('Delete discount error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa mã giảm giá',
            error: error.message
        });
    }
};
