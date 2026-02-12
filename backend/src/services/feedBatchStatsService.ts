import DailyLog from "../models/DailyLog.js";
import FeedBatch from "../models/FeedBatch.js";
import { fn, col } from "sequelize";

const feedBatchStatsService = {
  getBatchUsageStats: async (batchId) => {
    const batch = await FeedBatch.findByPk(batchId);
    if (!batch) {
      throw new Error("Feed batch not found");
    }

    // Get total bags used from daily logs
    const usageResult = await DailyLog.sum("feedBagsUsed", {
      where: { feedBatchId: batchId },
    });

    const totalBagsUsed = usageResult || 0;
    const remainingBags = Math.max(0, batch.totalBags - totalBagsUsed);
    const usagePercentage =
      batch.totalBags > 0 ? (totalBagsUsed / batch.totalBags) * 100 : 0;

    return {
      batchId: batch.id,
      batchName: batch.batchName,
      totalBags: batch.totalBags,
      bagsUsed: totalBagsUsed,
      remainingBags,
      usagePercentage: Math.round(usagePercentage * 100) / 100,
      isNearlyEmpty: remainingBags <= batch.totalBags * 0.1, // Less than 10% remaining
      isEmpty: remainingBags <= 0,
    };
  },

  getAllBatchUsageStats: async () => {
    // Get all batches
    const batches = await FeedBatch.findAll({
      attributes: ["id", "batchName", "totalBags", "costPerBag", "bagSizeKg"],
      raw: true,
    });

    // Get usage for each batch - use snake_case for column names since underscored: true
    const batchIds = batches.map((b) => b.id);
    const usageResults = await DailyLog.findAll({
      attributes: [
        "feedBatchId",
        [fn("SUM", col("feed_bags_used")), "totalBagsUsed"],
      ],
      where: {
        feedBatchId: batchIds,
      },
      group: ["feed_batch_id"],
      raw: true,
    });

    // Create a map of batchId -> totalBagsUsed
    const usageMap = {};
    usageResults.forEach((r) => {
      usageMap[r.feedBatchId] = Number(r.totalBagsUsed) || 0;
    });

    return batches.map((batch) => {
      const totalBagsUsed = usageMap[batch.id] || 0;
      const remainingBags = Math.max(0, batch.totalBags - totalBagsUsed);
      const usagePercentage =
        batch.totalBags > 0 ? (totalBagsUsed / batch.totalBags) * 100 : 0;

      return {
        batchId: batch.id,
        batchName: batch.batchName,
        totalBags: batch.totalBags,
        bagsUsed: totalBagsUsed,
        remainingBags,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        isNearlyEmpty: remainingBags <= batch.totalBags * 0.1,
        isEmpty: remainingBags <= 0,
        costPerBag: batch.costPerBag,
        bagSizeKg: batch.bagSizeKg,
      };
    });
  },
};

export default feedBatchStatsService;
