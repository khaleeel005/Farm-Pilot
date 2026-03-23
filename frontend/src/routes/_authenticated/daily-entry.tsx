import { createFileRoute } from "@tanstack/react-router";
import { DailyEntryForm } from "@/components/daily-entry-form";
import { getTodayIsoDate } from "@/lib/dailyLogs";
import { dailyLogsQueryOptions } from "@/hooks/useDailyLogs";
import { farmWorkersQueryOptions } from "@/hooks/useFarmWorkers";
import {
  feedBatchesQueryOptions,
  feedBatchUsageStatsQueryOptions,
} from "@/hooks/useFeedInventory";
import { housesQueryOptions } from "@/hooks/useHouses";

export const Route = createFileRoute("/_authenticated/daily-entry")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(housesQueryOptions()),
      context.queryClient.ensureQueryData(feedBatchesQueryOptions()),
      context.queryClient.ensureQueryData(feedBatchUsageStatsQueryOptions()),
      context.queryClient.ensureQueryData(
        dailyLogsQueryOptions({ date: getTodayIsoDate() }),
      ),
      context.queryClient.ensureQueryData(farmWorkersQueryOptions()),
    ]),
  component: DailyEntryPage,
});

function DailyEntryPage() {
  return <DailyEntryForm />;
}
