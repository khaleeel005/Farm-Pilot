import { sequelize } from './database.js';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { asEntity } from './modelHelpers.js';
import type { UserEntity } from '../types/entities.js';

/**
 * Initialize admin user if it doesn't exist
 * Uses environment variables: ADMIN_USERNAME, ADMIN_PASSWORD
 */
async function initializeAdmin() {
  try {
    logger.debug('Starting admin user initialization...');

    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
      const missingVars = [];
      if (!username) missingVars.push('ADMIN_USERNAME');
      if (!password) missingVars.push('ADMIN_PASSWORD');
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Check if database is connected
    await sequelize.authenticate();
    logger.debug('Database connection verified.');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { username },
    });
    const typedExistingAdmin = asEntity<UserEntity>(existingAdmin);

    if (typedExistingAdmin) {
      logger.info(
        `Admin user '${typedExistingAdmin.username}' already exists, skipping initialization.`
      );
      return;
    }

    // Hash password and create admin user
    logger.debug(`Creating admin user '${username}'...`);
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = asEntity<UserEntity>(await User.create({
      username,
      password: hashedPassword,
      role: 'owner',
    }));

    logger.info(`Admin user '${admin?.username}' created successfully with ID: ${admin?.id}`);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to initialize admin user:', {
      message: err.message,
      stack: err.stack,
    });
    throw error;
  }
}

export { initializeAdmin };
