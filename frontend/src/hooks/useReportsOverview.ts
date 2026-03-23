import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  getCustomers,
  getFinancialReport,
  getProductionReport,
  getSalesReport,
} from "@/lib/api";
import {
  buildReportsOverviewData,
  getReportDateRange,
  type ReportsDateRange,
} from "@/lib/reportsOverview";

async function fetchReportsOverview(dateRange: ReportsDateRange) {
  const range = getReportDateRange(dateRange);

  const [productionData, salesData, financialData, customers] =
    await Promise.all([
      getProductionReport(range.startDate, range.endDate).catch(() => null),
      getSalesReport(range.startDate, range.endDate).catch(() => null),
      getFinancialReport(range.startDate, range.endDate).catch(() => null),
      getCustomers().catch(() => []),
    ]);

  return buildReportsOverviewData({
    customers,
    financialData,
    productionData,
    range,
    salesData,
  });
}

export function reportsOverviewQueryOptions(dateRange: ReportsDateRange) {
  return queryOptions({
    queryKey: ["reports-overview", dateRange],
    queryFn: () => fetchReportsOverview(dateRange),
  });
}

export function useReportsOverview(dateRange: ReportsDateRange) {
  return useQuery(reportsOverviewQueryOptions(dateRange));
}
