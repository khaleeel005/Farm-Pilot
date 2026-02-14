import DailyLog from "../models/DailyLog.js";
import FeedBatch from "../models/FeedBatch.js";
import { fn, col } from "sequelize";
import { NotFoundError } from "../utils/exceptions.js";
import type { FeedBatchEntity } from "../types/entities.js";

type BatchUsageSummary = {
  batchId: number;
  batchName: string;
  totalBags: number;
  bagsUsed: number;
  remainingBags: number;
  usagePercentage: number;
  isNearlyEmpty: boolean;
  isEmpty: boolean;
  costPerBag?: number | string;
  bagSizeKg?: number | string;
};

const feedBatchStatsService = {
  getBatchUsageStats: async (
    batchId: string | number | undefined,
  ): Promise<BatchUsageSummary> => {
    if (batchId === undefined || batchId === null || batchId === "") {
      throw new NotFoundError("Feed batch id is required");
    }

    const batch = (await FeedBatch.findByPk(batchId)) as FeedBatchEntity | null;
    if (!batch) {
      throw new NotFoundError("Feed batch not found");
    }

    // Get total bags used from daily logs
    const usageResult = await DailyLog.sum("feedBagsUsed", {
      where: { feedBatchId: batchId },
    });

    const totalBagsUsed = Number(usageResult ?? 0);
    const batchTotalBags = Number(batch.totalBags ?? 0);
    const remainingBags = Math.max(0, batchTotalBags - totalBagsUsed);
    const usagePercentage =
      batchTotalBags > 0 ? (totalBagsUsed / batchTotalBags) * 100 : 0;

    return {
      batchId: batch.id,
      batchName: batch.batchName,
      totalBags: batchTotalBags,
      bagsUsed: totalBagsUsed,
      remainingBags,
      usagePercentage: Math.round(usagePercentage * 100) / 100,
      isNearlyEmpty: remainingBags <= batchTotalBags * 0.1, // Less than 10% remaining
      isEmpty: remainingBags <= 0,
    };
  },

  getAllBatchUsageStats: async (): Promise<BatchUsageSummary[]> => {
    // Get all batches
    const batches = ((await FeedBatch.findAll({
      attributes: ["id", "batchName", "totalBags", "costPerBag", "bagSizeKg"],
      raw: true,
    })) as unknown) as Array<{
      id: number;
      batchName: string;
      totalBags: number;
      costPerBag: number | string;
      bagSizeKg: number | string;
    }>;

    // Get usage for each batch - use snake_case for column names since underscored: true
    const batchIds = batches.map((b) => b.id);
    const usageResults = ((await DailyLog.findAll({
      attributes: [
        "feedBatchId",
        [fn("SUM", col("feed_bags_used")), "totalBagsUsed"],
      ],
      where: {
        feedBatchId: batchIds,
      },
      group: ["feed_batch_id"],
      raw: true,
    })) as unknown) as Array<{ feedBatchId: number; totalBagsUsed: number | string }>;

    // Create a map of batchId -> totalBagsUsed
    const usageMap: Record<number, number> = {};
    usageResults.forEach((r) => {
      usageMap[r.feedBatchId] = Number(r.totalBagsUsed) || 0;
    });

    return batches.map((batch) => {
      const totalBagsUsed = usageMap[batch.id] || 0;
      const batchTotalBags = Number(batch.totalBags || 0);
      const remainingBags = Math.max(0, batchTotalBags - totalBagsUsed);
      const usagePercentage =
        batchTotalBags > 0 ? (totalBagsUsed / batchTotalBags) * 100 : 0;

      return {
        batchId: batch.id,
        batchName: batch.batchName,
        totalBags: batchTotalBags,
        bagsUsed: totalBagsUsed,
        remainingBags,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        isNearlyEmpty: remainingBags <= batchTotalBags * 0.1,
        isEmpty: remainingBags <= 0,
        costPerBag: batch.costPerBag,
        bagSizeKg: batch.bagSizeKg,
      };
    });
  },
};

export default feedBatchStatsService;
