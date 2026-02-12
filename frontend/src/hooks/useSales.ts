import { useState, useEffect, useCallback } from 'react';
import { getSales, createSale, getCustomers, createCustomer } from '@/lib/api';
import { Sale, SalePayload, Customer, CustomerPayload } from '@/types';

export interface SalesFilters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  paymentStatus?: string;
}

export interface UseSalesReturn {
  sales: Sale[];
  customers: Customer[];
  loading: boolean;
  error: Error | null;
  refreshSales: (filters?: SalesFilters) => Promise<void>;
  refreshCustomers: () => Promise<void>;
  createSale: (payload: SalePayload) => Promise<Sale | null>;
  createCustomer: (payload: CustomerPayload) => Promise<Customer | null>;
  getSalesSummary: () => SalesSummary;
  getCustomerById: (id: string) => Customer | undefined;
}

export interface SalesSummary {
  totalRevenue: number;
  totalSales: number;
  paidAmount: number;
  pendingAmount: number;
  totalQuantity: number;
}

/**
 * Hook for managing sales and customers with summary calculations
 */
export function useSales(initialFilters?: SalesFilters): UseSalesReturn {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshSales = useCallback(async (filters: SalesFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const filterParams: Record<string, string> = {};
      if (filters.startDate) filterParams.startDate = filters.startDate;
      if (filters.endDate) filterParams.endDate = filters.endDate;
      if (filters.customerId) filterParams.customerId = filters.customerId;
      if (filters.paymentStatus) filterParams.paymentStatus = filters.paymentStatus;

      const data = await getSales(filterParams);
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCustomers = useCallback(async () => {
    try {
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    Promise.all([refreshSales(initialFilters), refreshCustomers()]);
  }, [refreshSales, refreshCustomers, initialFilters]);

  const handleCreateSale = useCallback(
    async (payload: SalePayload): Promise<Sale | null> => {
      try {
        const newSale = await createSale(payload);
        if (newSale) {
          setSales((prev) => [...prev, newSale]);
          return newSale;
        }
        return null;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    []
  );

  const handleCreateCustomer = useCallback(
    async (payload: CustomerPayload): Promise<Customer | null> => {
      try {
        const newCustomer = await createCustomer(payload);
        if (newCustomer) {
          setCustomers((prev) => [...prev, newCustomer]);
          return newCustomer;
        }
        return null;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    []
  );

  const getSalesSummary = useCallback((): SalesSummary => {
    const summary = sales.reduce(
      (acc, sale) => {
        acc.totalRevenue += sale.totalAmount || 0;
        acc.totalSales += 1;
        acc.totalQuantity += sale.quantity || 0;

        if (sale.paymentStatus === 'paid') {
          acc.paidAmount += sale.totalAmount || 0;
        } else {
          acc.pendingAmount += sale.totalAmount || 0;
        }

        return acc;
      },
      {
        totalRevenue: 0,
        totalSales: 0,
        paidAmount: 0,
        pendingAmount: 0,
        totalQuantity: 0,
      }
    );

    return summary;
  }, [sales]);

  const getCustomerById = useCallback(
    (id: string): Customer | undefined => {
      return customers.find((c) => String(c.id) === String(id));
    },
    [customers]
  );

  return {
    sales,
    customers,
    loading,
    error,
    refreshSales,
    refreshCustomers,
    createSale: handleCreateSale,
    createCustomer: handleCreateCustomer,
    getSalesSummary,
    getCustomerById,
  };
}

export default useSales;
