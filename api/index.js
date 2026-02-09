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

// Mount API routes - MUST come before catch-all
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Farm Manager API is running',
    timestamp: new Date().toISOString(),
    environment: 'production-serverless',
  });
});

// API error handler
app.use('/api', errorHandler);

// Initialize database and admin once per serverless instance
let initialized = false;

async function initialize() {
  if (initialized) return;
  
  try {
    logger.info('Initializing serverless environment...');
    
    // Initialize database
    await autoMigrate();
    logger.info('✓ Database migration completed.');

    // Initialize admin user
    await initializeAdmin();
    logger.info('✓ Admin user initialization completed.');

    initialized = true;
  } catch (err) {
    logger.error('Initialization failed:', err);
    throw err;
  }
}

// Initialize Next.js for frontend routes
const nextApp = next({ dev: false, dir: '.' });
const handle = nextApp.getRequestHandler();

let nextReady = false;

async function initializeNext() {
  if (nextReady) return;
  try {
    await nextApp.prepare();
    logger.info('✓ Next.js app prepared.');
    nextReady = true;
  } catch (err) {
    logger.error('Failed to initialize Next.js:', err);
    throw err;
  }
}

// Handle frontend requests with Next.js
app.all('*', async (req, res) => {
  try {
    await initialize();
    await initializeNext();
    return handle(req, res);
  } catch (err) {
    logger.error(`Error handling ${req.method} ${req.path}:`, err);
    res.status(500).json({
      success: false,
      error: { message: 'Internal Server Error' },
    });
  }
});

// Export handler for Vercel
