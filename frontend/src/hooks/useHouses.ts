import { useState, useEffect, useCallback } from 'react';
import { getHouses, createHouse, updateHouse, deleteHouse } from '@/lib/api';
import { House, HousePayload } from '@/types';

export interface UseHousesReturn {
  houses: House[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  create: (payload: HousePayload) => Promise<House | null>;
  update: (id: number, payload: HousePayload) => Promise<House | null>;
  remove: (id: number) => Promise<boolean>;
  getById: (id: number) => House | undefined;
}

/**
 * Hook for managing houses with CRUD operations
 */
export function useHouses(): UseHousesReturn {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHouses();
      setHouses(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (payload: HousePayload): Promise<House | null> => {
      try {
        const newHouse = await createHouse(payload);
        if (newHouse) {
          setHouses((prev) => [...prev, newHouse]);
          return newHouse;
        }
        return null;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    []
  );

  const update = useCallback(
    async (id: number, payload: HousePayload): Promise<House | null> => {
      try {
        const updatedHouse = await updateHouse(id, payload);
        if (updatedHouse) {
          setHouses((prev) => prev.map((h) => (h.id === id ? updatedHouse : h)));
          return updatedHouse;
        }
        return null;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    []
  );

  const remove = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteHouse(id);
      setHouses((prev) => prev.filter((h) => h.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, []);

  const getById = useCallback((id: number) => houses.find((h) => h.id === id), [houses]);

  return {
    houses,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
    getById,
  };
}

export default useHouses;
