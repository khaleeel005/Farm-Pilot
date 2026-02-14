'use strict';

/** @type {import('sequelize-cli').Migration} */

const COST_TYPES = [
  'supervisor_salary',
  'laborer_salary',
  'electricity',
  'water',
  'maintenance',
  'feed',
  'medication',
  'transportation',
  'equipment',
  'utilities',
  'supplies',
  'repairs',
  'fuel',
  'security',
  'cleaning',
  'consulting',
  'other',
];

function timestamps(Sequelize) {
  return {
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  };
}

async function dropEnumIfExists(queryInterface, enumTypeName) {
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumTypeName}";`);
}

async function addIndexIfMissing(queryInterface, tableName, fields, indexName) {
  const indexes = await queryInterface.showIndex(tableName);
  if (indexes.some((index) => index.name === indexName)) {
    return;
  }

  await queryInterface.addIndex(tableName, fields, { name: indexName });
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const ts = timestamps(Sequelize);

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('owner', 'staff'),
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      ...ts,
    });

    await queryInterface.createTable('houses', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      house_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Unnamed House',
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1000,
      },
      current_bird_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      location: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'maintenance', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      ...ts,
    });

    await queryInterface.createTable('feed_batches', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      batch_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      batch_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      total_quantity_tons: {
        type: Sequelize.DECIMAL(8, 3),
        allowNull: false,
      },
      bag_size_kg: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 50,
      },
      total_bags: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      cost_per_bag: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      cost_per_kg: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
      },
      miscellaneous_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      ...ts,
    });

    await queryInterface.createTable('feed_recipes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      recipe_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      corn_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      soybean_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      wheat_bran_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      limestone_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      other_ingredients: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      ...ts,
    });

    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      customer_name: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Unnamed Customer',
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      ...ts,
    });

    await queryInterface.createTable('laborers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      employee_id: {
        type: Sequelize.STRING(20),
        unique: true,
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(20),
      },
      address: {
        type: Sequelize.TEXT,
      },
      monthly_salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      hire_date: {
        type: Sequelize.DATEONLY,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      emergency_contact: {
        type: Sequelize.STRING(100),
      },
      emergency_phone: {
        type: Sequelize.STRING(20),
      },
      ...ts,
    });

    await queryInterface.createTable('bird_costs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
        defaultValue: 0,
      },
      expected_laying_months: {
        type: Sequelize.INTEGER,
        defaultValue: 12,
      },
      ...ts,
    });

    await queryInterface.createTable('operating_costs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      month_year: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      supervisor_salary: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      total_laborer_salaries: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      electricity_cost: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      water_cost: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      maintenance_cost: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      other_costs: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      total_monthly_cost: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      ...ts,
    });

    await queryInterface.createTable('daily_logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      log_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
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
      eggs_collected: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      cracked_eggs: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      feed_batch_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'feed_batches',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      feed_bags_used: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
        defaultValue: 0,
      },
      mortality_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      supervisor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ...ts,
    });

    await queryInterface.createTable('batch_ingredients', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      batch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'feed_batches',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ingredient_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      quantity_kg: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
      },
      total_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      cost_per_kg: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
      },
      supplier: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      ...ts,
    });

    await queryInterface.createTable('sales', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      sale_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      price_per_egg: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'transfer', 'check'),
        allowNull: false,
        defaultValue: 'cash',
      },
      payment_status: {
        type: Sequelize.ENUM('paid', 'pending'),
        allowNull: false,
        defaultValue: 'pending',
      },
      supervisor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ...ts,
    });

    await queryInterface.createTable('work_assignments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      laborer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'laborers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      tasks_assigned: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      attendance_status: {
        type: Sequelize.ENUM('present', 'absent', 'half_day', 'late'),
        defaultValue: 'present',
      },
      performance_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      hours: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      ...ts,
    });

    await queryInterface.createTable('payrolls', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      month_year: {
        type: Sequelize.STRING(7),
        allowNull: false,
      },
      laborer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'laborers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      base_salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      days_worked: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      days_absent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      salary_deductions: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
      },
      bonus_amount: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0,
      },
      final_salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATEONLY,
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'paid'),
        defaultValue: 'pending',
      },
      notes: {
        type: Sequelize.TEXT,
      },
      ...ts,
    });

    await queryInterface.createTable('cost_entries', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      cost_type: {
        type: Sequelize.ENUM(...COST_TYPES),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM('operational', 'capital', 'emergency'),
        defaultValue: 'operational',
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'bank_transfer', 'check', 'card', 'mobile_money'),
        allowNull: true,
      },
      vendor: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      receipt_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      house_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'houses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ...ts,
    });

    await addIndexIfMissing(
      queryInterface,
      'cost_entries',
      ['date', 'cost_type'],
      'cost_entries_date_cost_type',
    );
    await addIndexIfMissing(queryInterface, 'cost_entries', ['house_id'], 'cost_entries_house_id');
    await addIndexIfMissing(
      queryInterface,
      'cost_entries',
      ['created_by'],
      'cost_entries_created_by',
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cost_entries');
    await queryInterface.dropTable('payrolls');
    await queryInterface.dropTable('work_assignments');
    await queryInterface.dropTable('sales');
    await queryInterface.dropTable('batch_ingredients');
    await queryInterface.dropTable('daily_logs');
    await queryInterface.dropTable('operating_costs');
    await queryInterface.dropTable('bird_costs');
    await queryInterface.dropTable('laborers');
    await queryInterface.dropTable('customers');
    await queryInterface.dropTable('feed_recipes');
    await queryInterface.dropTable('feed_batches');
    await queryInterface.dropTable('houses');
    await queryInterface.dropTable('users');

    if (queryInterface.sequelize.getDialect() !== 'postgres') {
      return;
    }

    await dropEnumIfExists(queryInterface, 'enum_cost_entries_payment_method');
    await dropEnumIfExists(queryInterface, 'enum_cost_entries_category');
    await dropEnumIfExists(queryInterface, 'enum_cost_entries_cost_type');
    await dropEnumIfExists(queryInterface, 'enum_payrolls_payment_status');
    await dropEnumIfExists(queryInterface, 'enum_work_assignments_attendance_status');
    await dropEnumIfExists(queryInterface, 'enum_sales_payment_status');
    await dropEnumIfExists(queryInterface, 'enum_sales_payment_method');
    await dropEnumIfExists(queryInterface, 'enum_houses_status');
    await dropEnumIfExists(queryInterface, 'enum_users_role');
  },
};
