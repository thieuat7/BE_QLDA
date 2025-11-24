'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Orders', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            code: { type: Sequelize.STRING },
            customerName: { type: Sequelize.STRING },
            phone: { type: Sequelize.STRING },
            address: { type: Sequelize.STRING },
            email: { type: Sequelize.STRING },
            totalAmount: { type: Sequelize.DECIMAL(18, 2) },
            quantity: { type: Sequelize.INTEGER },
            typePayment: { type: Sequelize.INTEGER },
            status: { type: Sequelize.INTEGER },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE }
        });
    },
    async down(queryInterface, Sequelize) { await queryInterface.dropTable('Orders'); }
};