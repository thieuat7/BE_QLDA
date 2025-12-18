'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'googleId', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true
    });

    await queryInterface.addIndex('Users', ['googleId'], {
      name: 'idx_users_google_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', 'idx_users_google_id');
    await queryInterface.removeColumn('Users', 'googleId');
  }
};
