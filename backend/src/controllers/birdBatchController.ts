import birdBatchService from "../services/birdBatchService.js";
import type { NextFunction, Request, Response } from "express";

const birdBatchController = {
  listByHouse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batches = await birdBatchService.listHouseBatches(req.params.id);
      res.status(200).json({ success: true, data: batches });
    } catch (error) {
      next(error);
    }
  },

  createForHouse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batch = await birdBatchService.createHouseBatch(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: batch,
        message: "Bird batch created successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};

export default birdBatchController;
