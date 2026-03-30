'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('sales');
    if (tableDescription.customer_id) {
      await queryInterface.changeColumn('sales', 'customer_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('sales');
    if (tableDescription.customer_id) {
      await queryInterface.changeColumn('sales', 'customer_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
      });
    }
  }
};
