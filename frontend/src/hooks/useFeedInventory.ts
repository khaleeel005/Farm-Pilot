import {
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getFeedBatches, getFeedBatchUsageStats } from "@/lib/api";
import type { BatchUsageStats } from "@/types";
import type { FeedBatch } from "@/types/entities/feed";

export interface UseFeedInventoryReturn {
  feedBatches: FeedBatch[];
  batchUsageStats: BatchUsageStats[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const FEED_BATCHES_QUERY_KEY = ["feed-batches"] as const;
export const FEED_BATCH_USAGE_STATS_QUERY_KEY = [
  "feed-batch-usage-stats",
] as const;

export function feedBatchesQueryOptions() {
  return queryOptions({
    queryKey: FEED_BATCHES_QUERY_KEY,
    queryFn: () => getFeedBatches(),
  });
}

export function feedBatchUsageStatsQueryOptions() {
  return queryOptions({
    queryKey: FEED_BATCH_USAGE_STATS_QUERY_KEY,
    queryFn: getFeedBatchUsageStats,
  });
}

export function useFeedInventory(): UseFeedInventoryReturn {
  const queryClient = useQueryClient();
  const feedBatchesQuery = useQuery(feedBatchesQueryOptions());
  const feedBatchUsageStatsQuery = useQuery(feedBatchUsageStatsQueryOptions());

  const error =
    feedBatchesQuery.error || feedBatchUsageStatsQuery.error || null;

  return {
    feedBatches: feedBatchesQuery.data ?? [],
    batchUsageStats: feedBatchUsageStatsQuery.data ?? [],
    loading: feedBatchesQuery.isPending || feedBatchUsageStatsQuery.isPending,
    error: error instanceof Error ? error : null,
    refresh: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FEED_BATCHES_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: FEED_BATCH_USAGE_STATS_QUERY_KEY,
        }),
      ]);
      await Promise.all([
        feedBatchesQuery.refetch(),
        feedBatchUsageStatsQuery.refetch(),
      ]);
    },
  };
}

export default useFeedInventory;
