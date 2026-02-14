import DailyLog from "../models/DailyLog.js";
import House from "../models/House.js";
import FeedBatch from "../models/FeedBatch.js";
import logger from "../config/logger.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";
import feedBatchStatsService from "./feedBatchStatsService.js";
import type {
  DailyLogEntity,
  FeedBatchEntity,
  HouseEntity,
} from "../types/entities.js";
import type { DailyLogFiltersInput } from "../types/dto.js";

type DailyLogRecord = DailyLogEntity & {
  House?: HouseEntity;
  FeedBatch?: FeedBatchEntity | null;
};

type DailyLogInput = Partial<DailyLogEntity> & {
  logDate?: string;
  houseId?: number;
};

const DAILY_LOG_MUTABLE_FIELDS = [
  "logDate",
  "houseId",
  "eggsCollected",
  "crackedEggs",
  "feedBatchId",
  "feedBagsUsed",
  "mortalityCount",
  "notes",
  "supervisorId",
] as const;

type DailyLogMutableField = (typeof DAILY_LOG_MUTABLE_FIELDS)[number];
type DailyLogWritePayload = Partial<Pick<DailyLogEntity, DailyLogMutableField>>;

const asDailyLog = (value: unknown): DailyLogRecord | null =>
  value as DailyLogRecord | null;

const pickDailyLogPayload = (data: DailyLogInput): DailyLogWritePayload => {
  const payload: DailyLogWritePayload = {};
  const mutablePayload = payload as Record<DailyLogMutableField, unknown>;

  for (const field of DAILY_LOG_MUTABLE_FIELDS) {
    const value = data[field];
    if (value !== undefined) {
      mutablePayload[field] = value;
    }
  }

  return payload;
};

const dailyLogService = {
  // Validate feed batch usage before creating/updating daily log
  validateFeedBatchUsage: async (
    data: DailyLogInput,
    existingLogId: string | number | null = null,
  ) => {
    let existingLog: DailyLogRecord | null = null;
    if (existingLogId) {
      const existingLogIdNum =
        typeof existingLogId === "string"
          ? Number.parseInt(existingLogId, 10)
          : existingLogId;
      existingLog = asDailyLog(await DailyLog.findByPk(existingLogIdNum));
    }

    const feedBatchId = data.feedBatchId ?? existingLog?.feedBatchId;
    const feedBagsUsed = data.feedBagsUsed ?? existingLog?.feedBagsUsed;
    const hasIncomingFeedBagsUsed =
      data.feedBagsUsed !== null && data.feedBagsUsed !== undefined;

    if (hasIncomingFeedBagsUsed && !feedBatchId) {
      throw new BadRequestError(
        "feedBatchId is required when feedBagsUsed is provided",
      );
    }

    if (!feedBatchId || feedBagsUsed === null || feedBagsUsed === undefined) {
      return;
    }

    const batchStats = await feedBatchStatsService.getBatchUsageStats(
      Number(feedBatchId),
    );

    // If this is an update, subtract the existing usage first
    let currentAvailable = batchStats.remainingBags;
    if (existingLog?.feedBagsUsed) {
      currentAvailable += Number(existingLog.feedBagsUsed);
    }

    if (Number(feedBagsUsed) > currentAvailable) {
      throw new BadRequestError(
        `Cannot use ${feedBagsUsed} bags. Only ${currentAvailable} bags available in batch "${batchStats.batchName}".`,
      );
    }

    if (batchStats.isEmpty && currentAvailable <= 0) {
      throw new BadRequestError(
        `Feed batch "${batchStats.batchName}" is empty and cannot be used.`,
      );
    }
  },

  createDailyLog: async (data: DailyLogInput) => {
    const payload = pickDailyLogPayload(data);

    if (!payload.logDate || !payload.houseId) {
      throw new BadRequestError("logDate and houseId are required");
    }

    // Check if a log already exists for this date and house
    const existingLog = asDailyLog(await DailyLog.findOne({
      where: {
        logDate: payload.logDate,
        houseId: payload.houseId,
      },
    }));

    if (existingLog) {
      // Validate feed batch usage for update
      await dailyLogService.validateFeedBatchUsage(payload, existingLog.id);

      // Update the existing log instead of creating a new one
      logger.info(
        `Updating existing daily log id=${existingLog.id} for house=${payload.houseId} date=${payload.logDate}`,
      );

      const [updatedCount] = await DailyLog.update(payload, {
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
      await dailyLogService.validateFeedBatchUsage(payload);

      const created = asDailyLog(await DailyLog.create(payload));
      if (!created) {
        throw new BadRequestError("Failed to create daily log");
      }
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

  getAllDailyLogs: async (filters: DailyLogFiltersInput = {}) => {
    const where: {
      logDate?: string;
      houseId?: number;
    } = {};
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

  getDailyLogById: async (id: string | number | undefined) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Daily log id is required");
    }
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

  updateDailyLog: async (
    id: string | number | undefined,
    updates: DailyLogInput,
  ) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Daily log id is required");
    }
    const payload = pickDailyLogPayload(updates);
    if (Object.keys(payload).length === 0) {
      throw new BadRequestError("No valid fields provided for update");
    }
    // Validate feed batch usage before updating
    await dailyLogService.validateFeedBatchUsage(payload, id);

    const [updatedCount] = await DailyLog.update(payload, { where: { id } });
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

  deleteDailyLog: async (id: string | number | undefined) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Daily log id is required");
    }
    const deleted = await DailyLog.destroy({ where: { id } });
    if (!deleted) throw new NotFoundError("Daily log not found");
    return true;
  },
};

export default dailyLogService;
