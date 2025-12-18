'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Bước 1: Thêm column mới với ENUM
        await queryInterface.addColumn('Orders', 'status_new', {
            type: Sequelize.ENUM('pending', 'processing', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled'),
            defaultValue: 'pending',
            allowNull: true
        });

        // Bước 2: Migrate data từ INTEGER sang STRING
        // 0 -> pending
        // 1 -> confirmed
        // 2 -> shipping
        // 3 -> delivered/completed
        // 4 -> cancelled
        await queryInterface.sequelize.query(`
      UPDATE Orders 
      SET status_new = CASE 
        WHEN status = 0 THEN 'pending'
        WHEN status = 1 THEN 'confirmed'
        WHEN status = 2 THEN 'shipping'
        WHEN status = 3 THEN 'delivered'
        WHEN status = 4 THEN 'cancelled'
        ELSE 'pending'
      END
    `);

        // Bước 3: Xóa column cũ
        await queryInterface.removeColumn('Orders', 'status');

        // Bước 4: Đổi tên column mới thành 'status'
        await queryInterface.renameColumn('Orders', 'status_new', 'status');
    },

    down: async (queryInterface, Sequelize) => {
        // Rollback: Chuyển về INTEGER
        await queryInterface.addColumn('Orders', 'status_new', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: true
        });

        await queryInterface.sequelize.query(`
      UPDATE Orders 
      SET status_new = CASE 
        WHEN status = 'pending' THEN 0
        WHEN status = 'processing' THEN 0
        WHEN status = 'confirmed' THEN 1
        WHEN status = 'shipping' THEN 2
        WHEN status = 'delivered' THEN 3
        WHEN status = 'completed' THEN 3
        WHEN status = 'cancelled' THEN 4
        ELSE 0
      END
    `);

        await queryInterface.removeColumn('Orders', 'status');
        await queryInterface.renameColumn('Orders', 'status_new', 'status');
    }
};
