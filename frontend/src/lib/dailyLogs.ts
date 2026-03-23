import type { BatchUsageStats, DailyLog, TodaySummary } from "@/types";

export interface DailyLogFilters {
  date?: string;
  logDate?: string;
  houseId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DailyLogStats {
  totalEggs: number;
  totalCracked: number;
  totalMortality: number;
  totalFeedBags: number;
}

export function getTodayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

export function normalizeDailyLogFilters(filters: DailyLogFilters = {}) {
  const normalizedFilters: Record<string, string> = {};

  if (filters.date) {
    normalizedFilters.date = filters.date;
  }

  if (filters.logDate) {
    normalizedFilters.logDate = filters.logDate;
  }

  if (filters.houseId) {
    normalizedFilters.houseId = filters.houseId;
  }

  if (filters.startDate) {
    normalizedFilters.startDate = filters.startDate;
  }

  if (filters.endDate) {
    normalizedFilters.endDate = filters.endDate;
  }

  return normalizedFilters;
}

export function buildTodaySummary(
  logs: DailyLog[],
  totalHouses: number,
): TodaySummary {
  const houseBreakdown = logs.map((log) => ({
    houseId: log.houseId,
    houseName: log.House?.houseName || `House ${log.houseId}`,
    eggs: log.eggsCollected || 0,
  }));

  return {
    totalEggs: houseBreakdown.reduce((sum, house) => sum + house.eggs, 0),
    housesLogged: houseBreakdown.length,
    totalHouses,
    houseBreakdown,
  };
}

export function calculateDailyLogStats(logs: DailyLog[]): DailyLogStats {
  return {
    totalEggs: logs.reduce((sum, log) => sum + (log.eggsCollected || 0), 0),
    totalCracked: logs.reduce((sum, log) => sum + (log.crackedEggs || 0), 0),
    totalMortality: logs.reduce(
      (sum, log) => sum + (log.mortalityCount || 0),
      0,
    ),
    totalFeedBags: logs.reduce(
      (sum, log) => sum + (Number(log.feedBagsUsed) || 0),
      0,
    ),
  };
}

export function buildDailyAlerts(
  batchUsageStats: BatchUsageStats[],
  todaySummary: TodaySummary,
) {
  const alertMessages: string[] = [];

  const lowStockBatches = batchUsageStats.filter(
    (stats) => stats.remainingBags > 0 && stats.usagePercentage >= 80,
  );
  const finishedBatches = batchUsageStats.filter(
    (stats) => stats.remainingBags <= 0,
  );

  if (finishedBatches.length > 0) {
    alertMessages.push(
      `${finishedBatches.length} feed batch(es) depleted - order new stock`,
    );
  }

  if (lowStockBatches.length > 0) {
    alertMessages.push(
      `${lowStockBatches.length} feed batch(es) running low (>80% used)`,
    );
  }

  if (
    todaySummary.totalHouses > 0 &&
    todaySummary.housesLogged < todaySummary.totalHouses
  ) {
    const unloggedCount = todaySummary.totalHouses - todaySummary.housesLogged;
    alertMessages.push(`${unloggedCount} house(s) still need daily logs`);
  }

  return alertMessages;
}
