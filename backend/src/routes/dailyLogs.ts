import express from "express";
import dailyLogController from "../controllers/dailyLogController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";
import {
  validateCreateDailyLog,
  validateUpdateDailyLog,
  validateDailyLogQueries,
  validateId,
  handleValidation,
} from "../middleware/validation.js";

const router = express.Router();

// Apply authentication to all daily log routes
router.use(authenticate);

// GET - both owner and staff can read
router.get(
  "/",
  authorize(PERMISSIONS.DAILY_LOGS.READ),
  validateDailyLogQueries,
  handleValidation,
  dailyLogController.getAll
);

router.get("/:id", authorize(PERMISSIONS.DAILY_LOGS.READ), validateId, handleValidation, dailyLogController.getById);

// POST - both owner and staff can create
router.post(
  "/",
  authorize(PERMISSIONS.DAILY_LOGS.CREATE),
  validateCreateDailyLog,
  handleValidation,
  dailyLogController.create
);

// PUT - both owner and staff can update
router.put(
  "/:id",
  authorize(PERMISSIONS.DAILY_LOGS.UPDATE),
  validateUpdateDailyLog,
  handleValidation,
  dailyLogController.update
);

// DELETE - owner only
router.delete("/:id", authorize(PERMISSIONS.DAILY_LOGS.DELETE), validateId, handleValidation, dailyLogController.delete);

export default router;
