import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  calculateFeedBatchCost,
  createFeedBatch,
  deleteFeedBatch,
} from "@/lib/api";
import { useFeedInventory } from "@/hooks/useFeedInventory";
import {
  FEED_BATCHES_QUERY_KEY,
  FEED_BATCH_USAGE_STATS_QUERY_KEY,
} from "@/hooks/useFeedInventory";
import type { FeedBatchPayload } from "@/types";
import type { Ingredient } from "@/types/entities/feed";

export interface UseFeedManagementReturn {
  feedBatches: ReturnType<typeof useFeedInventory>["feedBatches"];
  batchUsageStats: ReturnType<typeof useFeedInventory>["batchUsageStats"];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createBatch: (payload: FeedBatchPayload) => Promise<void>;
  deleteBatch: (id: number | string) => Promise<void>;
  estimateBatchCost: (payload: {
    ingredients: Ingredient[];
    bagSizeKg?: number;
    miscellaneousCost?: number;
  }) => Promise<Record<string, unknown>>;
  isCreating: boolean;
  isDeleting: boolean;
  isCalculating: boolean;
  isMutating: boolean;
}

export function useFeedManagement(): UseFeedManagementReturn {
  const queryClient = useQueryClient();
  const feedInventory = useFeedInventory();

  const invalidateFeedInventory = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: FEED_BATCHES_QUERY_KEY }),
      queryClient.invalidateQueries({
        queryKey: FEED_BATCH_USAGE_STATS_QUERY_KEY,
      }),
    ]);
  };

  const createBatchMutation = useMutation({
    mutationFn: createFeedBatch,
    onSuccess: async () => {
      await invalidateFeedInventory();
    },
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (id: number | string) => deleteFeedBatch(id),
    onSuccess: async () => {
      await invalidateFeedInventory();
    },
  });

  const estimateBatchCostMutation = useMutation({
    mutationFn: (payload: {
      ingredients: Ingredient[];
      bagSizeKg?: number;
      miscellaneousCost?: number;
    }) => calculateFeedBatchCost(payload),
  });

  const error =
    feedInventory.error ||
    createBatchMutation.error ||
    deleteBatchMutation.error ||
    estimateBatchCostMutation.error ||
    null;

  return {
    ...feedInventory,
    error: error instanceof Error ? error : null,
    createBatch: async (payload) => {
      await createBatchMutation.mutateAsync(payload);
    },
    deleteBatch: async (id) => {
      await deleteBatchMutation.mutateAsync(id);
    },
    estimateBatchCost: async (payload) => {
      const result = await estimateBatchCostMutation.mutateAsync(payload);
      return result as Record<string, unknown>;
    },
    isCreating: createBatchMutation.isPending,
    isDeleting: deleteBatchMutation.isPending,
    isCalculating: estimateBatchCostMutation.isPending,
    isMutating:
      createBatchMutation.isPending ||
      deleteBatchMutation.isPending ||
      estimateBatchCostMutation.isPending,
  };
}

export default useFeedManagement;
