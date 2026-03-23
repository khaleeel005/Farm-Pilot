import { createFileRoute } from "@tanstack/react-router";
import { DashboardOverview } from "@/components/dashboard-overview";
import { dashboardOverviewQueryOptions } from "@/hooks/useDashboardOverview";
import { toIsoDateString } from "@/lib/dashboardOverview";

export const Route = createFileRoute("/_authenticated/")({
  loader: ({ context }) => {
    const today = toIsoDateString(new Date());
    return context.queryClient.ensureQueryData(
      dashboardOverviewQueryOptions(today),
    );
  },
  component: DashboardPage,
});

function DashboardPage() {
  return <DashboardOverview />;
}
