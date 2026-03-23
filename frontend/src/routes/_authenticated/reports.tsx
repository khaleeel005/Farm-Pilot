import { createFileRoute } from "@tanstack/react-router";
import { ReportsSection } from "@/components/reports-section";
import { reportsOverviewQueryOptions } from "@/hooks/useReportsOverview";

export const Route = createFileRoute("/_authenticated/reports")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      reportsOverviewQueryOptions("last-30-days"),
    ),
  component: ReportsPage,
});

function ReportsPage() {
  return <ReportsSection />;
}
