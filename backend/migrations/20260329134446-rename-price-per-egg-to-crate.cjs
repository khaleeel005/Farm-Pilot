'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('sales');
    if (tableDescription.price_per_egg) {
      await queryInterface.renameColumn('sales', 'price_per_egg', 'price_per_crate');
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('sales');
    if (tableDescription.price_per_crate) {
      await queryInterface.renameColumn('sales', 'price_per_crate', 'price_per_egg');
    }
  }
};
