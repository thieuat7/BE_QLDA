'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('OrderDetails', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            orderId: {
                type: Sequelize.INTEGER,
                references: { model: 'Orders', key: 'id' },
                onDelete: 'CASCADE'
            },
            productId: {
                type: Sequelize.INTEGER,
                references: { model: 'Products', key: 'id' },
                onDelete: 'CASCADE'
            },
            price: { type: Sequelize.DECIMAL(18, 2) },
            quantity: { type: Sequelize.INTEGER },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE }
        });
    },
    async down(queryInterface, Sequelize) { await queryInterface.dropTable('OrderDetails'); }
};