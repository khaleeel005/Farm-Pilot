import logger from "../config/logger.js";

/**
 * Global error handling middleware for Express.
 */
export default function errorHandler(err, req, res, next) {
  // Only log errors in non-test environments
  if (process.env.NODE_ENV !== "test") {
    logger.error(`${err.message} - ${req.method} ${req.url} - ${req.ip}`);
    logger.debug(err.stack); // Log the full stack trace in debug mode
  }

  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
    },
  });
}
