'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cập nhật avatar mặc định cho tất cả users chưa có avatar
    await queryInterface.sequelize.query(`
      UPDATE Users 
      SET avatar = '/Uploads/default-avatar.png'
      WHERE avatar IS NULL OR avatar = ''
    `);

    console.log('✓ Đã cập nhật avatar mặc định cho các users chưa có avatar');
  },

  async down(queryInterface, Sequelize) {
    // Revert: Đặt avatar về NULL cho các user có avatar mặc định
    await queryInterface.sequelize.query(`
      UPDATE Users 
      SET avatar = NULL
      WHERE avatar = '/Uploads/default-avatar.png'
    `);

    console.log('✓ Đã revert avatar về NULL');
  }
};
