import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  getDailyLogs,
  getEggPriceEstimate,
  getHouses,
  getLaborers,
  getSales,
} from "@/lib/api";
import {
  buildDashboardOverviewData,
  getRecentDashboardDates,
  toIsoDateString,
  type DashboardOverviewData,
} from "@/lib/dashboardOverview";

interface EggPriceEstimate {
  totalCostPerEgg?: number;
}

async function fetchDashboardOverview(
  todayIsoDate: string,
): Promise<DashboardOverviewData> {
  const today = new Date(todayIsoDate);
  const weeklyDates = getRecentDashboardDates(7, today);

  const [houses, laborers, costEstimate, weeklyLogs, weeklySales] =
    await Promise.all([
      getHouses().catch(() => []),
      getLaborers().catch(() => []),
      getEggPriceEstimate(todayIsoDate).catch(
        () => ({ totalCostPerEgg: 0 }) as EggPriceEstimate,
      ),
      Promise.all(
        weeklyDates.map((entry) =>
          getDailyLogs({ date: entry.isoDate }).catch(() => []),
        ),
      ),
      Promise.all(
        weeklyDates.map((entry) =>
          getSales({
            startDate: entry.isoDate,
            endDate: entry.isoDate,
          }).catch(() => []),
        ),
      ),
    ]);

  return buildDashboardOverviewData({
    houses,
    laborers,
    weeklyDates,
    weeklyLogs,
    weeklySales,
    costPerEgg: Number((costEstimate as EggPriceEstimate).totalCostPerEgg) || 0,
  });
}

export function dashboardOverviewQueryOptions(todayIsoDate: string) {
  return queryOptions({
    queryKey: ["dashboard-overview", todayIsoDate],
    queryFn: () => fetchDashboardOverview(todayIsoDate),
  });
}

export function useDashboardOverview() {
  return useQuery(dashboardOverviewQueryOptions(toIsoDateString(new Date())));
}
