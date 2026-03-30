'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('feed_batches');
    if (!tableDescription.manual_deductions) {
      await queryInterface.addColumn('feed_batches', 'manual_deductions', {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('feed_batches');
    if (tableDescription.manual_deductions) {
      await queryInterface.removeColumn('feed_batches', 'manual_deductions');
    }
  }
};
