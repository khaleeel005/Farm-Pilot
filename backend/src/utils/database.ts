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

function parseSslConfig(raw: string | undefined): DatabaseEnv['dbSsl'] {
  if (raw === 'false') return false;
  if (raw === 'true') {
    return { require: true, rejectUnauthorized: false };
  }
  return undefined;
}

function readBaseDatabaseEnv() {
  return {
    databaseUrl: process.env.DATABASE_URL,
    dbDialect: parseDialect(requireEnv('DB_DIALECT')),
    dbLogSql: parseBool(requireEnv('DB_LOG'), 'DB_LOG'),
    dbSsl: parseSslConfig(process.env.DB_SSL),
  };
}

function readSqliteDatabaseEnv(baseEnv: ReturnType<typeof readBaseDatabaseEnv>): DatabaseEnv {
  return {
    ...baseEnv,
    dbStorage: requireEnv('DB_STORAGE'),
  };
}

function readPostgresDatabaseEnv(baseEnv: ReturnType<typeof readBaseDatabaseEnv>): DatabaseEnv {
  if (baseEnv.databaseUrl) {
    return {
      ...baseEnv,
    };
  }

  return {
    ...baseEnv,
    dbName: requireEnv('DB_NAME'),
    dbUser: requireEnv('DB_USER'),
    dbPassword: requireEnv('DB_PASSWORD'),
    dbHost: requireEnv('DB_HOST'),
    dbPort: parsePort(requireEnv('DB_PORT'), 'DB_PORT'),
    dbMaintenanceDb: requireEnv('DB_MAINTENANCE_DB'),
  };
}

const databaseEnvReaders: Record<
  SupportedDialect,
  (baseEnv: ReturnType<typeof readBaseDatabaseEnv>) => DatabaseEnv
> = {
  postgres: readPostgresDatabaseEnv,
  sqlite: readSqliteDatabaseEnv,
};

function readDatabaseEnv(): DatabaseEnv {
  const baseEnv = readBaseDatabaseEnv();
  return databaseEnvReaders[baseEnv.dbDialect](baseEnv);
}

const env = readDatabaseEnv();

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function shouldEnsurePostgresDatabase(config: DatabaseEnv): boolean {
  return !config.databaseUrl && config.dbDialect === 'postgres';
}

function assertPostgresMaintenanceConfig(
  config: DatabaseEnv,
): asserts config is DatabaseEnv & {
  dbName: string;
  dbUser: string;
  dbHost: string;
  dbPort: number;
  dbMaintenanceDb: string;
} {
  const requiredConfig = [
    config.dbName,
    config.dbUser,
    config.dbHost,
    config.dbPort,
    config.dbMaintenanceDb,
  ];

  if (requiredConfig.every(Boolean)) {
    return;
  }

  throw new Error(
    'Missing required postgres config: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_MAINTENANCE_DB',
  );
}

function getMaintenanceSslConfig(config: DatabaseEnv) {
  if (config.dbSsl === false) {
    return false;
  }

  if (!config.dbSsl) {
    return undefined;
  }

  return { rejectUnauthorized: false };
}

async function postgresDatabaseExists(client: InstanceType<(typeof import('pg'))['Client']>, name: string) {
  const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
  return result.rowCount !== 0;
}

async function createDatabaseIfMissing(client: InstanceType<(typeof import('pg'))['Client']>, name: string) {
  const databaseExists = await postgresDatabaseExists(client, name);
  if (databaseExists) return;

  logger.info(`Database "${name}" not found. Creating it...`);
  await client.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
  logger.info(`✓ Database "${name}" created.`);
}

async function withPostgresMaintenanceClient(
  config: DatabaseEnv & {
    dbName: string;
    dbUser: string;
    dbHost: string;
    dbPort: number;
    dbMaintenanceDb: string;
  },
  callback: (client: InstanceType<(typeof import('pg'))['Client']>) => Promise<void>,
) {
  const { Client } = await import('pg');
  const client = new Client({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbMaintenanceDb,
    ssl: getMaintenanceSslConfig(config),
  });

  await client.connect();
  try {
    await callback(client);
  } finally {
    await client.end();
  }
}

async function ensurePostgresDatabaseExists() {
  if (!shouldEnsurePostgresDatabase(env)) return;

  assertPostgresMaintenanceConfig(env);
  await withPostgresMaintenanceClient(env, async (client) => createDatabaseIfMissing(client, env.dbName));
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

function shouldSkipRepeatedTestMigration() {
  return (
    process.env.NODE_ENV === 'test' &&
    process.env.TEST_PRESERVE_DB === 'true' &&
    migrationComplete
  );
}

async function authenticateDatabaseForMigration() {
  await ensurePostgresDatabaseExists();
  await sequelize.authenticate();
  logger.info('✓ Database connection authenticated.');
}

async function loadModelAssociations() {
  logger.debug('Loading model associations...');
  await import('../models/associations.js');
  logger.debug('✓ Model associations loaded.');
}

function shouldUseCliMigrations() {
  return process.env.USE_MIGRATIONS === 'true';
}

function isProductionEnv() {
  return process.env.NODE_ENV === 'production';
}

async function runCliMigrations() {
  const { execSync } = await import('child_process');
  logger.info('Running migrations via sequelize-cli...');
  execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
  logger.info('✓ Migrations completed successfully.');
}

async function runConfiguredMigrations() {
  if (!shouldUseCliMigrations()) {
    return false;
  }

  try {
    await runCliMigrations();
    migrationComplete = true;
    return true;
  } catch (mErr: unknown) {
    const migrateError = mErr as { message?: string; code?: string };
    logger.error('Failed to run sequelize migrations:', {
      message: migrateError.message,
      code: migrateError.code,
    });

    if (isProductionEnv()) {
      throw new Error(
        `Database migrations failed in production: ${migrateError.message || 'unknown error'}`,
      );
    }

    logger.info('Falling back to sequelize.sync...');
    return false;
  }
}

function getSyncMode() {
  return process.env.NODE_ENV === 'test' ? { force: true as const } : { alter: true as const };
}

async function syncDatabaseSchema() {
  if (isProductionEnv()) {
    throw new Error(
      'Refusing to run sequelize.sync in production. Set USE_MIGRATIONS=true and run migrations.',
    );
  }

  const dialect = sequelize.getDialect();
  const syncMode = getSyncMode();

  logger.info(`Syncing database with sequelize (dialect: ${dialect})...`);

  if ('force' in syncMode) {
    logger.debug('Using force: true for test environment');
  } else {
    logger.debug('Using alter: true for development environment');
  }

  await sequelize.sync(syncMode);
  logger.info('✓ Database synchronized successfully.');
  migrationComplete = true;
}

async function performAutoMigration() {
  logger.info('Starting database migration...');

  await authenticateDatabaseForMigration();
  await loadModelAssociations();

  if (await runConfiguredMigrations()) {
    return;
  }

  await syncDatabaseSchema();
}

async function runAutoMigrationIfNeeded() {
  if (shouldSkipRepeatedTestMigration()) {
    return;
  }

  await performAutoMigration();
}

export async function autoMigrate() {
  try {
    await runAutoMigrationIfNeeded();
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
