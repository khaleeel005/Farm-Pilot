import '../config/loadEnv.js';
import { Sequelize, type Dialect } from 'sequelize';
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

type SupportedDialect = 'postgres' | 'sqlite';

type DatabaseEnv = {
  databaseUrl?: string;
  dbName?: string;
  dbUser?: string;
  dbPassword?: string;
  dbHost?: string;
  dbPort?: number;
  dbDialect: SupportedDialect;
  dbLogSql: boolean;
  dbMaintenanceDb?: string;
  dbStorage?: string;
  dbSsl: boolean | { require: true; rejectUnauthorized: false } | undefined;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

function parsePort(raw: string, name: string): number {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a valid integer`);
  }
  return parsed;
}

function parseBool(raw: string, name: string): boolean {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`${name} must be either "true" or "false"`);
}

function parseDialect(raw: string): SupportedDialect {
  if (raw === 'postgres' || raw === 'sqlite') {
    return raw;
  }
  throw new Error('DB_DIALECT must be either "postgres" or "sqlite"');
}

function readDatabaseEnv(): DatabaseEnv {
  const dbDialect = parseDialect(requireEnv('DB_DIALECT'));
  const dbLogSql = parseBool(requireEnv('DB_LOG'), 'DB_LOG');
  const databaseUrl = process.env.DATABASE_URL;

  const dbSsl =
    process.env.DB_SSL === 'false'
      ? false
      : process.env.DB_SSL === 'true'
        ? { require: true as const, rejectUnauthorized: false as const }
        : undefined;

  if (dbDialect === 'sqlite') {
    return {
      databaseUrl,
      dbDialect,
      dbLogSql,
      dbStorage: requireEnv('DB_STORAGE'),
      dbSsl,
    };
  }

  return {
    databaseUrl,
    dbName: databaseUrl ? undefined : requireEnv('DB_NAME'),
    dbUser: databaseUrl ? undefined : requireEnv('DB_USER'),
    dbPassword: databaseUrl ? undefined : requireEnv('DB_PASSWORD'),
    dbHost: databaseUrl ? undefined : requireEnv('DB_HOST'),
    dbPort: databaseUrl ? undefined : parsePort(requireEnv('DB_PORT'), 'DB_PORT'),
    dbDialect,
    dbLogSql,
    dbMaintenanceDb: databaseUrl ? undefined : requireEnv('DB_MAINTENANCE_DB'),
    dbSsl,
  };
}

const env = readDatabaseEnv();

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

async function ensurePostgresDatabaseExists() {
  if (env.databaseUrl || env.dbDialect !== 'postgres') return;
  if (!env.dbName || !env.dbUser || !env.dbHost || !env.dbPort || !env.dbMaintenanceDb) {
    throw new Error(
      'Missing required postgres config: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_MAINTENANCE_DB',
    );
  }

  const { Client } = await import('pg');
  const client = new Client({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbMaintenanceDb,
    ssl: env.dbSsl === false ? false : env.dbSsl ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();
  try {
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      env.dbName,
    ]);
    if (result.rowCount === 0) {
      logger.info(`Database "${env.dbName}" not found. Creating it...`);
      await client.query(`CREATE DATABASE ${quoteIdentifier(env.dbName)}`);
      logger.info(`✓ Database "${env.dbName}" created.`);
    }
  } finally {
    await client.end();
  }
}

function createSequelizeInstance(config: DatabaseEnv): Sequelize {
  if (config.databaseUrl) {
    return new Sequelize(config.databaseUrl, {
      dialect: 'postgres',
      logging: config.dbLogSql ? (msg) => logger.debug(`[SQL] ${msg}`) : false,
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
      dialectOptions:
        config.dbSsl === false
          ? undefined
          : {
              ssl: config.dbSsl || { require: true, rejectUnauthorized: false },
            },
    });
  }

  if (config.dbDialect === 'sqlite') {
    return new Sequelize({
      dialect: 'sqlite',
      storage: config.dbStorage,
      logging: config.dbLogSql ? (msg) => logger.debug(`[SQL] ${msg}`) : false,
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
  }

  return new Sequelize(config.dbName as string, config.dbUser as string, config.dbPassword as string, {
    host: config.dbHost,
    port: config.dbPort,
    dialect: config.dbDialect as Dialect,
    logging: config.dbLogSql ? (msg) => logger.debug(`[SQL] ${msg}`) : false,
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

const sequelize: Sequelize = createSequelizeInstance(env);

export async function connect() {
  try {
    logger.info('Connecting to database...');
    logger.debug('Database configuration:', {
      dialect: env.dbDialect,
      host: env.dbHost,
      port: env.dbPort,
      database: env.dbName,
      hasDatabaseUrl: !!env.databaseUrl,
    });

    await ensurePostgresDatabaseExists();
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== 'test') {
      logger.info('✓ Database connected successfully.');
    }
    return true;
  } catch (err: unknown) {
    const error = err as { message?: string; code?: string; details?: unknown };
    logger.error('Database connection failed:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    throw err;
  }
}

export function close() {
  return sequelize.close();
}

export function initModels(
  modelsDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'models')
) {
  const models = {};
  if (!fs.existsSync(modelsDir)) return models;

  fs.readdirSync(modelsDir)
    .filter((f) => f.endsWith('.js') && f !== 'associations.js')
    .forEach((file) => {
      logger.debug(`Model file found: ${file}`);
    });

  return models;
}

// Track if auto-migration has run (for test environment)
let migrationComplete = false;

export async function autoMigrate() {
  const isTestEnv = process.env.NODE_ENV === 'test';
  const preserveTestDb = process.env.TEST_PRESERVE_DB === 'true';

  // Optional opt-in to preserve test database across repeated calls.
  if (isTestEnv && preserveTestDb && migrationComplete) {
    return;
  }

  try {
    logger.info('Starting database migration...');

    // First, authenticate the database connection
    await ensurePostgresDatabaseExists();
    await sequelize.authenticate();
    logger.info('✓ Database connection authenticated.');

    // Import associations to set up model relationships
    logger.debug('Loading model associations...');
    await import('../models/associations.js');
    logger.debug('✓ Model associations loaded.');

    const isProduction = process.env.NODE_ENV === 'production';
    if (process.env.USE_MIGRATIONS === 'true') {
      try {
        const { execSync } = await import('child_process');
        logger.info('Running migrations via sequelize-cli...');
        execSync('npx sequelize db:migrate', { stdio: 'inherit' });
        logger.info('✓ Migrations completed successfully.');
        migrationComplete = true;
        return;
      } catch (mErr: unknown) {
        const migrateError = mErr as { message?: string; code?: string };
        logger.error('Failed to run sequelize migrations:', {
          message: migrateError.message,
          code: migrateError.code,
        });
        if (isProduction) {
          throw new Error(
            `Database migrations failed in production: ${migrateError.message || 'unknown error'}`,
          );
        }
        logger.info('Falling back to sequelize.sync...');
      }
    }

    if (isProduction) {
      throw new Error(
        'Refusing to run sequelize.sync in production. Set USE_MIGRATIONS=true and run migrations.',
      );
    }

    // For tests with SQLite, use force: true to avoid index duplication issues
    // For development (postgres), use alter: true to preserve data
    const dialect = sequelize.getDialect();

    logger.info(`Syncing database with sequelize (dialect: ${dialect})...`);

    if (isTestEnv) {
      logger.debug('Using force: true for test environment');
      await sequelize.sync({ force: true });
    } else {
      logger.debug('Using alter: true for development environment');
      await sequelize.sync({ alter: true });
    }

    logger.info('✓ Database synchronized successfully.');
    migrationComplete = true;
  } catch (err: unknown) {
    const error = err as { message?: string; code?: string; stack?: string };
    logger.error('Database synchronization failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw err;
  }
}

export { sequelize, Sequelize };
