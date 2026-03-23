import { useMemo } from "react";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createDailyLog,
  deleteDailyLog,
  getDailyLogs,
  updateDailyLog,
} from "@/lib/api";
import {
  buildTodaySummary,
  getTodayIsoDate,
  normalizeDailyLogFilters,
  type DailyLogFilters,
} from "@/lib/dailyLogs";
import { FEED_BATCH_USAGE_STATS_QUERY_KEY } from "@/hooks/useFeedInventory";
import type { DailyLog, DailyLogPayload, TodaySummary } from "@/types";

export interface UseDailyLogsReturn {
  logs: DailyLog[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  todaySummary: TodaySummary;
  getByDate: (date: string) => DailyLog[];
  getByHouse: (houseId: string) => DailyLog[];
}

export const DAILY_LOGS_QUERY_KEY = ["daily-logs"] as const;

export function dailyLogsQueryOptions(filters: DailyLogFilters = {}) {
  const normalizedFilters = normalizeDailyLogFilters(filters);

  return queryOptions({
    queryKey: [...DAILY_LOGS_QUERY_KEY, normalizedFilters],
    queryFn: () => getDailyLogs(normalizedFilters),
  });
}

export function useDailyLogs(initialFilters?: DailyLogFilters): UseDailyLogsReturn {
  const queryClient = useQueryClient();
  const logsQuery = useQuery(dailyLogsQueryOptions(initialFilters));
  const logs = logsQuery.data ?? [];

  const todaySummary = useMemo(
    () =>
      buildTodaySummary(
        logs.filter((log) => log.logDate === getTodayIsoDate()),
        new Set(logs.map((log) => log.houseId)).size,
      ),
    [logs],
  );

  return {
    logs,
    loading: logsQuery.isPending,
    error: logsQuery.error instanceof Error ? logsQuery.error : null,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: DAILY_LOGS_QUERY_KEY });
      await logsQuery.refetch();
    },
    todaySummary,
    getByDate: (date: string) => logs.filter((log) => log.logDate === date),
    getByHouse: (houseId: string) =>
      logs.filter((log) => String(log.houseId) === String(houseId)),
  };
}

export function useCreateDailyLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DailyLogPayload) => createDailyLog(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: DAILY_LOGS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: FEED_BATCH_USAGE_STATS_QUERY_KEY,
        }),
      ]);
    },
  });
}

export function useUpdateDailyLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: Partial<DailyLogPayload>;
    }) => updateDailyLog(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: DAILY_LOGS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: FEED_BATCH_USAGE_STATS_QUERY_KEY,
        }),
      ]);
    },
  });
}

export function useDeleteDailyLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteDailyLog(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DAILY_LOGS_QUERY_KEY });
    },
  });
}

export default useDailyLogs;
