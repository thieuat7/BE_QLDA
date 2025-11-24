'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Users', {
            id: { allowNull: false, primaryKey: true, type: Sequelize.STRING(128) },
            fullName: { type: Sequelize.STRING },
            phone: { type: Sequelize.STRING },
            email: { type: Sequelize.STRING },
            userName: { type: Sequelize.STRING },
            passwordHash: { type: Sequelize.STRING },
            createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
            updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
        });
    },
    async down(queryInterface, Sequelize) { await queryInterface.dropTable('Users'); }
};