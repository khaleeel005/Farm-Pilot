import express from "express";
import { handleValidation } from "../middleware/validation.js";
import {
  validateProductionReport,
  validateSalesReport,
  validateFinancialReport,
  validateReportExport,
} from "../validations/reports.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";
import reportController from "../controllers/reportController.js";

const router = express.Router();

router.get(
  "/production",
  validateProductionReport,
  handleValidation,
  authenticate,
  authorize(PERMISSIONS.REPORTS.READ),
  reportController.production
);

router.get(
  "/sales",
  validateSalesReport,
  handleValidation,
  authenticate,
  authorize(PERMISSIONS.REPORTS.READ),
  reportController.sales
);

router.get(
  "/financial",
  validateFinancialReport,
  handleValidation,
  authenticate,
  authorize(PERMISSIONS.REPORTS.READ),
  reportController.financial
);

router.get(
  "/export/:type",
  validateReportExport,
  handleValidation,
  authenticate,
  authorize(PERMISSIONS.REPORTS.EXPORT),
  reportController.export
);

export default router;
