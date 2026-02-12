import logger from "../config/logger.js";
import dailyLogService from "../services/dailyLogService.js";

const dailyLogController = {
  create: async (req, res, next) => {
    try {
      const dailyLog = await dailyLogService.createDailyLog(req.body);
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

  getAll: async (req, res, next) => {
    try {
      const logs = await dailyLogService.getAllDailyLogs(req.query);
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const log = await dailyLogService.getDailyLogById(req.params.id);
      res.status(200).json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const updated = await dailyLogService.updateDailyLog(
        req.params.id,
        req.body
      );
      logger.info(`Updated dailyLog id=${updated.id}`);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
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
