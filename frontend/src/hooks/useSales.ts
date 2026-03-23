import { useMemo } from "react";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createCustomer,
  createSale,
  getCustomers,
  getSales,
} from "@/lib/api";
import {
  calculateSalesOverview,
  type SalesOverviewMetrics,
} from "@/lib/salesManagement";
import type { Customer, CustomerPayload, Sale, SalePayload } from "@/types";

export interface SalesFilters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  paymentStatus?: string;
}

export type SalesSummary = SalesOverviewMetrics;

export interface UseSalesReturn {
  sales: Sale[];
  customers: Customer[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createSale: (payload: SalePayload) => Promise<Sale>;
  createCustomer: (payload: CustomerPayload) => Promise<Customer>;
  summary: SalesSummary;
  isCreatingSale: boolean;
  isCreatingCustomer: boolean;
  isMutating: boolean;
}

const SALES_QUERY_KEY = ["sales"] as const;
const CUSTOMERS_QUERY_KEY = ["customers"] as const;

function normalizeSalesFilters(filters: SalesFilters = {}) {
  const normalizedFilters: Record<string, string> = {};

  if (filters.startDate) {
    normalizedFilters.startDate = filters.startDate;
  }

  if (filters.endDate) {
    normalizedFilters.endDate = filters.endDate;
  }

  if (filters.customerId) {
    normalizedFilters.customerId = filters.customerId;
  }

  if (filters.paymentStatus) {
    normalizedFilters.paymentStatus = filters.paymentStatus;
  }

  return normalizedFilters;
}

export function salesQueryOptions(filters: SalesFilters = {}) {
  const normalizedFilters = normalizeSalesFilters(filters);

  return queryOptions({
    queryKey: [...SALES_QUERY_KEY, normalizedFilters],
    queryFn: () => getSales(normalizedFilters),
  });
}

export function customersQueryOptions() {
  return queryOptions({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: getCustomers,
  });
}

export function useSales(initialFilters?: SalesFilters): UseSalesReturn {
  const queryClient = useQueryClient();
  const salesQuery = useQuery(salesQueryOptions(initialFilters));
  const customersQuery = useQuery(customersQueryOptions());

  const createSaleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEY });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
    },
  });

  const summary = useMemo(
    () =>
      calculateSalesOverview(
        salesQuery.data ?? [],
        customersQuery.data ?? [],
      ),
    [customersQuery.data, salesQuery.data],
  );

  const error =
    salesQuery.error ||
    customersQuery.error ||
    createSaleMutation.error ||
    createCustomerMutation.error ||
    null;

  return {
    sales: salesQuery.data ?? [],
    customers: customersQuery.data ?? [],
    loading: salesQuery.isPending || customersQuery.isPending,
    error: error instanceof Error ? error : null,
    refresh: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY }),
      ]);
      await Promise.all([salesQuery.refetch(), customersQuery.refetch()]);
    },
    createSale: (payload) => createSaleMutation.mutateAsync(payload),
    createCustomer: (payload) => createCustomerMutation.mutateAsync(payload),
    summary,
    isCreatingSale: createSaleMutation.isPending,
    isCreatingCustomer: createCustomerMutation.isPending,
    isMutating:
      createSaleMutation.isPending || createCustomerMutation.isPending,
  };
}

export default useSales;
