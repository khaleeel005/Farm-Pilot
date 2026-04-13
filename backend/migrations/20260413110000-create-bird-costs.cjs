"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("bird_costs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      batch_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      birds_purchased: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      cost_per_bird: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
      },
      vaccination_cost_per_bird: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
      },
      expected_laying_months: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 12,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("bird_costs");
  },
};
