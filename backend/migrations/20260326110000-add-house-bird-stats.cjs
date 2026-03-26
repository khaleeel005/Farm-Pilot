'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('houses', 'initial_bird_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('houses', 'mortality_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.sequelize.query(`
      UPDATE houses
      SET
        initial_bird_count = current_bird_count,
        mortality_count = 0
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('houses', 'mortality_count');
    await queryInterface.removeColumn('houses', 'initial_bird_count');
  },
};
