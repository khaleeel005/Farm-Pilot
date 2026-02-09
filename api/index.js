/**
 * Vercel Serverless Function
 * This entry point allows Vercel to run the Express + Next.js server
 * in a serverless environment
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import next from 'next';
import routes from '../src/routes/index.js';
import { autoMigrate } from '../src/utils/database.js';
import { initializeAdmin } from '../src/utils/initAdmin.js';
import errorHandler from '../src/middleware/errorHandler.js';
import requestLogger from '../src/middleware/logger.js';
import logger from '../src/config/logger.js';

const app = express();
const dev = false; // Always production in serverless
const PORT = process.env.PORT || 3000;

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
});
app.use('/api/auth/login', authLimiter);

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logger
app.use('/api', requestLogger);

// Mount API routes
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Farm Manager API is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: 'production-serverless',
  });
});

// API error handler
app.use('/api', errorHandler);

// Initialize Next.js
const nextApp = next({ dev: false, dir: '.' });
const handle = nextApp.getRequestHandler();

// Prepare Next.js
let initialized = false;

async function initialize() {
  if (initialized) return;
  initialized = true;

  try {
    logger.info('Initializing serverless environment...');
    
    // Initialize database
    await autoMigrate();
    logger.info('✓ Database migration completed.');

    // Initialize admin user
    await initializeAdmin();
    logger.info('✓ Admin user initialization completed.');

    // Prepare Next.js
    await nextApp.prepare();
    logger.info('✓ Next.js app prepared.');
  } catch (err) {
    logger.error('Initialization failed:', err);
    throw err;
  }
}

// Handle all other routes with Next.js
app.all('*', async (req, res) => {
  await initialize();
  logger.debug(`Next.js handling: ${req.method} ${req.path}`);
  return handle(req, res);
});

// Default export for Vercel
export default app;
