import feedBatchService from "../services/feedBatchService.js";
import feedBatchStatsService from "../services/feedBatchStatsService.js";
import type { NextFunction, Request, Response } from "express";

const feedController = {
  // Batches
  createBatch: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batch = await feedBatchService.createFeedBatch(req.body);
      res.status(201).json({ success: true, data: batch });
    } catch (err) {
      next(err);
    }
  },

  getAllBatches: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batches = await feedBatchService.getAllFeedBatches(req.query);
      res.json({ success: true, data: batches });
    } catch (err) {
      next(err);
    }
  },

  getBatchById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batch = await feedBatchService.getFeedBatchById(req.params.id);
      res.json({ success: true, data: batch });
    } catch (err) {
      next(err);
    }
  },

  updateBatch: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await feedBatchService.updateFeedBatch(
        req.params.id,
        req.body,
      );
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  deleteBatch: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await feedBatchService.deleteFeedBatch(req.params.id);
      res
        .status(200)
        .json({ success: true, message: "Feed batch deleted successfully" });
    } catch (error) {
      next(error);
    }
  },

  // Batch ingredients
  addIngredient: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ingredient = await feedBatchService.addBatchIngredient(
        req.params.id,
        req.body,
      );
      res.status(201).json({ success: true, data: ingredient });
    } catch (err) {
      next(err);
    }
  },

  getBatchIngredients: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const ingredients = await feedBatchService.getBatchIngredients(
        req.params.id,
      );
      res.json({ success: true, data: ingredients });
    } catch (err) {
      next(err);
    }
  },

  updateIngredient: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await feedBatchService.updateBatchIngredient(
        req.params.ingredientId,
        req.body,
      );
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  deleteIngredient: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await feedBatchService.removeBatchIngredient(req.params.ingredientId);
      res
        .status(200)
        .json({ success: true, message: "Ingredient deleted successfully" });
    } catch (error) {
      next(error);
    }
  },

  // Calculate batch cost
  calculateBatchCost: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { ingredients, bagSizeKg, miscellaneousCost } = req.body;
      const result = await feedBatchService.calculateBatchCost(
        ingredients,
        bagSizeKg || 50,
        miscellaneousCost || 0,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  // Get batch usage statistics
  getBatchUsageStats: async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const stats = await feedBatchStatsService.getAllBatchUsageStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },

  // Get individual batch usage stats
  getBatchUsageById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await feedBatchStatsService.getBatchUsageStats(
        req.params.id,
      );
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },
};

export default feedController;
