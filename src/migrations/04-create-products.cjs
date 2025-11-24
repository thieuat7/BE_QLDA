'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Products', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            productCode: { type: Sequelize.STRING },
            title: { type: Sequelize.STRING },
            alias: { type: Sequelize.STRING },
            description: { type: Sequelize.TEXT },
            detail: { type: Sequelize.TEXT },
            image: { type: Sequelize.STRING },
            originalPrice: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
            price: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
            priceSale: { type: Sequelize.DECIMAL(18, 2), defaultValue: 0 },
            quantity: { type: Sequelize.INTEGER, defaultValue: 0 },
            viewCount: { type: Sequelize.INTEGER, defaultValue: 0 },
            isHome: { type: Sequelize.BOOLEAN },
            isSale: { type: Sequelize.BOOLEAN },
            isFeature: { type: Sequelize.BOOLEAN },
            isHot: { type: Sequelize.BOOLEAN },
            isActive: { type: Sequelize.BOOLEAN },
            productCategoryId: {
                type: Sequelize.INTEGER,
                references: { model: 'ProductCategories', key: 'id' },
                onUpdate: 'CASCADE', onDelete: 'SET NULL'
            },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE }
        });
    },
    async down(queryInterface, Sequelize) { await queryInterface.dropTable('Products'); }
};