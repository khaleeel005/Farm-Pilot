import { body, validationResult } from "express-validator";
import type { NextFunction, Request, Response } from "express";
import { CostTypes } from "../models/CostEntry.js";

export const validateCostEntry = [
  body("date")
    .isISO8601()
    .toDate()
    .withMessage("Date must be a valid ISO date"),

  body("costType")
    .isIn(Object.values(CostTypes))
    .withMessage("Cost type must be a valid cost type"),

  body("description")
    .isLength({ min: 3, max: 255 })
    .trim()
    .withMessage("Description must be between 3 and 255 characters"),

  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),

  body("category")
    .optional()
    .isIn(["operational", "capital", "emergency"])
    .withMessage("Category must be operational, capital, or emergency"),

  body("paymentMethod")
    .optional()
    .isIn(["cash", "bank_transfer", "check", "card", "mobile_money"])
    .withMessage("Payment method must be valid"),

  body("vendor")
    .optional()
    .isLength({ max: 255 })
    .trim()
    .withMessage("Vendor name must be less than 255 characters"),

  body("receiptNumber")
    .optional()
    .isLength({ max: 100 })
    .trim()
    .withMessage("Receipt number must be less than 100 characters"),

  body("notes")
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage("Notes must be less than 1000 characters"),

  body("houseId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("House ID must be a positive integer"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];

export const validateCostEntryUpdate = [
  body("date")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Date must be a valid ISO date"),

  body("costType")
    .optional()
    .isIn(Object.values(CostTypes))
    .withMessage("Cost type must be a valid cost type"),

  body("description")
    .optional()
    .isLength({ min: 3, max: 255 })
    .trim()
    .withMessage("Description must be between 3 and 255 characters"),

  body("amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),

  body("category")
    .optional()
    .isIn(["operational", "capital", "emergency"])
    .withMessage("Category must be operational, capital, or emergency"),

  body("paymentMethod")
    .optional()
    .isIn(["cash", "bank_transfer", "check", "card", "mobile_money"])
    .withMessage("Payment method must be valid"),

  body("vendor")
    .optional()
    .isLength({ max: 255 })
    .trim()
    .withMessage("Vendor name must be less than 255 characters"),

  body("receiptNumber")
    .optional()
    .isLength({ max: 100 })
    .trim()
    .withMessage("Receipt number must be less than 100 characters"),

  body("notes")
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .withMessage("Notes must be less than 1000 characters"),

  body("houseId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("House ID must be a positive integer"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];
