'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'facebookId', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true
    });

    await queryInterface.addIndex('Users', ['facebookId'], {
      name: 'idx_users_facebook_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', 'idx_users_facebook_id');
    await queryInterface.removeColumn('Users', 'facebookId');
  }
};
