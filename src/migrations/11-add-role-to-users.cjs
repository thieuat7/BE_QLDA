'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Users', 'role', {
            type: Sequelize.STRING,
            defaultValue: 'user',
            allowNull: false,
            after: 'passwordHash'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Users', 'role');
    }
};
