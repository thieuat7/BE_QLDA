'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Orders', 'userId', {
            type: Sequelize.STRING(128),
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            after: 'id'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Orders', 'userId');
    }
};
