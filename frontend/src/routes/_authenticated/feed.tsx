import { createFileRoute } from "@tanstack/react-router";
import { FeedManagement } from "@/components/feed-management";
import {
  feedBatchesQueryOptions,
  feedBatchUsageStatsQueryOptions,
} from "@/hooks/useFeedInventory";

export const Route = createFileRoute("/_authenticated/feed")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(feedBatchesQueryOptions()),
      context.queryClient.ensureQueryData(feedBatchUsageStatsQueryOptions()),
    ]),
  component: FeedPage,
});

function FeedPage() {
  return <FeedManagement />;
}
