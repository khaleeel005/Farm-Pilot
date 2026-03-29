import type { NextFunction, Request, Response } from "express";
import inventoryService from "../services/inventoryService.js";
import EggAdjustment from "../models/EggAdjustment.js";
import { BadRequestError } from "../utils/exceptions.js";

const inventoryController = {
  getEggInventory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };

      if (!startDate || !endDate) {
        throw new BadRequestError("startDate and endDate query params are required");
      }

      const summary = await inventoryService.getEggInventory(startDate, endDate);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  },

  createEggAdjustment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date, quantity, reason } = req.body;
      const user = (req as any).user;

      if (!date || quantity === undefined) {
        throw new BadRequestError("date and quantity are required");
      }

      const adjustment = await EggAdjustment.create({
        date,
        quantity: Number(quantity),
        reason: reason || null,
        userId: user?.id || null,
      });

      res.status(201).json({ success: true, data: adjustment });
    } catch (error) {
      next(error);
    }
  },
};

export default inventoryController;
