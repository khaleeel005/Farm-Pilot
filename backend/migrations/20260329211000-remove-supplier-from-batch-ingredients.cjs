'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('batch_ingredients');
    if (tableDescription.supplier) {
      await queryInterface.removeColumn('batch_ingredients', 'supplier');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('batch_ingredients', 'supplier', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  }
};
