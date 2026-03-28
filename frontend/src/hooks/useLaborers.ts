import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createLaborer,
  deleteLaborer,
  getLaborers,
  getPayrollMonth,
  generatePayroll,
  updatePayroll,
} from "@/lib/api";
import type { Laborer, LaborerPayload, Payroll, PayrollPayload } from "@/types";

export interface UseLaborersReturn {
  laborers: Laborer[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  create: (payload: LaborerPayload) => Promise<Laborer>;
  remove: (id: number | string) => Promise<void>;
  isCreating: boolean;
  isDeleting: boolean;
  isMutating: boolean;
}

export interface UsePayrollMonthReturn {
  payroll: Payroll[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  generate: () => Promise<Payroll[]>;
  update: (id: string | number, payload: PayrollPayload) => Promise<Payroll>;
  isGenerating: boolean;
  isUpdating: boolean;
}

export const LABORERS_QUERY_KEY = ["laborers"] as const;
export const PAYROLL_QUERY_KEY = ["payroll"] as const;

export function laborersQueryOptions() {
  return queryOptions({
    queryKey: LABORERS_QUERY_KEY,
    queryFn: getLaborers,
  });
}

export function payrollMonthQueryOptions(monthYear: string) {
  return queryOptions({
    queryKey: [...PAYROLL_QUERY_KEY, monthYear],
    queryFn: () => getPayrollMonth(monthYear),
  });
}

export function useLaborers(): UseLaborersReturn {
  const queryClient = useQueryClient();
  const laborersQuery = useQuery(laborersQueryOptions());

  const createMutation = useMutation({
    mutationFn: createLaborer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LABORERS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => deleteLaborer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LABORERS_QUERY_KEY });
    },
  });

  const error =
    laborersQuery.error || createMutation.error || deleteMutation.error || null;

  return {
    laborers: laborersQuery.data ?? [],
    loading: laborersQuery.isPending,
    error: error instanceof Error ? error : null,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: LABORERS_QUERY_KEY });
      await laborersQuery.refetch();
    },
    create: (payload) => createMutation.mutateAsync(payload),
    remove: async (id) => {
      await deleteMutation.mutateAsync(id);
    },
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMutating: createMutation.isPending || deleteMutation.isPending,
  };
}

export function usePayrollMonth(monthYear: string): UsePayrollMonthReturn {
  const queryClient = useQueryClient();
  const payrollQuery = useQuery(payrollMonthQueryOptions(monthYear));

  const generateMutation = useMutation({
    mutationFn: () => generatePayroll(monthYear),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...PAYROLL_QUERY_KEY, monthYear],
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number;
      payload: PayrollPayload;
    }) => updatePayroll(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...PAYROLL_QUERY_KEY, monthYear],
      });
    },
  });

  return {
    payroll: payrollQuery.data ?? [],
    loading: payrollQuery.isPending,
    error: payrollQuery.error instanceof Error ? payrollQuery.error : null,
    refresh: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...PAYROLL_QUERY_KEY, monthYear],
      });
      await payrollQuery.refetch();
    },
    generate: () => generateMutation.mutateAsync(),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    isGenerating: generateMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

export default useLaborers;
