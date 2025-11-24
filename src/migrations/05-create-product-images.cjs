'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('ProductImages', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            productId: {
                type: Sequelize.INTEGER,
                references: { model: 'Products', key: 'id' },
                onDelete: 'CASCADE'
            },
            image: { type: Sequelize.STRING },
            isDefault: { type: Sequelize.BOOLEAN },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE }
        });
    },
    async down(queryInterface, Sequelize) { await queryInterface.dropTable('ProductImages'); }
};