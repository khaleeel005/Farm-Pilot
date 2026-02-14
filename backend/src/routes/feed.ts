import express from "express";
import type { NextFunction, Request, Response } from "express";
import feedController from "../controllers/feedController.js";
import {
  validateCreateFeedBatch,
  validateAddBatchIngredient,
  validateId,
  handleValidation,
} from "../middleware/validation.js";
import { validateBatchCostCalculation } from "../validations/feed.js";
import { param, body } from "express-validator";
import feedRecipeService from "../services/feedRecipeService.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { PERMISSIONS } from "../config/roles.js";

const validateBatchAndIngredientIds = [
  param("batchId")
    .isInt({ min: 1 })
    .withMessage("batchId must be a positive integer"),
  param("ingredientId")
    .isInt({ min: 1 })
    .withMessage("ingredientId must be a positive integer"),
];

const validateCreateRecipe = [
  body("recipeName").notEmpty().withMessage("Recipe name is required"),
  body("cornPercent").isNumeric().withMessage("Corn percent must be a number"),
  body("soybeanPercent")
    .isNumeric()
    .withMessage("Soybean percent must be a number"),
  body("wheatBranPercent")
    .isNumeric()
    .withMessage("Wheat bran percent must be a number"),
  body("limestonePercent")
    .isNumeric()
    .withMessage("Limestone percent must be a number"),
];

const router = express.Router();

// Apply authentication to all feed routes
router.use(authenticate);

// Recipes - READ: owner+staff, WRITE: owner only
router.post(
  "/recipes",
  authorize(PERMISSIONS.FEED.CREATE),
  validateCreateRecipe,
  handleValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const recipe = await feedRecipeService.createFeedRecipe(req.body);
      res.status(201).json({ success: true, data: recipe });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/recipes",
  authorize(PERMISSIONS.FEED.READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const recipes = await feedRecipeService.getAllFeedRecipes(req.query);
      res.json({ success: true, data: recipes });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/recipes/:id",
  authorize(PERMISSIONS.FEED.READ),
  validateId,
  handleValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const recipe = await feedRecipeService.getFeedRecipeById(req.params.id);
      res.json({ success: true, data: recipe });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/recipes/:id",
  authorize(PERMISSIONS.FEED.UPDATE),
  validateId,
  handleValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await feedRecipeService.updateFeedRecipe(
        req.params.id,
        req.body
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/recipes/:id",
  authorize(PERMISSIONS.FEED.DELETE),
  validateId,
  handleValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await feedRecipeService.deleteFeedRecipe(req.params.id);
      res.json({ success: true, message: "Recipe deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

// Batches - READ: owner+staff, WRITE: owner only
router.post(
  "/batches",
  authorize(PERMISSIONS.FEED.CREATE),
  validateCreateFeedBatch,
  handleValidation,
  feedController.createBatch
);

router.get("/batches", authorize(PERMISSIONS.FEED.READ), feedController.getAllBatches);

router.get(
  "/batches/:id",
  authorize(PERMISSIONS.FEED.READ),
  validateId,
  handleValidation,
  feedController.getBatchById
);

router.put(
  "/batches/:id",
  authorize(PERMISSIONS.FEED.UPDATE),
  validateId,
  handleValidation,
  feedController.updateBatch
);

router.delete(
  "/batches/:id",
  authorize(PERMISSIONS.FEED.DELETE),
  validateId,
  handleValidation,
  feedController.deleteBatch
);

// Batch ingredients - READ: owner+staff, WRITE: owner only
router.post(
  "/batches/:id/ingredients",
  authorize(PERMISSIONS.FEED.CREATE),
  validateAddBatchIngredient,
  handleValidation,
  feedController.addIngredient
);

router.get(
  "/batches/:id/ingredients",
  authorize(PERMISSIONS.FEED.READ),
  validateId,
  handleValidation,
  feedController.getBatchIngredients
);

router.put(
  "/batches/:batchId/ingredients/:ingredientId",
  authorize(PERMISSIONS.FEED.UPDATE),
  validateBatchAndIngredientIds,
  handleValidation,
  feedController.updateIngredient
);

router.delete(
  "/batches/:batchId/ingredients/:ingredientId",
  authorize(PERMISSIONS.FEED.DELETE),
  validateBatchAndIngredientIds,
  handleValidation,
  feedController.deleteIngredient
);

// Calculate batch cost without creating - read-only, both roles
router.post(
  "/batches/calculate-cost",
  authorize(PERMISSIONS.FEED.READ),
  validateBatchCostCalculation,
  handleValidation,
  feedController.calculateBatchCost
);

router.post(
  "/estimate-cost",
  authorize(PERMISSIONS.FEED.READ),
  validateBatchCostCalculation,
  handleValidation,
  feedController.calculateBatchCost
);

router.post(
  "/batches/estimate",
  authorize(PERMISSIONS.FEED.READ),
  validateBatchCostCalculation,
  handleValidation,
  feedController.calculateBatchCost
);

// Batch usage statistics - read-only, both roles
router.get("/batches-usage", authorize(PERMISSIONS.FEED.READ), feedController.getBatchUsageStats);

router.get(
  "/batches/:id/usage",
  authorize(PERMISSIONS.FEED.READ),
  validateId,
  handleValidation,
  feedController.getBatchUsageById
);

export default router;
