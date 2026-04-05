import express from "express";
import costController from "../controllers/costController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";
import { param, query, body } from "express-validator";
import { handleValidation } from "../middleware/validation.js";

const router = express.Router();

// Apply authentication to all cost routes
router.use(authenticate);

// GET routes - both owner and staff can read
router.get(
  "/daily/:date",
  authorize(PERMISSIONS.COSTS.READ),
  [
    param("date").isISO8601().withMessage("date must be YYYY-MM-DD"),
    handleValidation,
  ],
  costController.getDaily
);

router.get(
  "/summary",
  authorize(PERMISSIONS.COSTS.READ),
  [
    query("start").isISO8601().withMessage("start is required"),
    query("end").isISO8601().withMessage("end is required"),
    handleValidation,
  ],
  costController.getSummary
);

router.get(
  "/egg-price/:date",
  authorize(PERMISSIONS.COSTS.READ),
  [
    param("date").isISO8601().withMessage("date must be YYYY-MM-DD"),
    handleValidation,
  ],
  costController.getEggPrice
);

router.get(
  "/daily-calculation/:date",
  authorize(PERMISSIONS.COSTS.READ),
  [
    param("date").isISO8601().withMessage("date must be YYYY-MM-DD"),
    handleValidation,
  ],
  costController.getDailyCalculation
);

router.get(
  "/avg-production/:date",
  authorize(PERMISSIONS.COSTS.READ),
  [
    param("date").isISO8601().withMessage("date must be YYYY-MM-DD"),
    handleValidation,
  ],
  costController.getAverageMonthlyProduction
);

router.get(
  "/health-cost/:date",
  authorize(PERMISSIONS.COSTS.READ),
  [
    param("date").isISO8601().withMessage("date must be YYYY-MM-DD"),
    handleValidation,
  ],
  costController.getHealthCostPerEgg
);

router.get(
  "/bird-costs",
  authorize(PERMISSIONS.COSTS.READ),
  costController.getBirdCosts
);

router.post(
  "/bird-costs",
  authorize(PERMISSIONS.COSTS.WRITE),
  [
    body("batchDate").isISO8601().withMessage("batchDate must be YYYY-MM-DD"),
    body("birdsPurchased")
      .isInt({ min: 1 })
      .withMessage("birdsPurchased must be a positive integer"),
    body("costPerBird")
      .isFloat({ min: 0 })
      .withMessage("costPerBird must be a non-negative number"),
    body("vaccinationCostPerBird")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("vaccinationCostPerBird must be a non-negative number"),
    body("expectedLayingMonths")
      .optional()
      .isInt({ min: 1 })
      .withMessage("expectedLayingMonths must be a positive integer"),
    handleValidation,
  ],
  costController.createBirdCost
);

// POST - owner only for creating operating costs
router.post(
  "/operating",
  authorize(PERMISSIONS.COSTS.WRITE),
  [
    body("monthYear")
      .isISO8601()
      .withMessage("monthYear is required (YYYY-MM-DD)"),
    handleValidation,
  ],
  costController.createOperating
);

export default router;
