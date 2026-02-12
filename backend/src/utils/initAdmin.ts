import { sequelize } from './database.js';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Initialize admin user if it doesn't exist
 * Uses environment variables: ADMIN_USERNAME, ADMIN_PASSWORD
 */
async function initializeAdmin() {
  try {
    logger.debug('Starting admin user initialization...');

    // Check if database is connected
    await sequelize.authenticate();
    logger.debug('Database connection verified.');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { username: process.env.ADMIN_USERNAME || 'admin' },
    });

    if (existingAdmin) {
      logger.info(
        `Admin user '${existingAdmin.username}' already exists, skipping initialization.`
      );
      return;
    }

    // Get credentials from environment variables
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    // Validate credentials are provided
    if (!username || !password) {
      const missingVars = [];
      if (!username) missingVars.push('ADMIN_USERNAME');
      if (!password) missingVars.push('ADMIN_PASSWORD');
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Hash password and create admin user
    logger.debug(`Creating admin user '${username}'...`);
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      username,
      password: hashedPassword,
      role: 'owner',
    });

    logger.info(`Admin user '${admin.username}' created successfully with ID: ${admin.id}`);
  } catch (error) {
    logger.error('Failed to initialize admin user:', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export { initializeAdmin };
