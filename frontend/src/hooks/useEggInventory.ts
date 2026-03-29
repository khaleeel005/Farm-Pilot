import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEggAdjustment, fetchEggInventory, type EggAdjustmentPayload } from "@/lib/inventoryApi";

export function useEggInventory(startDate: string, endDate: string) {
  const query = useQuery({
    queryKey: ["egg-inventory", startDate, endDate],
    queryFn: () => fetchEggInventory(startDate, endDate),
    enabled: Boolean(startDate && endDate),
    staleTime: 60_000, // 1 min
  });

  return {
    inventory: query.data ?? null,
    loading: query.isLoading,
    error: query.error as Error | null,
    refresh: query.refetch,
  };
}

export function useCreateEggAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EggAdjustmentPayload) => createEggAdjustment(payload),
    onSuccess: () => {
      // Invalidate the inventory queries to trigger a refetch
      return queryClient.invalidateQueries({ queryKey: ["egg-inventory"] });
    },
  });
}
