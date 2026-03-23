import type {
  FinancialReportData,
  ProductionReportData,
  SalesReportData,
} from "@/lib/api";
import type { Customer } from "@/types";

export type ReportsDateRange =
  | "last-7-days"
  | "last-30-days"
  | "last-90-days"
  | "this-year";

export type ReportsExportFormat = "csv" | "pdf";

export type ReportsTab = "production" | "sales" | "financial";

export interface CustomerSummary {
  name: string;
  orders: number;
  revenue: number;
  avgOrder: number;
}

export interface WeeklyReportSummary {
  week: string;
  production: number;
  sales: number;
  profit: number;
}

export interface ReportsMetrics {
  totalEggs: number;
  avgDaily: number;
  crackedEggs: number;
  crackedPercent: number;
  totalRevenue: number;
  totalEggsSold: number;
  totalDozens: number;
  avgPricePerDozen: number;
  paidTransactions: number;
  pendingTransactions: number;
  totalOperatingCosts: number;
  netProfit: number;
  profitMargin: number;
}

export interface ReportsDateRangeValues {
  startDate: string;
  endDate: string;
}

export interface ReportsOverviewData {
  productionData: ProductionReportData | null;
  salesData: SalesReportData | null;
  financialData: FinancialReportData | null;
  topCustomers: CustomerSummary[];
  weeklyData: WeeklyReportSummary[];
  metrics: ReportsMetrics;
  range: ReportsDateRangeValues;
}

export function getReportDateRange(
  dateRange: ReportsDateRange,
  baseDate = new Date(),
): ReportsDateRangeValues {
  const end = new Date(baseDate);
  let start = new Date(baseDate);

  switch (dateRange) {
    case "last-7-days":
      start.setDate(end.getDate() - 7);
      break;
    case "last-30-days":
      start.setDate(end.getDate() - 30);
      break;
    case "last-90-days":
      start.setDate(end.getDate() - 90);
      break;
    case "this-year":
      start = new Date(end.getFullYear(), 0, 1);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export function buildReportsOverviewData(input: {
  customers: Customer[];
  financialData: FinancialReportData | null;
  productionData: ProductionReportData | null;
  range: ReportsDateRangeValues;
  salesData: SalesReportData | null;
}): ReportsOverviewData {
  const { customers, financialData, productionData, range, salesData } = input;

  const totalEggs = productionData?.totalEggs || 0;
  const avgDaily = productionData?.avgPerDay || 0;
  const crackedEggs =
    productionData?.logs.reduce((sum, log) => sum + (log.crackedEggs || 0), 0) ||
    0;
  const crackedPercent =
    totalEggs > 0 ? Math.round((crackedEggs / totalEggs) * 100 * 10) / 10 : 0;

  const totalRevenue = salesData?.totalAmount || 0;
  const totalEggsSold = salesData?.totalEggs || 0;
  const totalDozens = Math.floor(totalEggsSold / 12);
  const avgPricePerDozen = totalDozens > 0 ? totalRevenue / totalDozens : 0;
  const paidTransactions =
    salesData?.rows.filter((row) => row.paymentStatus === "paid").length || 0;
  const pendingTransactions =
    salesData?.rows.filter((row) => row.paymentStatus === "pending").length || 0;

  const totalOperatingCosts = financialData?.totalOperating || 0;
  const netProfit = totalRevenue - totalOperatingCosts;
  const profitMargin =
    totalRevenue > 0
      ? Math.round((netProfit / totalRevenue) * 100 * 10) / 10
      : 0;

  return {
    productionData,
    salesData,
    financialData,
    topCustomers: buildTopCustomers(customers, salesData),
    weeklyData: buildWeeklyReportSummary(
      range,
      productionData,
      salesData,
      totalOperatingCosts,
    ),
    metrics: {
      totalEggs,
      avgDaily,
      crackedEggs,
      crackedPercent,
      totalRevenue,
      totalEggsSold,
      totalDozens,
      avgPricePerDozen,
      paidTransactions,
      pendingTransactions,
      totalOperatingCosts,
      netProfit,
      profitMargin,
    },
    range,
  };
}

function buildTopCustomers(
  customers: Customer[],
  salesData: SalesReportData | null,
): CustomerSummary[] {
  if (!salesData || salesData.rows.length === 0) {
    return [];
  }

  const customerSalesMap = new Map<number, { orders: number; revenue: number }>();

  salesData.rows.forEach((sale) => {
    if (!sale.customerId) {
      return;
    }

    const existing = customerSalesMap.get(sale.customerId) || {
      orders: 0,
      revenue: 0,
    };

    customerSalesMap.set(sale.customerId, {
      orders: existing.orders + 1,
      revenue: existing.revenue + (Number(sale.totalAmount) || 0),
    });
  });

  const summaries: CustomerSummary[] = [];

  customerSalesMap.forEach((value, customerId) => {
    const customer = customers.find((entry) => entry.id === customerId);
    if (!customer) {
      return;
    }

    summaries.push({
      name: customer.customerName,
      orders: value.orders,
      revenue: value.revenue,
      avgOrder: value.orders > 0 ? Math.round(value.revenue / value.orders) : 0,
    });
  });

  return summaries.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
}

function buildWeeklyReportSummary(
  range: ReportsDateRangeValues,
  productionData: ProductionReportData | null,
  salesData: SalesReportData | null,
  totalOperatingCosts: number,
): WeeklyReportSummary[] {
  const rangeStart = new Date(range.startDate);
  const rangeEnd = new Date(range.endDate);
  const totalRangeDays = Math.max(
    1,
    Math.floor(
      (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1,
  );

  const weekBuckets = new Map<
    number,
    { week: string; production: number; sales: number; days: Set<string> }
  >();

  const getWeekIndex = (isoDate: string) => {
    const date = new Date(isoDate);
    const diffDays = Math.floor(
      (date.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, Math.floor(diffDays / 7));
  };

  productionData?.logs.forEach((log) => {
    const weekIndex = getWeekIndex(log.logDate);
    const existing = weekBuckets.get(weekIndex) || {
      week: `Week ${weekIndex + 1}`,
      production: 0,
      sales: 0,
      days: new Set<string>(),
    };

    existing.production += log.eggsCollected || 0;
    existing.days.add(log.logDate);
    weekBuckets.set(weekIndex, existing);
  });

  salesData?.rows.forEach((sale) => {
    const weekIndex = getWeekIndex(sale.saleDate);
    const existing = weekBuckets.get(weekIndex) || {
      week: `Week ${weekIndex + 1}`,
      production: 0,
      sales: 0,
      days: new Set<string>(),
    };

    existing.sales += sale.totalAmount || 0;
    existing.days.add(sale.saleDate);
    weekBuckets.set(weekIndex, existing);
  });

  const dailyOperatingCost = totalOperatingCosts / totalRangeDays;

  return Array.from(weekBuckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, data]) => {
      const activeDays = Math.max(1, data.days.size);
      const allocatedCost = dailyOperatingCost * activeDays;

      return {
        week: data.week,
        production: data.production,
        sales: data.sales,
        profit: Math.round(data.sales - allocatedCost),
      };
    });
}
