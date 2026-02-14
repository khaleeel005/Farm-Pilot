import express from "express";
import laborController from "../controllers/laborController.js";
import {
  validateCreateLaborer,
  validateUpdateLaborer,
  validateCreateWorkAssignment,
  validateUpdateWorkAssignment,
  validateGeneratePayroll,
  handleValidation,
} from "../middleware/validation.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";

const router = express.Router();

// Laborers
router.get(
  "/laborers",
  authenticate,
  authorize(PERMISSIONS.LABORERS.READ),
  laborController.getAll
);
router.post(
  "/laborers",
  authenticate,
  authorize(PERMISSIONS.LABORERS.CREATE),
  validateCreateLaborer,
  handleValidation,
  laborController.create
);
router.put(
  "/laborers/:id",
  authenticate,
  authorize(PERMISSIONS.LABORERS.UPDATE),
  validateUpdateLaborer,
  handleValidation,
  laborController.update
);
router.delete(
  "/laborers/:id",
  authenticate,
  authorize(PERMISSIONS.LABORERS.DELETE),
  laborController.delete
);

// Work assignments
router.get(
  "/work-assignments",
  authenticate,
  authorize(PERMISSIONS.WORK_ASSIGNMENTS.READ),
  laborController.getAssignments
);
router.post(
  "/work-assignments",
  authenticate,
  authorize(PERMISSIONS.WORK_ASSIGNMENTS.CREATE),
  validateCreateWorkAssignment,
  handleValidation,
  laborController.createAssignment
);
router.put(
  "/work-assignments/:id",
  authenticate,
  authorize(PERMISSIONS.WORK_ASSIGNMENTS.UPDATE),
  validateUpdateWorkAssignment,
  handleValidation,
  laborController.updateAssignment
);

// Payroll - owner only for generate/update, both can read
router.get(
  "/payroll/summary",
  authenticate,
  authorize(PERMISSIONS.PAYROLL.READ),
  laborController.payrollSummary
);

router.get(
  "/payroll/:month_year",
  authenticate,
  authorize(PERMISSIONS.PAYROLL.READ),
  laborController.getPayrollMonth
);
router.post(
  "/payroll/generate/:month_year",
  authenticate,
  authorize(PERMISSIONS.PAYROLL.CREATE),
  validateGeneratePayroll,
  handleValidation,
  laborController.generatePayroll
);
router.put(
  "/payroll/:id",
  authenticate,
  authorize(PERMISSIONS.PAYROLL.UPDATE),
  laborController.updatePayroll
);

export default router;
