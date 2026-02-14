import logger from "../config/logger.js";
import type { NextFunction, Request, Response } from "express";
import type { CustomError } from "../utils/exceptions.js";

/**
 * Global error handling middleware for Express.
 */
export default function errorHandler(
  err: Partial<CustomError> & { message?: string; stack?: string },
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Only log errors in non-test environments
  if (process.env.NODE_ENV !== "test") {
    logger.error(`${err.message} - ${req.method} ${req.url} - ${req.ip}`);
    logger.debug(err.stack); // Log the full stack trace in debug mode
  }

  const statusCode = err.status ?? 500;
  const message = err.message ?? "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
    },
  });
}
