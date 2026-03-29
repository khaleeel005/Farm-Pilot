'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Sales');
    if (tableDescription.customer_id) {
      await queryInterface.changeColumn('Sales', 'customer_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Sales');
    if (tableDescription.customer_id) {
      await queryInterface.changeColumn('Sales', 'customer_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
      });
    }
  }
};
