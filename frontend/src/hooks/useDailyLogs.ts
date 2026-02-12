import { useState, useEffect, useCallback } from 'react';
import { getDailyLogs, createDailyLog } from '@/lib/api';
import { DailyLog, DailyLogPayload, TodaySummary } from '@/types';

export interface DailyLogFilters {
  date?: string;
  logDate?: string;
  houseId?: string;
}

export interface UseDailyLogsReturn {
  logs: DailyLog[];
  loading: boolean;
  error: Error | null;
  refresh: (filters?: DailyLogFilters) => Promise<void>;
  create: (payload: DailyLogPayload) => Promise<DailyLog | null>;
  getTodaySummary: () => TodaySummary;
  getByDate: (date: string) => DailyLog[];
  getByHouse: (houseId: string) => DailyLog[];
}

/**
 * Hook for managing daily logs with filtering and summary calculations
 */
export function useDailyLogs(initialFilters?: DailyLogFilters): UseDailyLogsReturn {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (filters: DailyLogFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const filterParams: Record<string, string> = {};
      if (filters.date) filterParams.date = filters.date;
      if (filters.logDate) filterParams.logDate = filters.logDate;
      if (filters.houseId) filterParams.houseId = filters.houseId;

      const data = await getDailyLogs(filterParams);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(initialFilters);
  }, [refresh, initialFilters]);

  const create = useCallback(
    async (payload: DailyLogPayload): Promise<DailyLog | null> => {
      try {
        const newLog = await createDailyLog(payload);
        if (newLog) {
          setLogs((prev) => {
            // Check if log for same date/house exists and update it
            const existingIndex = prev.findIndex(
              (log) => log.logDate === newLog.logDate && log.houseId === newLog.houseId
            );
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = newLog;
              return updated;
            }
            return [...prev, newLog];
          });
          return newLog;
        }
        return null;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    []
  );

  const getTodaySummary = useCallback((): TodaySummary => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter((log) => log.logDate === today);

    const houseBreakdown = todayLogs.map((log) => ({
      houseId: log.houseId,
      houseName: log.House?.houseName || `House ${log.houseId}`,
      eggs: log.eggsCollected || 0,
    }));

    return {
      totalEggs: houseBreakdown.reduce((sum, h) => sum + h.eggs, 0),
      housesLogged: todayLogs.length,
      totalHouses: new Set(logs.map((l) => l.houseId)).size,
      houseBreakdown,
    };
  }, [logs]);

  const getByDate = useCallback(
    (date: string): DailyLog[] => {
      return logs.filter((log) => log.logDate === date);
    },
    [logs]
  );

  const getByHouse = useCallback(
    (houseId: string): DailyLog[] => {
      return logs.filter((log) => String(log.houseId) === String(houseId));
    },
    [logs]
  );

  return {
    logs,
    loading,
    error,
    refresh,
    create,
    getTodaySummary,
    getByDate,
    getByHouse,
  };
}

export default useDailyLogs;
