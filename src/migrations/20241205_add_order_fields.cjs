/**
 * Migration: Thêm các field cần thiết cho Order và OrderDetail
 * Chạy: npx sequelize-cli db:migrate
 */

'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Thêm fields vào bảng Orders
        await queryInterface.addColumn('Orders', 'note', {
            type: Sequelize.TEXT,
            allowNull: true
        });

        await queryInterface.addColumn('Orders', 'paymentStatus', {
            type: Sequelize.STRING(20),
            allowNull: true,
            defaultValue: 'pending',
            comment: 'pending, paid, failed'
        });

        await queryInterface.addColumn('Orders', 'transactionId', {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Mã giao dịch từ cổng thanh toán'
        });

        // Thêm fields vào bảng OrderDetails
        await queryInterface.addColumn('OrderDetails', 'size', {
            type: Sequelize.STRING(20),
            allowNull: true
        });

        await queryInterface.addColumn('OrderDetails', 'color', {
            type: Sequelize.STRING(50),
            allowNull: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Rollback: Xóa các columns đã thêm
        await queryInterface.removeColumn('Orders', 'note');
        await queryInterface.removeColumn('Orders', 'paymentStatus');
        await queryInterface.removeColumn('Orders', 'transactionId');
        await queryInterface.removeColumn('OrderDetails', 'size');
        await queryInterface.removeColumn('OrderDetails', 'color');
    }
};
