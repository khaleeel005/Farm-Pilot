import DailyLog from "../models/DailyLog.js";
import House from "../models/House.js";
import BirdBatch from "../models/BirdBatch.js";
import FeedBatch from "../models/FeedBatch.js";
import logger from "../config/logger.js";
import { NotFoundError, BadRequestError } from "../utils/exceptions.js";
import feedBatchStatsService from "./feedBatchStatsService.js";
import birdBatchService from "./birdBatchService.js";
import { sequelize } from "../utils/database.js";
import type { Transaction } from "sequelize";
import type {
  BirdBatchEntity,
  DailyLogEntity,
  FeedBatchEntity,
  HouseEntity,
} from "../types/entities.js";
import type { DailyLogFiltersInput } from "../types/dto.js";

type DailyLogRecord = DailyLogEntity & {
  House?: HouseEntity;
  BirdBatch?: BirdBatchEntity | null;
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

const HOUSE_ATTRIBUTES: string[] = [
  "id",
  "houseName",
  "capacity",
  "initialBirdCount",
  "currentBirdCount",
  "mortalityCount",
  "location",
  "status",
] ;

const BIRD_BATCH_ATTRIBUTES: string[] = [
  "id",
  "houseId",
  "batchName",
  "placedAt",
  "initialBirdCount",
  "currentBirdCount",
  "mortalityCount",
  "status",
  "notes",
];

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

const getMortalityCount = (value: unknown): number => Number(value ?? 0);

const resolveExistingBirdBatchId = async (
  log: DailyLogRecord,
  transaction: Transaction,
): Promise<number> => {
  if (log.birdBatchId !== undefined && log.birdBatchId !== null) {
    return Number(log.birdBatchId);
  }

  return birdBatchService.resolveCurrentBatchIdForHouse(
    Number(log.houseId),
    transaction,
  );
};

const getDailyLogWithRelations = (id: string | number, transaction?: Transaction) =>
  DailyLog.findByPk(id, {
    transaction,
    include: [
      {
        model: House,
        as: "House",
        attributes: HOUSE_ATTRIBUTES,
      },
      {
        model: BirdBatch,
        as: "BirdBatch",
        attributes: BIRD_BATCH_ATTRIBUTES,
        required: false,
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

      return sequelize.transaction(async (transaction) => {
        const currentMortality = getMortalityCount(existingLog.mortalityCount);
        const nextMortality = getMortalityCount(
          payload.mortalityCount ?? existingLog.mortalityCount,
        );
        const existingBirdBatchId = await resolveExistingBirdBatchId(
          existingLog,
          transaction,
        );
        const targetBatchId =
          payload.houseId && Number(payload.houseId) !== Number(existingLog.houseId)
            ? await birdBatchService.resolveCurrentBatchIdForHouse(
                Number(payload.houseId),
                transaction,
              )
            : existingBirdBatchId;

        await birdBatchService.applyMortalityDeltaToBatch(
          existingBirdBatchId,
          -currentMortality,
          transaction,
        );

        await birdBatchService.applyMortalityDeltaToBatch(
          targetBatchId,
          nextMortality,
          transaction,
        );

        const [updatedCount] = await DailyLog.update(
          {
            ...payload,
            birdBatchId: targetBatchId,
          },
          {
          where: { id: existingLog.id },
          transaction,
          },
        );

        if (!updatedCount) {
          throw new BadRequestError("Failed to update existing daily log");
        }

        return getDailyLogWithRelations(existingLog.id, transaction);
      });
    } else {
      // Validate feed batch usage for new creation
      await dailyLogService.validateFeedBatchUsage(payload);

      return sequelize.transaction(async (transaction) => {
        const birdBatchId = await birdBatchService.resolveCurrentBatchIdForHouse(
          Number(payload.houseId),
          transaction,
        );

        const created = asDailyLog(
          await DailyLog.create(
            {
              ...payload,
              birdBatchId,
            },
            { transaction },
          ),
        );
        if (!created) {
          throw new BadRequestError("Failed to create daily log");
        }

        await birdBatchService.applyMortalityDeltaToBatch(
          birdBatchId,
          getMortalityCount(payload.mortalityCount),
          transaction,
        );

        return getDailyLogWithRelations(created.id, transaction);
      });
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
          attributes: HOUSE_ATTRIBUTES,
        },
        {
          model: BirdBatch,
          as: "BirdBatch",
          attributes: BIRD_BATCH_ATTRIBUTES,
          required: false,
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
          attributes: HOUSE_ATTRIBUTES,
        },
        {
          model: BirdBatch,
          as: "BirdBatch",
          attributes: BIRD_BATCH_ATTRIBUTES,
          required: false,
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

    return sequelize.transaction(async (transaction) => {
      const existingLog = asDailyLog(
        await DailyLog.findByPk(id, { transaction }),
      );
      if (!existingLog) throw new NotFoundError("Daily log not found");

      const existingBirdBatchId = await resolveExistingBirdBatchId(
        existingLog,
        transaction,
      );
      const currentMortality = getMortalityCount(existingLog.mortalityCount);
      const nextMortality = getMortalityCount(
        payload.mortalityCount ?? existingLog.mortalityCount,
      );
      const nextHouseId = Number(payload.houseId ?? existingLog.houseId);
      const nextBirdBatchId =
        nextHouseId === Number(existingLog.houseId)
          ? existingBirdBatchId
          : await birdBatchService.resolveCurrentBatchIdForHouse(
              nextHouseId,
              transaction,
            );

      await birdBatchService.applyMortalityDeltaToBatch(
        existingBirdBatchId,
        -currentMortality,
        transaction,
      );

      await birdBatchService.applyMortalityDeltaToBatch(
        nextBirdBatchId,
        nextMortality,
        transaction,
      );

      const [updatedCount] = await DailyLog.update(
        {
          ...payload,
          birdBatchId: nextBirdBatchId,
        },
        {
          where: { id },
          transaction,
        },
      );
      if (!updatedCount) throw new NotFoundError("Daily log not found");

      return getDailyLogWithRelations(id, transaction);
    });
  },

  deleteDailyLog: async (id: string | number | undefined) => {
    if (id === undefined || id === null || id === "") {
      throw new BadRequestError("Daily log id is required");
    }
    return sequelize.transaction(async (transaction) => {
      const existingLog = asDailyLog(
        await DailyLog.findByPk(id, { transaction }),
      );
      if (!existingLog) throw new NotFoundError("Daily log not found");
      const existingBirdBatchId = await resolveExistingBirdBatchId(
        existingLog,
        transaction,
      );

      await birdBatchService.applyMortalityDeltaToBatch(
        existingBirdBatchId,
        -getMortalityCount(existingLog.mortalityCount),
        transaction,
      );

      const deleted = await DailyLog.destroy({ where: { id }, transaction });
      if (!deleted) throw new NotFoundError("Daily log not found");
      return true;
    });
  },
};

export default dailyLogService;
