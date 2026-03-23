import { queryOptions, useQuery } from "@tanstack/react-query";
import { getDailyLogs, getWorkAssignments } from "@/lib/api";
import { getCurrentWeekRange, buildStaffPerformanceData } from "@/lib/staffInsights";

async function fetchStaffPerformance(today: Date) {
  const weekRange = getCurrentWeekRange(today);
  const [logs, assignments] = await Promise.all([
    getDailyLogs({
      startDate: weekRange.startDate,
      endDate: weekRange.endDate,
    }),
    getWorkAssignments(),
  ]);

  return buildStaffPerformanceData(logs, assignments, today);
}

export function staffPerformanceQueryOptions(today = new Date()) {
  const weekRange = getCurrentWeekRange(today);

  return queryOptions({
    queryKey: ["staff-performance", weekRange.startDate, weekRange.endDate],
    queryFn: () => fetchStaffPerformance(today),
  });
}

export function useStaffPerformance() {
  return useQuery(staffPerformanceQueryOptions());
}
