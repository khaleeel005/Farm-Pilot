import logger from "../config/logger.js";
import dailyLogService from "../services/dailyLogService.js";
import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../utils/exceptions.js";
import { asEntity } from "../utils/modelHelpers.js";
import type { DailyLogEntity } from "../types/entities.js";

const dailyLogController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dailyLog = asEntity<DailyLogEntity>(
        await dailyLogService.createDailyLog(req.body),
      );
      if (!dailyLog) {
        throw new NotFoundError("Daily log could not be created");
      }
      logger.info(`Processed dailyLog id=${dailyLog.id} houseId=${dailyLog.houseId}`);
      res.status(201).json({
        success: true,
        data: dailyLog,
        message: "Daily log saved successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await dailyLogService.getAllDailyLogs(req.query);
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const log = await dailyLogService.getDailyLogById(req.params.id);
      res.status(200).json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await dailyLogService.updateDailyLog(
        req.params.id,
        req.body
      );
      const typedUpdated = asEntity<DailyLogEntity>(updated);
      if (!typedUpdated) {
        throw new NotFoundError("Daily log not found");
      }
      logger.info(`Updated dailyLog id=${typedUpdated.id}`);
      res.status(200).json({ success: true, data: typedUpdated });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await dailyLogService.deleteDailyLog(req.params.id);
      logger.info(`Deleted dailyLog id=${req.params.id}`);
      res
        .status(200)
        .json({ success: true, message: "Daily log deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

export default dailyLogController;
