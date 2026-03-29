import type { BatchUsageStats, DailyLogPayload } from "@/types";

export const EGGS_PER_CRATE = 30;

/** Convert total egg count into { crates, pieces } */
export function eggsToCreatesPieces(total: number): { crates: number; pieces: number } {
  const crates = Math.floor(total / EGGS_PER_CRATE);
  const pieces = total % EGGS_PER_CRATE;
  return { crates, pieces };
}

/** Convert crates + pieces into total egg count */
export function cratesPiecesToEggs(crates: number, pieces: number): number {
  return crates * EGGS_PER_CRATE + pieces;
}

/** Format eggs as "X crate(s) + Y piece(s)" */
export function formatEggsAsCratesAndPieces(total: number): string {
  const { crates, pieces } = eggsToCreatesPieces(total);
  if (crates === 0) return `${pieces} piece${pieces !== 1 ? 's' : ''}`;
  if (pieces === 0) return `${crates} crate${crates !== 1 ? 's' : ''}`;
  return `${crates} crate${crates !== 1 ? 's' : ''} + ${pieces} piece${pieces !== 1 ? 's' : ''}`;
}

export interface DailyLogFormValues {
  eggCrates: string;
  eggPieces: string;
  crackedEggs: string;
  mortalityCount: string;
  feedBatchId: string;
  feedBagsUsed: string;
  notes: string;
}

export const EMPTY_DAILY_LOG_FORM: DailyLogFormValues = {
  eggCrates: "",
  eggPieces: "",
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

export interface DailyEntrySubmitState {
  feedBagsError: string;
  hasSelectedHouse: boolean;
  isFeedInventoryLoading: boolean;
  isFormValid: boolean;
  isSubmitting: boolean;
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

export function hasNoAvailableHouses(
  totalHouses: number,
  housesLoading: boolean,
): boolean {
  return totalHouses === 0 && !housesLoading;
}

export function isFeedBatchFinished(
  usageInfo: BatchUsageStats | undefined,
): boolean {
  return Boolean(usageInfo && usageInfo.remainingBags <= 0);
}

export function shouldShowFeedBatchUsageInfo(
  usageInfo: BatchUsageStats | undefined,
): usageInfo is BatchUsageStats {
  return Boolean(usageInfo);
}

export function shouldShowLowFeedBatchBadge(
  usageInfo: BatchUsageStats | undefined,
): boolean {
  if (!usageInfo) {
    return false;
  }

  return !isFeedBatchFinished(usageInfo) && usageInfo.usagePercentage >= 80;
}

export function getFeedBatchNameClassName(
  isFinished: boolean,
): string {
  return isFinished ? "text-gray-400 line-through" : "";
}

export function getFeedBatchMetaTextClassName(
  isFinished: boolean,
): string {
  return isFinished ? "text-gray-400" : "text-muted-foreground";
}

export function getFeedBatchRemainingBagsClassName(
  isFinished: boolean,
): string {
  return isFinished ? "text-gray-400" : "text-blue-600";
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
  const crates = Number.parseInt(formData.eggCrates, 10) || 0;
  const pieces = Number.parseInt(formData.eggPieces, 10) || 0;
  return {
    logDate,
    houseId: Number.parseInt(selectedHouse, 10) || 0,
    eggsCollected: cratesPiecesToEggs(crates, pieces),
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
  const crates = Number.parseInt(formData.eggCrates, 10) || 0;
  const pieces = Number.parseInt(formData.eggPieces, 10) || 0;
  return {
    eggsCollected: cratesPiecesToEggs(crates, pieces),
    crackedEggs: Number.parseInt(formData.crackedEggs, 10) || 0,
    feedBatchId: formData.feedBatchId
      ? Number.parseInt(formData.feedBatchId, 10)
      : null,
    feedBagsUsed: Number.parseFloat(formData.feedBagsUsed) || 0,
    mortalityCount: Number.parseInt(formData.mortalityCount, 10) || 0,
    notes: formData.notes || undefined,
  };
}

export function isDailyEntryFormValid(input: {
  feedBagsError: string;
  hasSelectedHouse: boolean;
  isFeedBagUsageValid: boolean;
}): boolean {
  return (
    input.hasSelectedHouse &&
    input.isFeedBagUsageValid &&
    input.feedBagsError.length === 0
  );
}

export function getFeedBagsInputClassName(input: {
  feedBagsError: string;
  isFeedBagUsageValid: boolean;
}): string {
  return input.feedBagsError || !input.isFeedBagUsageValid
    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
    : "";
}

export function getDailyEntrySubmitLabel(
  submitState: DailyEntrySubmitState,
): string {
  if (submitState.isSubmitting) {
    return "Submitting...";
  }

  if (submitState.isFeedInventoryLoading) {
    return "Loading Feed Inventory...";
  }

  if (submitState.isFormValid) {
    return "Submit Daily Entry";
  }

  if (submitState.feedBagsError) {
    return "Fix Feed Bags Error to Submit";
  }

  if (!submitState.hasSelectedHouse) {
    return "Select a House to Submit";
  }

  return "Fix Errors to Submit";
}
