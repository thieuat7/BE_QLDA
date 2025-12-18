'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Lấy tất cả users có avatar không phải default
    const [users] = await queryInterface.sequelize.query(`
      SELECT id, avatar FROM Users 
      WHERE avatar IS NOT NULL 
      AND avatar != '/Uploads/default-avatar.png'
    `);

    // Fix từng user
    for (const user of users) {
      const oldPath = user.avatar;

      // Bỏ qua nếu file đã đúng format (không có dấu gạch ngang kép)
      if (!oldPath.includes('--')) {
        continue;
      }

      // Reset về default avatar (cách đơn giản nhất)
      await queryInterface.sequelize.query(`
        UPDATE Users 
        SET avatar = '/Uploads/default-avatar.png'
        WHERE id = :userId
      `, {
        replacements: { userId: user.id }
      });
    }

    console.log(`✓ Đã reset ${users.length} avatar bị lỗi về default avatar`);
    console.log('ℹ User cần upload lại avatar mới');
  },

  async down(queryInterface, Sequelize) {
    // Không thể revert vì không lưu path cũ
    console.log('ℹ Không thể revert. User cần upload lại avatar');
  }
};
