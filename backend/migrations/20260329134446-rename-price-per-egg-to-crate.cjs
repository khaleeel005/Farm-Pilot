'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Sales');
    if (tableDescription.price_per_egg) {
      await queryInterface.renameColumn('Sales', 'price_per_egg', 'price_per_crate');
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Sales');
    if (tableDescription.price_per_crate) {
      await queryInterface.renameColumn('Sales', 'price_per_crate', 'price_per_egg');
    }
  }
};
