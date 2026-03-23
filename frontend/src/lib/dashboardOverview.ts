import type { DailyLog, House, Laborer, Sale } from "@/types";

export interface DashboardStats {
  eggsCollected: number;
  eggsYesterday: number;
  salesAmount: number;
  salesYesterday: number;
  costPerEgg: number;
  costYesterday: number;
  activeWorkers: number;
  totalWorkers: number;
}

export interface DashboardTrendPoint {
  day: string;
  eggs: number;
  sales: number;
}

export interface HousePerformance {
  id: number;
  name: string;
  eggs: number;
  capacity: number;
  efficiency: number;
}

export interface DashboardOverviewData {
  stats: DashboardStats;
  weeklyData: DashboardTrendPoint[];
  housePerformance: HousePerformance[];
}

export const EMPTY_DASHBOARD_STATS: DashboardStats = {
  eggsCollected: 0,
  eggsYesterday: 0,
  salesAmount: 0,
  salesYesterday: 0,
  costPerEgg: 0,
  costYesterday: 0,
  activeWorkers: 0,
  totalWorkers: 0,
};

export interface DashboardDateEntry {
  isoDate: string;
  dayLabel: string;
}

interface BuildDashboardOverviewInput {
  houses: House[];
  laborers: Laborer[];
  weeklyDates: DashboardDateEntry[];
  weeklyLogs: DailyLog[][];
  weeklySales: Sale[][];
  costPerEgg: number;
}

export function toIsoDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getRecentDashboardDates(
  days: number,
  baseDate = new Date(),
): DashboardDateEntry[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - (days - index - 1));

    return {
      isoDate: toIsoDateString(date),
      dayLabel: date.toLocaleDateString("en-US", { weekday: "short" }),
    };
  });
}

export function buildDashboardOverviewData({
  houses,
  laborers,
  weeklyDates,
  weeklyLogs,
  weeklySales,
  costPerEgg,
}: BuildDashboardOverviewInput): DashboardOverviewData {
  const lastLogIndex = weeklyLogs.length - 1;
  const yesterdayLogIndex = weeklyLogs.length - 2;
  const lastSalesIndex = weeklySales.length - 1;
  const yesterdaySalesIndex = weeklySales.length - 2;
  const todayLogs = lastLogIndex >= 0 ? weeklyLogs[lastLogIndex] : [];
  const yesterdayLogs = yesterdayLogIndex >= 0 ? weeklyLogs[yesterdayLogIndex] : [];
  const todaySales = lastSalesIndex >= 0 ? weeklySales[lastSalesIndex] : [];
  const yesterdaySales =
    yesterdaySalesIndex >= 0 ? weeklySales[yesterdaySalesIndex] : [];

  const totalEggsToday = sumEggs(todayLogs);
  const totalEggsYesterday = sumEggs(yesterdayLogs);
  const todaySalesTotal = sumSales(todaySales);
  const yesterdaySalesTotal = sumSales(yesterdaySales);

  const housePerformance = houses.map((house) => {
    const houseLogs = todayLogs.filter(
      (log: DailyLog) => Number(log.houseId) === house.id,
    );
    const houseEggs = sumEggs(houseLogs);
    const capacity = house.currentBirdCount || house.capacity || 100;
    const efficiency =
      capacity > 0 ? Math.min(100, Math.round((houseEggs / capacity) * 100)) : 0;

    return {
      id: house.id,
      name: house.houseName || `House ${house.id}`,
      eggs: houseEggs,
      capacity,
      efficiency,
    };
  });

  const activeLaborers = laborers.filter((laborer) => laborer.isActive !== false).length;

  return {
    stats: {
      ...EMPTY_DASHBOARD_STATS,
      eggsCollected: totalEggsToday,
      eggsYesterday: totalEggsYesterday,
      salesAmount: todaySalesTotal,
      salesYesterday: yesterdaySalesTotal,
      costPerEgg,
      activeWorkers: activeLaborers,
      totalWorkers: laborers.length,
    },
    weeklyData: weeklyDates.map((entry, index) => ({
      day: entry.dayLabel,
      eggs: sumEggs(weeklyLogs[index] ?? []),
      sales: sumSales(weeklySales[index] ?? []),
    })),
    housePerformance,
  };
}

function sumEggs(logs: DailyLog[]): number {
  return logs.reduce((sum, log) => sum + (Number(log.eggsCollected) || 0), 0);
}

function sumSales(sales: Sale[]): number {
  return sales.reduce((sum, sale) => sum + (Number(sale.totalAmount) || 0), 0);
}
