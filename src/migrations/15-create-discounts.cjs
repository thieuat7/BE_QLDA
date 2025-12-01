'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Discounts', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            code: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true,
                comment: 'Mã giảm giá (VD: SUMMER2024)'
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Mô tả chương trình giảm giá'
            },
            type: {
                type: Sequelize.ENUM('percent', 'amount'),
                allowNull: false,
                defaultValue: 'percent',
                comment: 'Loại giảm giá: percent (%) hoặc amount (số tiền cố định)'
            },
            value: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                comment: 'Giá trị giảm: nếu type=percent thì là %, nếu type=amount thì là số tiền'
            },
            minOrderAmount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                defaultValue: 0,
                comment: 'Giá trị đơn hàng tối thiểu để áp dụng mã'
            },
            maxDiscount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
                comment: 'Số tiền giảm tối đa (áp dụng cho type=percent)'
            },
            startDate: {
                type: Sequelize.DATE,
                allowNull: false,
                comment: 'Ngày bắt đầu hiệu lực'
            },
            endDate: {
                type: Sequelize.DATE,
                allowNull: false,
                comment: 'Ngày hết hạn'
            },
            usageLimit: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Số lượt sử dụng tối đa (null = không giới hạn)'
            },
            usedCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'Số lượt đã sử dụng'
            },
            isActive: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Trạng thái hoạt động'
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }, {
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci'
        });

        // Thêm index cho code để tìm kiếm nhanh
        await queryInterface.addIndex('Discounts', ['code'], {
            name: 'idx_discount_code'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Discounts');
    }
};
