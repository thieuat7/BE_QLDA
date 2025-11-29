'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Carts', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            userId: {
                type: Sequelize.STRING(128),
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Thêm unique constraint để mỗi user chỉ có 1 cart
        await queryInterface.addIndex('Carts', ['userId'], {
            unique: true,
            name: 'unique_user_cart'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Carts');
    }
};
