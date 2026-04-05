import costService from "../services/costService.js";
import type { NextFunction, Request, Response } from "express";
import { queryString } from "../utils/parsers.js";
import { BadRequestError } from "../utils/exceptions.js";

const costController = {
  getDaily: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const date = req.params.date || queryString(req.query.date);
      const data = await costService.getDailyCosts(date);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const start = queryString(req.query.start);
      const end = queryString(req.query.end);
      const data = await costService.getSummary(start, end);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  createOperating: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const oc = await costService.createOperatingCosts(req.body);
      res.status(201).json({ success: true, data: oc });
    } catch (err) {
      next(err);
    }
  },

  getBirdCosts: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await costService.getBirdCosts();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  createBirdCost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await costService.createBirdCost(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getEggPrice: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const date = req.params.date;
      const data = await costService.getEggPriceEstimate(date);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getHealthCostPerEgg: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const date = req.params.date;
      if (!date) {
        throw new BadRequestError("date is required");
      }

      const healthCostPerEgg = await costService.calculateHealthCostPerEgg(date);
      res.status(200).json({ success: true, data: { date, healthCostPerEgg } });
    } catch (err) {
      next(err);
    }
  },

  // Daily cost calculation as per Design 7.1
  getDailyCalculation: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const date = req.params.date;
      const data = await costService.calculateDailyCost(date);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  // Get average monthly production
  getAverageMonthlyProduction: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const date = req.params.date;
      const production = await costService.getAverageMonthlyProduction(date);
      res.json({ success: true, data: { date, avgMonthlyProduction: production } });
    } catch (err) {
      next(err);
    }
  },
};

export default costController;
