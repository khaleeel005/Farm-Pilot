import { queryOptions, useQuery } from "@tanstack/react-query";
import { getEggPriceEstimate, getSales } from "@/lib/api";
import {
  buildCostAnalysisOverviewData,
  getTodayIsoDate,
  type CostAnalysisOverviewData,
  type CostEstimate,
} from "@/lib/costAnalysis";
import type { Sale } from "@/types";

async function fetchCostAnalysisOverview(
  date: string,
): Promise<CostAnalysisOverviewData> {
  const [costEstimate, sales] = await Promise.all([
    getEggPriceEstimate(date).catch(() => null),
    getSales({ limit: "100" }).catch(() => []),
  ]);

  return buildCostAnalysisOverviewData({
    costEstimate: (costEstimate as CostEstimate | null) ?? null,
    sales: Array.isArray(sales) ? (sales as Sale[]) : [],
  });
}

export function costAnalysisOverviewQueryOptions(date: string) {
  return queryOptions({
    queryKey: ["cost-analysis-overview", date],
    queryFn: () => fetchCostAnalysisOverview(date),
  });
}

export function useCostAnalysisOverview(date = getTodayIsoDate()) {
  return useQuery(costAnalysisOverviewQueryOptions(date));
}
