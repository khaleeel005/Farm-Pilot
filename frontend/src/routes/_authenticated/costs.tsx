import { createFileRoute } from "@tanstack/react-router";
import { CostAnalysis } from "@/components/cost-analysis";

export const Route = createFileRoute("/_authenticated/costs")({
  component: CostsPage,
});

function CostsPage() {
  return <CostAnalysis />;
}
