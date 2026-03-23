import { queryOptions, useQuery } from "@tanstack/react-query";
import { getDailyLogs } from "@/lib/api";
import { buildStaffDashboardOverview } from "@/lib/staffInsights";
import { getTodayIsoDate } from "@/lib/dailyLogs";
import { getWorkAssignments } from "@/lib/api";

async function fetchStaffDashboardOverview(todayIsoDate: string) {
  const [logs, assignments] = await Promise.all([
    getDailyLogs({ date: todayIsoDate }),
    getWorkAssignments(),
  ]);

  return buildStaffDashboardOverview(logs, assignments, todayIsoDate);
}

export function staffDashboardOverviewQueryOptions(todayIsoDate: string) {
  return queryOptions({
    queryKey: ["staff-dashboard-overview", todayIsoDate],
    queryFn: () => fetchStaffDashboardOverview(todayIsoDate),
  });
}

export function useStaffDashboardOverview() {
  return useQuery(
    staffDashboardOverviewQueryOptions(getTodayIsoDate()),
  );
}
