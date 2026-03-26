'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bird_batches', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      house_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'houses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      batch_name: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      placed_at: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      initial_bird_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      current_bird_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      mortality_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('active', 'completed'),
        allowNull: false,
        defaultValue: 'active',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addColumn('daily_logs', 'bird_batch_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'bird_batches',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('bird_batches', ['house_id', 'status'], {
      name: 'bird_batches_house_status_idx',
    });
    await queryInterface.addIndex('daily_logs', ['bird_batch_id'], {
      name: 'daily_logs_bird_batch_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('daily_logs', 'daily_logs_bird_batch_idx');
    await queryInterface.removeColumn('daily_logs', 'bird_batch_id');
    await queryInterface.removeIndex('bird_batches', 'bird_batches_house_status_idx');
    await queryInterface.dropTable('bird_batches');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bird_batches_status";');
  },
};
