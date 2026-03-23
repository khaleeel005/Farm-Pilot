import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWorkAssignments } from "@/lib/api";
import type { WorkAssignment } from "@/types";

export interface WorkAssignmentFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  laborerId?: string;
}

export interface UseWorkAssignmentsReturn {
  assignments: WorkAssignment[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const WORK_ASSIGNMENTS_QUERY_KEY = ["work-assignments"] as const;

function normalizeWorkAssignmentFilters(
  filters: WorkAssignmentFilters = {},
): Record<string, string> {
  const normalizedFilters: Record<string, string> = {};

  if (filters.date) {
    normalizedFilters.date = filters.date;
  }

  if (filters.startDate) {
    normalizedFilters.startDate = filters.startDate;
  }

  if (filters.endDate) {
    normalizedFilters.endDate = filters.endDate;
  }

  if (filters.laborerId) {
    normalizedFilters.laborerId = filters.laborerId;
  }

  return normalizedFilters;
}

export function workAssignmentsQueryOptions(
  filters: WorkAssignmentFilters = {},
) {
  const normalizedFilters = normalizeWorkAssignmentFilters(filters);

  return queryOptions({
    queryKey: [...WORK_ASSIGNMENTS_QUERY_KEY, normalizedFilters],
    queryFn: () => getWorkAssignments(normalizedFilters),
  });
}

export function useWorkAssignments(
  initialFilters?: WorkAssignmentFilters,
): UseWorkAssignmentsReturn {
  const queryClient = useQueryClient();
  const assignmentsQuery = useQuery(workAssignmentsQueryOptions(initialFilters));

  return {
    assignments: assignmentsQuery.data ?? [],
    loading: assignmentsQuery.isPending,
    error: assignmentsQuery.error instanceof Error ? assignmentsQuery.error : null,
    refresh: async () => {
      await queryClient.invalidateQueries({
        queryKey: WORK_ASSIGNMENTS_QUERY_KEY,
      });
      await assignmentsQuery.refetch();
    },
  };
}

export default useWorkAssignments;
