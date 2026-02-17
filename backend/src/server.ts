import "./config/loadEnv.js";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import { autoMigrate } from "./utils/database.js";
import { initializeAdmin } from "./utils/initAdmin.js";
import errorHandler from "./middleware/errorHandler.js";
import requestLogger from "./middleware/logger.js";
import logger from "./config/logger.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

function parseOrigins(raw: string): string[] {
  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    throw new Error("FRONTEND_URL must contain at least one origin");
  }

  return origins;
}

const NODE_ENV = requireEnv("NODE_ENV");
const dev = NODE_ENV !== "production";
const PORT = Number.parseInt(requireEnv("PORT"), 10);
const FRONTEND_URLS = parseOrigins(requireEnv("FRONTEND_URL"));

if (Number.isNaN(PORT)) {
  throw new Error("PORT must be a valid integer");
}

const app = express();

// Trust proxy for cloud platforms (needed for rate limiting and IP detection)
if (!dev) {
  app.set("trust proxy", 1);
}

// CORS - allow frontend origin (must be before other middleware)
app.use(
  cors({
    origin: FRONTEND_URLS,
    credentials: true,
  }),
);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// Rate limiting - higher limit in development, stricter in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: dev ? 1000 : 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes only
app.use("/api", limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: dev ? 100 : 10,
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
});
app.use("/api/auth/login", authLimiter);

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Request logger for API routes
app.use("/api", requestLogger);

// Mount API routes
app.use("/api", routes);

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Farm Manager API is running",
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: NODE_ENV,
  });
});

// API error handler
app.use("/api", errorHandler);

// Start server
(async () => {
  try {
    logger.info("==================================================");
    logger.info("Farm Manager Backend API Starting");
    logger.info("==================================================");
    logger.info(`Environment: ${NODE_ENV}`);
    logger.info(`Node Version: ${process.version}`);
    logger.info(`Port: ${PORT}`);
    logger.info(`Frontend URLs: ${FRONTEND_URLS.join(", ")}`);

    // Initialize database
    logger.info("Initializing database...");
    await autoMigrate();
    logger.info("✓ Database migration completed.");

    // Initialize admin user
    logger.info("Initializing admin user...");
    await initializeAdmin();
    logger.info("✓ Admin user initialization completed.");

    app.listen(PORT, () => {
      logger.info("==================================================");
      logger.info(`✓ API Server is ready on port ${PORT}`);
      logger.info("  - API endpoints: /api/*");
      logger.info("  - Health check: /api/health");
      logger.info("==================================================");
    });
  } catch (err) {
    const startupError = err as Error & { code?: string };
    logger.error("==================================================");
    logger.error("✗ Failed to start the server");
    logger.error("==================================================");
    logger.error("Error details:", {
      message: startupError.message,
      code: startupError.code,
      stack: startupError.stack,
    });
    process.exit(1);
  }
})();
