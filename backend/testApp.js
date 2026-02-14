import "./dist/config/loadEnv.js";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import errorHandler from "./dist/middleware/errorHandler.js";
import requestLogger from "./dist/middleware/logger.js";
import routes from "./dist/routes/index.js";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

function parseOrigins(raw) {
  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  if (origins.length === 0) {
    throw new Error("FRONTEND_URL must contain at least one origin");
  }
  return origins;
}

const nodeEnv = requireEnv("NODE_ENV");
const isDevelopment = nodeEnv !== "production";
const frontendOrigins = parseOrigins(requireEnv("FRONTEND_URL"));

const app = express();

if (!isDevelopment) {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 1000 : 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 100 : 10,
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);

app.use(
  cors({
    origin: frontendOrigins,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use("/api", requestLogger);
app.use("/api", routes);
app.use("/api", errorHandler);

export default app;
