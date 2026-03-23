import type { BatchUsageStats, DailyLogPayload } from "@/types";

export interface DailyLogFormValues {
  eggsCollected: string;
  crackedEggs: string;
  mortalityCount: string;
  feedBatchId: string;
  feedBagsUsed: string;
  notes: string;
}

export const EMPTY_DAILY_LOG_FORM: DailyLogFormValues = {
  eggsCollected: "",
  crackedEggs: "",
  mortalityCount: "",
  feedBatchId: "",
  feedBagsUsed: "",
  notes: "",
};

export interface FeedBagValidationResult {
  batchUsage: BatchUsageStats | null;
  bagsUsed: number | null;
  isValid: boolean;
}

export function getSelectedBatchUsage(
  batchUsageStats: BatchUsageStats[],
  feedBatchId: string,
): BatchUsageStats | null {
  if (!feedBatchId) {
    return null;
  }

  const batchId = Number.parseInt(feedBatchId, 10);
  if (Number.isNaN(batchId)) {
    return null;
  }

  return batchUsageStats.find((stats) => stats.batchId === batchId) ?? null;
}

export function validateFeedBagUsage(
  batchUsageStats: BatchUsageStats[],
  feedBatchId: string,
  feedBagsUsed: string,
): FeedBagValidationResult {
  const batchUsage = getSelectedBatchUsage(batchUsageStats, feedBatchId);
  if (!feedBagsUsed || !batchUsage) {
    return { batchUsage, bagsUsed: null, isValid: true };
  }

  const bagsUsed = Number.parseFloat(feedBagsUsed);
  if (Number.isNaN(bagsUsed) || bagsUsed <= 0) {
    return { batchUsage, bagsUsed: null, isValid: true };
  }

  return {
    batchUsage,
    bagsUsed,
    isValid: bagsUsed <= batchUsage.remainingBags,
  };
}

export function buildDailyLogPayload(
  formData: DailyLogFormValues,
  selectedHouse: string,
  logDate = new Date().toISOString().slice(0, 10),
): DailyLogPayload {
  return {
    logDate,
    houseId: Number.parseInt(selectedHouse, 10) || 0,
    eggsCollected: Number.parseInt(formData.eggsCollected, 10) || 0,
    crackedEggs: Number.parseInt(formData.crackedEggs, 10) || 0,
    mortalityCount: Number.parseInt(formData.mortalityCount, 10) || 0,
    feedBatchId: formData.feedBatchId
      ? Number.parseInt(formData.feedBatchId, 10)
      : undefined,
    feedBagsUsed: formData.feedBagsUsed
      ? Number.parseFloat(formData.feedBagsUsed)
      : undefined,
    notes: formData.notes || undefined,
  };
}

export function buildDailyLogUpdatePayload(
  formData: DailyLogFormValues,
): Partial<DailyLogPayload> {
  return {
    eggsCollected: Number.parseInt(formData.eggsCollected, 10) || 0,
    crackedEggs: Number.parseInt(formData.crackedEggs, 10) || 0,
    feedBatchId: formData.feedBatchId
      ? Number.parseInt(formData.feedBatchId, 10)
      : null,
    feedBagsUsed: Number.parseFloat(formData.feedBagsUsed) || 0,
    mortalityCount: Number.parseInt(formData.mortalityCount, 10) || 0,
    notes: formData.notes || undefined,
  };
}
