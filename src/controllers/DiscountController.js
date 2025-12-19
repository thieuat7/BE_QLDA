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
            where: { code: code.toUpperCase() },
            raw: true,
            nest: true
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
 * GET /api/discounts/public (Public)
 * Lấy danh sách mã giảm giá công khai (chỉ active và còn hạn)
 */
export const getPublicDiscounts = async (req, res) => {
    try {
        const currentDate = new Date();

        // Chỉ lấy mã giảm giá active, còn hạn và còn lượt sử dụng
        const discounts = await db.Discount.findAll({
            where: {
                isActive: true,
                startDate: { [Op.lte]: currentDate },
                endDate: { [Op.gte]: currentDate },
                [Op.or]: [
                    { usageLimit: null },
                    {
                        [Op.and]: [
                            { usageLimit: { [Op.ne]: null } },
                            db.Sequelize.where(
                                db.Sequelize.col('usageLimit'),
                                Op.gt,
                                db.Sequelize.col('usedCount')
                            )
                        ]
                    }
                ]
            },
            attributes: ['id', 'code', 'description', 'type', 'value', 'minOrderAmount', 'maxDiscount', 'startDate', 'endDate', 'usageLimit', 'usedCount'],
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách mã giảm giá thành công',
            data: {
                discounts: discounts
            }
        });

    } catch (error) {
        console.error('Get public discounts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách mã giảm giá',
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
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true
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

        const discount = await db.Discount.findByPk(discountId, {
            raw: true,
            nest: true
        });
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }

        // Update fields
        const updateData = {};
        if (description !== undefined) updateData.description = description;
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
            updateData.value = parseFloat(value);
        }
        if (minOrderAmount !== undefined) updateData.minOrderAmount = parseFloat(minOrderAmount);
        if (maxDiscount !== undefined) updateData.maxDiscount = parseFloat(maxDiscount);
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = new Date(endDate);
        if (usageLimit !== undefined) updateData.usageLimit = parseInt(usageLimit);
        if (isActive !== undefined) updateData.isActive = isActive;

        // Validate dates if both are present
        const finalStartDate = updateData.startDate || new Date(discount.startDate);
        const finalEndDate = updateData.endDate || new Date(discount.endDate);
        if (finalStartDate >= finalEndDate) {
            return res.status(400).json({
                success: false,
                message: 'Ngày bắt đầu phải trước ngày kết thúc'
            });
        }

        await db.Discount.update(updateData, {
            where: { id: discountId }
        });

        // Lấy lại discount sau update
        const updatedDiscount = await db.Discount.findByPk(discountId, {
            raw: true,
            nest: true
        });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật mã giảm giá thành công',
            data: { discount: updatedDiscount }
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
 * POST /api/discounts/validate (Public)
 * Validate và lấy thông tin mã giảm giá theo code
 */
export const validateDiscountCode = async (req, res) => {
    try {
        const { code, orderAmount } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã giảm giá'
            });
        }

        const currentDate = new Date();

        // Tìm mã giảm giá theo code
        const discount = await db.Discount.findOne({
            where: {
                code: code.toUpperCase()
            },
            raw: true,
            nest: true
        });

        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Mã giảm giá không tồn tại'
            });
        }

        // Kiểm tra mã có active không
        if (!discount.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã bị vô hiệu hóa'
            });
        }

        // Kiểm tra thời gian hiệu lực
        if (currentDate < discount.startDate) {
            return res.status(400).json({
                success: false,
                message: `Mã giảm giá chưa có hiệu lực. Bắt đầu từ: ${discount.startDate.toLocaleDateString('vi-VN')}`
            });
        }

        if (currentDate > discount.endDate) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã hết hạn'
            });
        }

        // Kiểm tra lượt sử dụng
        if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
            return res.status(400).json({
                success: false,
                message: 'Mã giảm giá đã hết lượt sử dụng'
            });
        }

        // Kiểm tra giá trị đơn hàng tối thiểu
        if (orderAmount && parseFloat(orderAmount) < discount.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng tối thiểu ${discount.minOrderAmount.toLocaleString('vi-VN')}đ để sử dụng mã này`
            });
        }

        // Tính toán số tiền giảm giá
        let discountAmount = 0;
        if (discount.type === 'percent') {
            discountAmount = (parseFloat(orderAmount || 0) * discount.value) / 100;
            if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
                discountAmount = discount.maxDiscount;
            }
        } else {
            discountAmount = discount.value;
        }

        return res.status(200).json({
            success: true,
            message: 'Mã giảm giá hợp lệ',
            data: {
                discount: {
                    id: discount.id,
                    code: discount.code,
                    description: discount.description,
                    type: discount.type,
                    value: discount.value,
                    minOrderAmount: discount.minOrderAmount,
                    maxDiscount: discount.maxDiscount,
                    discountAmount: discountAmount
                }
            }
        });

    } catch (error) {
        console.error('Validate discount code error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra mã giảm giá',
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

        const discount = await db.Discount.findByPk(discountId, {
            raw: true,
            nest: true
        });
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mã giảm giá'
            });
        }

        await db.Discount.destroy({
            where: { id: discountId }
        });

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
