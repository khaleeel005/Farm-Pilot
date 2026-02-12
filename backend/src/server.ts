import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { autoMigrate } from './utils/database.js';
import { initializeAdmin } from './utils/initAdmin.js';
import errorHandler from './middleware/errorHandler.js';
import requestLogger from './middleware/logger.js';
import logger from './config/logger.js';

const dev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const app = express();

// Trust proxy for cloud platforms (needed for rate limiting and IP detection)
if (!dev) {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiting - higher limit in development, stricter in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: dev ? 1000 : 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes only
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: dev ? 100 : 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
});
app.use('/api/auth/login', authLimiter);

// CORS - allow frontend origin
app.use(
  cors({
    origin: dev ? [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'] : FRONTEND_URL,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logger for API routes
app.use('/api', requestLogger);

// Mount API routes
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Farm Manager API is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
});

// API error handler
app.use('/api', errorHandler);

// Start server
(async () => {
  try {
    logger.info('==================================================');
    logger.info('Farm Manager Backend API Starting');
    logger.info('==================================================');
    logger.info(`Environment: ${dev ? 'development' : 'production'}`);
    logger.info(`Node Version: ${process.version}`);
    logger.info(`Port: ${PORT}`);
    logger.info(`Frontend URL: ${FRONTEND_URL}`);

    // Initialize database
    logger.info('Initializing database...');
    await autoMigrate();
    logger.info('✓ Database migration completed.');

    // Initialize admin user
    logger.info('Initializing admin user...');
    await initializeAdmin();
    logger.info('✓ Admin user initialization completed.');

    app.listen(PORT, () => {
      logger.info('==================================================');
      logger.info(`✓ API Server is ready on http://localhost:${PORT}`);
      logger.info('  - API endpoints: /api/*');
      logger.info('  - Health check: /api/health');
      logger.info('==================================================');
    });
  } catch (err) {
    logger.error('==================================================');
    logger.error('✗ Failed to start the server');
    logger.error('==================================================');
    logger.error('Error details:', {
      message: (err as Error).message,
      code: (err as any).code,
      stack: (err as Error).stack,
    });
    process.exit(1);
  }
})();
