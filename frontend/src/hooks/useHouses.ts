import { useCallback } from "react";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createHouse,
  deleteHouse,
  getHouses,
  updateHouse,
} from "@/lib/api";
import { readCachedHouses, writeCachedHouses } from "@/lib/houseManagement";
import type { House, HousePayload } from "@/types";

export interface UseHousesReturn {
  houses: House[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  create: (payload: HousePayload) => Promise<House>;
  update: (id: number, payload: HousePayload) => Promise<House>;
  remove: (id: number) => Promise<void>;
  getById: (id: number) => House | undefined;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isMutating: boolean;
}

const HOUSES_QUERY_KEY = ["houses"] as const;

async function fetchHouses(): Promise<House[]> {
  try {
    const houses = await getHouses();
    writeCachedHouses(houses);
    return houses;
  } catch (error) {
    const cachedHouses = readCachedHouses();

    if (cachedHouses.length > 0) {
      return cachedHouses;
    }

    throw error instanceof Error ? error : new Error(String(error));
  }
}

export function housesQueryOptions() {
  return queryOptions({
    queryKey: HOUSES_QUERY_KEY,
    queryFn: fetchHouses,
  });
}

export function useHouses(): UseHousesReturn {
  const queryClient = useQueryClient();
  const housesQuery = useQuery(housesQueryOptions());

  const syncHouses = useCallback(
    (updater: (currentHouses: House[]) => House[]) => {
      queryClient.setQueryData<House[]>(HOUSES_QUERY_KEY, (currentHouses = []) => {
        const nextHouses = updater(currentHouses);
        writeCachedHouses(nextHouses);
        return nextHouses;
      });
    },
    [queryClient],
  );

  const createMutation = useMutation({
    mutationFn: createHouse,
    onSuccess: (newHouse) => {
      syncHouses((currentHouses) => [...currentHouses, newHouse]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: HousePayload }) =>
      updateHouse(id, payload),
    onSuccess: (updatedHouse) => {
      syncHouses((currentHouses) =>
        currentHouses.map((house) =>
          house.id === updatedHouse.id ? updatedHouse : house,
        ),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteHouse(id),
    onSuccess: (_, deletedHouseId) => {
      syncHouses((currentHouses) =>
        currentHouses.filter((house) => house.id !== deletedHouseId),
      );
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: HOUSES_QUERY_KEY });
    await housesQuery.refetch();
  }, [housesQuery, queryClient]);

  const create = useCallback(
    async (payload: HousePayload): Promise<House> => {
      return createMutation.mutateAsync(payload);
    },
    [createMutation],
  );

  const update = useCallback(
    async (id: number, payload: HousePayload): Promise<House> => {
      return updateMutation.mutateAsync({ id, payload });
    },
    [updateMutation],
  );

  const remove = useCallback(
    async (id: number): Promise<void> => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  const houses = housesQuery.data ?? [];
  const error =
    housesQuery.error ||
    createMutation.error ||
    updateMutation.error ||
    deleteMutation.error ||
    null;

  const getById = useCallback(
    (id: number) => houses.find((house) => house.id === id),
    [houses],
  );

  return {
    houses,
    loading: housesQuery.isPending,
    error: error instanceof Error ? error : null,
    refresh,
    create,
    update,
    remove,
    getById,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}

export default useHouses;
