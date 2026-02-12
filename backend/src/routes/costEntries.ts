import express from "express";
import costEntryController from "../controllers/costEntryController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";
import {
  validateCostEntry,
  validateCostEntryUpdate,
} from "../validations/costEntryValidation.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// GET - both owner and staff can read
router.get("/types", authorize(PERMISSIONS.COST_ENTRIES.READ), costEntryController.getCostTypes);

router.get("/summary", authorize(PERMISSIONS.COST_ENTRIES.READ), costEntryController.getCostSummary);

router.get("/", authorize(PERMISSIONS.COST_ENTRIES.READ), costEntryController.getCostEntries);

router.get("/:id", authorize(PERMISSIONS.COST_ENTRIES.READ), costEntryController.getCostEntry);

// POST - owner only
router.post("/", authorize(PERMISSIONS.COST_ENTRIES.CREATE), validateCostEntry, costEntryController.createCostEntry);

// PUT - owner only
router.put(
  "/:id",
  authorize(PERMISSIONS.COST_ENTRIES.UPDATE),
  validateCostEntryUpdate,
  costEntryController.updateCostEntry
);

// DELETE - owner only
router.delete("/:id", authorize(PERMISSIONS.COST_ENTRIES.DELETE), costEntryController.deleteCostEntry);

export default router;
