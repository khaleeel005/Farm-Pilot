import { query, param } from "express-validator";

export const validateProductionReport = [
  query("start")
    .isISO8601()
    .withMessage("start must be a valid date (YYYY-MM-DD)"),
  query("end").isISO8601().withMessage("end must be a valid date (YYYY-MM-DD)"),
];

export const validateSalesReport = [
  query("start")
    .isISO8601()
    .withMessage("start must be a valid date (YYYY-MM-DD)"),
  query("end").isISO8601().withMessage("end must be a valid date (YYYY-MM-DD)"),
];

export const validateFinancialReport = [
  query("start")
    .isISO8601()
    .withMessage("start must be a valid date (YYYY-MM-DD)"),
  query("end").isISO8601().withMessage("end must be a valid date (YYYY-MM-DD)"),
];

export const validateReportExport = [
  param("type")
    .isIn(["production", "sales", "financial"])
    .withMessage("type must be one of: production, sales, financial"),
  query("start")
    .isISO8601()
    .withMessage("start must be a valid date (YYYY-MM-DD)"),
  query("end").isISO8601().withMessage("end must be a valid date (YYYY-MM-DD)"),
  query("format")
    .isIn(["csv", "pdf"])
    .withMessage("format must be one of: csv, pdf"),
];
