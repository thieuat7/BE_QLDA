'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Thêm cột paymentStatus vào bảng Orders
        await queryInterface.addColumn('Orders', 'paymentStatus', {
            type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded'),
            allowNull: false,
            defaultValue: 'pending',
            comment: 'Trạng thái thanh toán: pending (chờ), paid (đã thanh toán), failed (thất bại), refunded (hoàn tiền)'
        });

        // Thêm cột transactionId để lưu mã giao dịch từ cổng thanh toán
        await queryInterface.addColumn('Orders', 'transactionId', {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Mã giao dịch từ cổng thanh toán (VNPAY, Momo...)'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Orders', 'paymentStatus');
        await queryInterface.removeColumn('Orders', 'transactionId');
    }
};
