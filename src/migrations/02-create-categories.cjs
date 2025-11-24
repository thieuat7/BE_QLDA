'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Categories', {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            title: { type: Sequelize.STRING, allowNull: false },
            alias: { type: Sequelize.STRING },
            link: { type: Sequelize.STRING },
            description: { type: Sequelize.TEXT },
            position: { type: Sequelize.INTEGER },
            isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
            createdAt: { allowNull: false, type: Sequelize.DATE },
            updatedAt: { allowNull: false, type: Sequelize.DATE }
        });
    },
    async down(queryInterface, Sequelize) { await queryInterface.dropTable('Categories'); }
};