import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

// Ensure pg package is available
try {
  import('pg');
} catch (error) {
  console.error("pg package not found. Please ensure it's installed as a dependency.");
  throw error;
}

// Priority: Vercel Postgres -> DATABASE_URL -> Individual vars
const POSTGRES_URL = process.env.POSTGRES_URL;
const DATABASE_URL = process.env.DATABASE_URL;
const DB_NAME = process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'farm_manager';
const DB_USER = process.env.DB_USER || process.env.POSTGRES_USER || 'aliyusani';
const DB_PASS = process.env.DB_PASS || process.env.POSTGRES_PASSWORD || 'aliyusani';
const DB_HOST = process.env.DB_HOST || process.env.POSTGRES_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
const DB_DIALECT = process.env.DB_DIALECT || 'postgres';
const LOG_SQL = process.env.DB_LOG === 'true' || false;

let sequelize;

// If Vercel Postgres URL is provided, use it first
if (POSTGRES_URL) {
  sequelize = new Sequelize(POSTGRES_URL, {
    dialect: 'postgres',
    logging: LOG_SQL ? (msg) => logger.debug(`[SQL] ${msg}`) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
    },
    dialectOptions: {
      ssl:
        process.env.DB_SSL === 'false'
          ? false
          : {
              require: true,
              rejectUnauthorized: false,
            },
    },
  });
  // If DATABASE_URL is provided (legacy providers), use it
} else if (DATABASE_URL) {
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: LOG_SQL ? (msg) => logger.debug(`[SQL] ${msg}`) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
    },
    dialectOptions: {
      ssl:
        process.env.DB_SSL === 'false'
          ? false
          : {
              require: true,
              rejectUnauthorized: false,
            },
    },
  });
} else if (DB_DIALECT === 'sqlite') {
  const DB_STORAGE = process.env.DB_STORAGE || ':memory:';
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: DB_STORAGE,
    logging: LOG_SQL ? (msg) => logger.debug(`[SQL] ${msg}`) : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
    },
  });
} else {
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: DB_DIALECT,
    logging: LOG_SQL ? (msg) => logger.debug(`[SQL] ${msg}`) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
    },
  });
}

export async function connect() {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== 'test') {
      logger.info('Database connected successfully.');
    }
    return true;
  } catch (err) {
    logger.error('Database connection failed:', err);
    throw err;
  }
}

export function close() {
  return sequelize.close();
}

export function initModels(modelsDir = path.join(__dirname, '..', 'models')) {
  const models = {};
  if (!fs.existsSync(modelsDir)) return models;

  fs.readdirSync(modelsDir)
    .filter((f) => f.endsWith('.js'))
    .forEach((file) => {
      const modelPath = path.join(modelsDir, file);
      const model = require(modelPath)(sequelize, Sequelize.DataTypes);
      models[model.name] = model;
    });

  Object.values(models)
    .filter((m) => typeof m.associate === 'function')
    .forEach((m) => m.associate(models));

  return models;
}

// Track if auto-migration has run (for test environment)
let migrationComplete = false;

export async function autoMigrate() {
  // For test environment, only run migration once to avoid wiping data between test files
  if (process.env.NODE_ENV === 'test' && migrationComplete) {
    return;
  }

  try {
    // Import associations to set up model relationships
    await import('../models/associations.js');

    if (process.env.USE_MIGRATIONS === 'true') {
      try {
        const { execSync } = await import('child_process');
        if (process.env.NODE_ENV !== 'test') {
          logger.info('Running migrations via sequelize-cli...');
        }
        execSync('npx sequelize db:migrate', { stdio: 'inherit' });
        if (process.env.NODE_ENV !== 'test') {
          logger.info('Migrations completed.');
        }
        migrationComplete = true;
        return;
      } catch (mErr) {
        logger.error('Failed to run sequelize migrations:', mErr);
      }
    }

    // For tests with SQLite, use force: true to avoid index duplication issues
    // For production (postgres), use alter: true to preserve data
    const isTestEnv = process.env.NODE_ENV === 'test';
    const isSqlite = sequelize.getDialect() === 'sqlite';

    if (isTestEnv && isSqlite) {
      await sequelize.sync({ force: true });
    } else {
      await sequelize.sync({ alter: true });
    }

    migrationComplete = true;
    // Database synchronized successfully (logging disabled for tests)
  } catch (err) {
    console.error('Database synchronization failed:', err);
    throw err;
  }
}

export { sequelize, Sequelize };
