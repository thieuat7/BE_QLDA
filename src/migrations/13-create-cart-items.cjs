'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('CartItems', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            cartId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Carts',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            productId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Products',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            price: {
                type: Sequelize.DECIMAL(18, 2),
                allowNull: false,
                comment: 'Giá tại thời điểm thêm vào giỏ'
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

        // Thêm unique constraint để không duplicate sản phẩm trong cùng 1 cart
        await queryInterface.addIndex('CartItems', ['cartId', 'productId'], {
            unique: true,
            name: 'unique_cart_product'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('CartItems');
    }
};
