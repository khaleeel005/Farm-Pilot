import costService from "../services/costService.js";
import type { NextFunction, Request, Response } from "express";
import { queryString } from "../utils/parsers.js";

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

  getEggPrice: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const date = req.params.date;
      const data = await costService.getEggPriceEstimate(date);
      res.json({ success: true, data });
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
