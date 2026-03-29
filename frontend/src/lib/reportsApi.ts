import { API_BASE_URL, ApiError, fetchWithAuth, handleResponse } from "@/lib/apiClient";

export interface ProductionReportData {
  start: string;
  end: string;
  days: number;
  totalEggs: number;
  avgPerDay: number;
  logs: Array<{
    logDate: string;
    eggsCollected: number;
    crackedEggs: number;
    feedBagsUsed: number;
    mortalityCount: number;
    houseId?: number;
  }>;
}

export interface SalesReportData {
  start: string;
  end: string;
  totalAmount: number;
  totalCrates: number;
  rows: Array<{
    saleDate: string;
    quantity: number;
    pricePerCrate: number;
    totalAmount: number;
    customerId?: number;
    paymentStatus?: string;
  }>;
}

export interface FinancialReportData {
  start: string;
  end: string;
  totalOperating: number;
  totalSales: number;
  ops: Array<{
    monthYear: string;
    totalMonthlyCost: number;
    supervisorSalary?: number;
  }>;
  sales: Array<{
    saleDate: string;
    totalAmount: number;
  }>;
}

export interface DashboardSummary {
  production: {
    totalEggs: number;
    avgDaily: number;
    crackedPercent: number;
  };
  sales: {
    totalRevenue: number;
    totalCratesSold: number;
    pendingPayments: number;
    paidCount: number;
    pendingCount: number;
  };
  costs: {
    totalOperating: number;
    profitMargin: number;
  };
}

export async function getReports(
  type: string,
  filters: Record<string, string> = {},
) {
  const params = new URLSearchParams(filters);
  const res = await fetchWithAuth(`${API_BASE_URL}/api/reports/${type}?${params}`);
  return handleResponse(res);
}

export async function getProductionReport(
  startDate: string,
  endDate: string,
): Promise<ProductionReportData> {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/api/reports/production?start=${startDate}&end=${endDate}`,
  );
  const data = await handleResponse<{ data?: ProductionReportData }>(res);
  return (
    data?.data || {
      start: startDate,
      end: endDate,
      days: 0,
      totalEggs: 0,
      avgPerDay: 0,
      logs: [],
    }
  );
}

export async function getSalesReport(
  startDate: string,
  endDate: string,
): Promise<SalesReportData> {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/api/reports/sales?start=${startDate}&end=${endDate}`,
  );
  const data = await handleResponse<{ data?: SalesReportData }>(res);
  return (
    data?.data || {
      start: startDate,
      end: endDate,
      totalAmount: 0,
      totalCrates: 0,
      rows: [],
    }
  );
}

export async function getFinancialReport(
  startDate: string,
  endDate: string,
): Promise<FinancialReportData> {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/api/reports/financial?start=${startDate}&end=${endDate}`,
  );
  const data = await handleResponse<{ data?: FinancialReportData }>(res);
  return (
    data?.data || {
      start: startDate,
      end: endDate,
      totalOperating: 0,
      totalSales: 0,
      ops: [],
      sales: [],
    }
  );
}

export async function exportReport(
  type: "production" | "sales" | "financial",
  format: "csv" | "pdf",
  startDate: string,
  endDate: string,
): Promise<Blob> {
  const res = await fetchWithAuth(
    `${API_BASE_URL}/api/reports/export/${type}?format=${format}&start=${startDate}&end=${endDate}`,
  );
  if (!res.ok) {
    throw new ApiError("Failed to export report", res.status);
  }
  return res.blob();
}

export async function getDashboardSummary(
  startDate: string,
  endDate: string,
): Promise<DashboardSummary> {
  const [production, sales, financial] = await Promise.all([
    getProductionReport(startDate, endDate).catch(() => null),
    getSalesReport(startDate, endDate).catch(() => null),
    getFinancialReport(startDate, endDate).catch(() => null),
  ]);

  const totalEggs = production?.totalEggs || 0;
  const crackedEggs =
    production?.logs.reduce((sum, log) => sum + (log.crackedEggs || 0), 0) || 0;
  const crackedPercent = totalEggs > 0 ? (crackedEggs / totalEggs) * 100 : 0;

  const totalRevenue = sales?.totalAmount || 0;
  const totalCratesSold = sales?.totalCrates || 0;
  const paidCount =
    sales?.rows.filter((row) => row.paymentStatus === "paid").length || 0;
  const pendingCount =
    sales?.rows.filter((row) => row.paymentStatus === "pending").length || 0;
  const pendingPayments =
    sales?.rows
      .filter((row) => row.paymentStatus === "pending")
      .reduce((sum, row) => sum + row.totalAmount, 0) || 0;

  const totalOperating = financial?.totalOperating || 0;
  const profitMargin =
    totalRevenue > 0
      ? ((totalRevenue - totalOperating) / totalRevenue) * 100
      : 0;

  return {
    production: {
      totalEggs,
      avgDaily: production?.avgPerDay || 0,
      crackedPercent: Math.round(crackedPercent * 10) / 10,
    },
    sales: {
      totalRevenue,
      totalCratesSold,
      pendingPayments,
      paidCount,
      pendingCount,
    },
    costs: {
      totalOperating,
      profitMargin: Math.round(profitMargin * 10) / 10,
    },
  };
}
