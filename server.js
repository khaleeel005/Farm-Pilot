import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import next from "next";
import routes from "./src/routes/index.js";
import { autoMigrate } from "./src/utils/database.js";
import errorHandler from "./src/middleware/errorHandler.js";
import requestLogger from "./src/middleware/logger.js";
import logger from "./src/config/logger.js";

const dev = process.env.NODE_ENV !== "production";
const PORT = process.env.PORT || 5001;

const app = express();

// Trust proxy for cloud platforms (needed for rate limiting and IP detection)
if (!dev) {
  app.set("trust proxy", 1);
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

// CORS - more permissive since frontend is same-origin in production
app.use(
  cors({
    origin: dev
      ? ["http://localhost:3000", "http://localhost:3001", "http://localhost:5001"]
      : true, // Same origin in production
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Request logger for API routes
app.use("/api", requestLogger);

// Mount API routes
app.use("/api", routes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Farm Manager API is running",
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || "development",
  });
});

// API error handler
app.use("/api", errorHandler);

// Start server
(async () => {
  try {
    // Initialize database
    await autoMigrate();
    logger.info("Database migration completed.");

    if (dev) {
      // Development mode: Just run Express API server
      // Next.js runs separately via `next dev` and proxies to this
      app.listen(PORT, () => {
        logger.info(`API Server running on http://localhost:${PORT}`);
        logger.info("Run 'npm run dev:next' in another terminal for frontend");
      });
    } else {
      // Production mode: Express serves Next.js
      const nextApp = next({ dev: false, dir: "." });
      const handle = nextApp.getRequestHandler();

      await nextApp.prepare();
      logger.info("Next.js app prepared for production.");

      // Let Next.js handle all non-API routes
      app.all("*", (req, res) => {
        return handle(req, res);
      });

      app.listen(PORT, () => {
        logger.info(`Farm Manager running on http://localhost:${PORT}`);
        logger.info(`Environment: production`);
      });
    }
  } catch (err) {
    logger.error("Failed to start the server:", err);
    process.exit(1);
  }
})();
