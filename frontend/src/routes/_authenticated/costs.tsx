import { createFileRoute } from "@tanstack/react-router";
import { CostAnalysis } from "@/components/cost-analysis";
import { costAnalysisOverviewQueryOptions } from "@/hooks/useCostAnalysisOverview";
import { getTodayIsoDate } from "@/lib/costAnalysis";

export const Route = createFileRoute("/_authenticated/costs")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      costAnalysisOverviewQueryOptions(getTodayIsoDate()),
    ),
  component: CostsPage,
});

function CostsPage() {
  return <CostAnalysis />;
}
