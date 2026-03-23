import {
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getLaborers, listStaff } from "@/lib/api";
import { buildFarmWorkers, type FarmWorker } from "@/lib/farmWorkers";

export interface UseFarmWorkersReturn {
  error: Error | null;
  loading: boolean;
  refresh: () => Promise<void>;
  workers: FarmWorker[];
}

export const FARM_WORKERS_QUERY_KEY = ["farm-workers"] as const;

async function fetchFarmWorkers(): Promise<FarmWorker[]> {
  const [staffMembers, laborers] = await Promise.all([
    listStaff().catch(() => []),
    getLaborers().catch(() => []),
  ]);

  return buildFarmWorkers(staffMembers, laborers);
}

export function farmWorkersQueryOptions() {
  return queryOptions({
    queryKey: FARM_WORKERS_QUERY_KEY,
    queryFn: fetchFarmWorkers,
  });
}

export function useFarmWorkers(): UseFarmWorkersReturn {
  const queryClient = useQueryClient();
  const farmWorkersQuery = useQuery(farmWorkersQueryOptions());

  return {
    workers: farmWorkersQuery.data ?? [],
    loading: farmWorkersQuery.isPending,
    error: farmWorkersQuery.error instanceof Error ? farmWorkersQuery.error : null,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: FARM_WORKERS_QUERY_KEY });
      await farmWorkersQuery.refetch();
    },
  };
}

export default useFarmWorkers;
