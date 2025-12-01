'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Thêm cột discountId vào bảng Orders
        await queryInterface.addColumn('Orders', 'discountId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'Discounts',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'ID của mã giảm giá được áp dụng'
        });

        // Thêm cột discountValue vào bảng Orders
        await queryInterface.addColumn('Orders', 'discountValue', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0,
            comment: 'Số tiền giảm giá thực tế'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Orders', 'discountId');
        await queryInterface.removeColumn('Orders', 'discountValue');
    }
};
