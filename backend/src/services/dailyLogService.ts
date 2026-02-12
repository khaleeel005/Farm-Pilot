import DailyLog from "../models/DailyLog.js";
import House from "../models/House.js";
import FeedBatch from "../models/FeedBatch.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";
import feedBatchStatsService from "./feedBatchStatsService.js";

const dailyLogService = {
  // Validate feed batch usage before creating/updating daily log
  validateFeedBatchUsage: async (data, existingLogId = null) => {
    if (data.feedBatchId && data.feedBagsUsed) {
      const batchStats = await feedBatchStatsService.getBatchUsageStats(
        data.feedBatchId
      );

      // If this is an update, subtract the existing usage first
      let currentAvailable = batchStats.remainingBags;
      if (existingLogId) {
        const existingLog = await DailyLog.findByPk(existingLogId);
        if (existingLog && existingLog.feedBagsUsed) {
          currentAvailable += existingLog.feedBagsUsed;
        }
      }

      if (data.feedBagsUsed > currentAvailable) {
        throw new BadRequestError(
          `Cannot use ${data.feedBagsUsed} bags. Only ${currentAvailable} bags available in batch "${batchStats.batchName}".`
        );
      }

      if (batchStats.isEmpty && currentAvailable <= 0) {
        throw new BadRequestError(
          `Feed batch "${batchStats.batchName}" is empty and cannot be used.`
        );
      }
    }
  },

  createDailyLog: async (data) => {
    if (!data.logDate || !data.houseId) {
      throw new BadRequestError("logDate and houseId are required");
    }

    // Check if a log already exists for this date and house
    const existingLog = await DailyLog.findOne({
      where: {
        logDate: data.logDate,
        houseId: data.houseId,
      },
    });

    if (existingLog) {
      // Validate feed batch usage for update
      await dailyLogService.validateFeedBatchUsage(data, existingLog.id);

      // Update the existing log instead of creating a new one
      console.log(
        `[${new Date().toISOString()}] Updating existing daily log id=${
          existingLog.id
        } for house=${data.houseId} date=${data.logDate}`
      );

      const [updatedCount] = await DailyLog.update(data, {
        where: { id: existingLog.id },
      });

      if (updatedCount > 0) {
        const updatedLog = await DailyLog.findByPk(existingLog.id, {
          include: [
            {
              model: House,
              as: "House",
              attributes: [
                "id",
                "houseName",
                "capacity",
                "currentBirdCount",
                "location",
                "status",
              ],
            },
            {
              model: FeedBatch,
              as: "FeedBatch",
              attributes: [
                "id",
                "batchName",
                "costPerBag",
                "bagSizeKg",
                "totalBags",
              ],
              required: false,
            },
          ],
        });
        return updatedLog;
      } else {
        throw new BadRequestError("Failed to update existing daily log");
      }
    } else {
      // Validate feed batch usage for new creation
      await dailyLogService.validateFeedBatchUsage(data);

      const created = await DailyLog.create(data);
      // Fetch the created log with House information
      const createdWithHouse = await DailyLog.findByPk(created.id, {
        include: [
          {
            model: House,
            as: "House",
            attributes: [
              "id",
              "houseName",
              "capacity",
              "currentBirdCount",
              "location",
              "status",
            ],
          },
          {
            model: FeedBatch,
            as: "FeedBatch",
            attributes: [
              "id",
              "batchName",
              "costPerBag",
              "bagSizeKg",
              "totalBags",
            ],
            required: false,
          },
        ],
      });
      return createdWithHouse;
    }
  },

  getAllDailyLogs: async (filters = {}) => {
    const where = {};
    const date = filters.date || filters.logDate;
    if (date) {
      where.logDate = date;
    }

    if (filters.houseId) {
      const hid = Number(filters.houseId);
      if (!Number.isNaN(hid)) where.houseId = hid;
    }

    const logs = await DailyLog.findAll({
      where,
      include: [
        {
          model: House,
          as: "House",
          attributes: [
            "id",
            "houseName",
            "capacity",
            "currentBirdCount",
            "location",
            "status",
          ],
        },
        {
          model: FeedBatch,
          as: "FeedBatch",
          attributes: [
            "id",
            "batchName",
            "costPerBag",
            "bagSizeKg",
            "totalBags",
          ],
          required: false,
        },
      ],
    });

    return logs;
  },

  getDailyLogById: async (id) => {
    const log = await DailyLog.findByPk(id, {
      include: [
        {
          model: House,
          as: "House",
          attributes: [
            "id",
            "houseName",
            "capacity",
            "currentBirdCount",
            "location",
            "status",
          ],
        },
        {
          model: FeedBatch,
          as: "FeedBatch",
          attributes: [
            "id",
            "batchName",
            "costPerBag",
            "bagSizeKg",
            "totalBags",
          ],
          required: false,
        },
      ],
    });
    if (!log) throw new NotFoundError("Daily log not found");
    return log;
  },

  updateDailyLog: async (id, updates) => {
    // Validate feed batch usage before updating
    await dailyLogService.validateFeedBatchUsage(updates, id);

    const [updatedCount] = await DailyLog.update(updates, { where: { id } });
    if (!updatedCount) throw new NotFoundError("Daily log not found");
    const updated = await DailyLog.findByPk(id, {
      include: [
        {
          model: House,
          as: "House",
          attributes: [
            "id",
            "houseName",
            "capacity",
            "currentBirdCount",
            "location",
            "status",
          ],
        },
        {
          model: FeedBatch,
          as: "FeedBatch",
          attributes: [
            "id",
            "batchName",
            "costPerBag",
            "bagSizeKg",
            "totalBags",
          ],
          required: false,
        },
      ],
    });
    return updated;
  },

  deleteDailyLog: async (id) => {
    const deleted = await DailyLog.destroy({ where: { id } });
    if (!deleted) throw new NotFoundError("Daily log not found");
    return true;
  },
};

export default dailyLogService;
