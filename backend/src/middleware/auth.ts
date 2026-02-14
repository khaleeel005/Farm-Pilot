import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import config from "../config/auth.js";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (
      typeof decoded === "string" ||
      decoded.id === undefined ||
      decoded.role === undefined
    ) {
      res.status(401).json({ message: "Invalid token payload." });
      return;
    }

    req.user = {
      id: Number(decoded.id),
      role: String(decoded.role),
      username: typeof decoded.username === "string" ? decoded.username : undefined,
    };
    next();
  } catch {
    res.status(401).json({ message: "Invalid token." });
    return;
  }
};

export const authorize = (roles: readonly string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
      return;
    }
    next();
  };
};
