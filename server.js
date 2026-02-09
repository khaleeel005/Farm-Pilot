import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import next from 'next';
import routes from './src/routes/index.js';
import { autoMigrate } from './src/utils/database.js';
import { initializeAdmin } from './src/utils/initAdmin.js';
import errorHandler from './src/middleware/errorHandler.js';
import requestLogger from './src/middleware/logger.js';
import logger from './src/config/logger.js';

const dev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 5001;

const app = express();

// Trust proxy for cloud platforms (needed for rate limiting and IP detection)
if (!dev) {
  app.set('trust proxy', 1);
}

// Security middleware - configure for Next.js compatibility
app.use(
  helmet({
    contentSecurityPolicy: false, // Next.js handles its own CSP
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

// CORS - more permissive since frontend is same-origin in production
app.use(
  cors({
    origin: dev
      ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5001']
      : true, // Same origin in production
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
app.get('/api/health', (req, res) => {
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
    logger.info('Farm Manager Server Starting');
    logger.info('==================================================');
    logger.info(`Environment: ${dev ? 'development' : 'production'}`);
    logger.info(`Node Version: ${process.version}`);
    logger.info(`Port: ${PORT}`);

    // Initialize database
    logger.info('Initializing database...');
    await autoMigrate();
    logger.info('✓ Database migration completed.');

    // Initialize admin user
    logger.info('Initializing admin user...');
    await initializeAdmin();
    logger.info('✓ Admin user initialization completed.');

    if (dev) {
      // Development mode: Just run Express API server
      // Next.js runs separately via `next dev` and proxies to this
      logger.info('\nDevelopment Mode:');
      logger.info('- API Server will run on http://localhost:' + PORT);
      logger.info('- Next.js frontend should run in another terminal');
      logger.info('- Use: npm run dev:next');

      app.listen(PORT, () => {
        logger.info('==================================================');
        logger.info(`✓ API Server is ready on http://localhost:${PORT}`);
        logger.info('==================================================');
      });
    } else {
      // Production mode: Express serves Next.js
      logger.info('Preparing Next.js app for production...');
      const nextApp = next({ dev: false, dir: '.' });
      const handle = nextApp.getRequestHandler();

      await nextApp.prepare();
      logger.info('✓ Next.js app prepared for production.');

      // Let Next.js handle all non-API routes
      app.all('*', (req, res) => {
        return handle(req, res);
      });

      app.listen(PORT, () => {
        logger.info('==================================================');
        logger.info(`✓ Farm Manager is ready on http://localhost:${PORT}`);
        logger.info('  - API: /api/*');
        logger.info('  - Frontend: /');
        logger.info('==================================================');
      });
    }
  } catch (err) {
    logger.error('==================================================');
    logger.error('✗ Failed to start the server');
    logger.error('==================================================');
    logger.error('Error details:', {
      message: err.message,
      code: err.code,
      stack: err.stack,
    });
    process.exit(1);
  }
})();
