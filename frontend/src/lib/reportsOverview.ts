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
  totalCratesSold: number;
  avgPricePerCrate: number;
  paidTransactions: number;
  pendingTransactions: number;
  totalOperatingCosts: number;
  totalCostEntries: number;
  totalExpenses: number;
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

  // Format dates in local timezone before returning (YYYY-MM-DD)
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(end),
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
    productionData?.logs.reduce(
      (sum, log) => sum + (log.crackedEggs || 0),
      0,
    ) || 0;
  const crackedPercent =
    totalEggs > 0 ? Math.round((crackedEggs / totalEggs) * 100 * 10) / 10 : 0;

  const totalRevenue = salesData?.totalAmount || 0;
  const totalCratesSold = salesData?.totalCrates || 0;
  const avgPricePerCrate =
    totalCratesSold > 0 ? totalRevenue / totalCratesSold : 0;
  const paidTransactions =
    salesData?.rows.filter((row) => row.paymentStatus === "paid").length || 0;
  const pendingTransactions =
    salesData?.rows.filter((row) => row.paymentStatus === "pending").length ||
    0;

  const totalOperatingCosts = financialData?.totalOperating || 0;
  const totalCostEntries = financialData?.totalCostEntries || 0;
  const totalExpenses =
    financialData?.totalExpenses ?? totalOperatingCosts + totalCostEntries;
  // Use consistent totalSales from financial data if available, fallback to totalRevenue from sales
  const consistentRevenue = financialData?.totalSales ?? totalRevenue;
  const netProfit = consistentRevenue - totalExpenses;
  const profitMargin =
    consistentRevenue > 0
      ? Math.round((netProfit / consistentRevenue) * 100 * 10) / 10
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
      totalExpenses,
    ),
    metrics: {
      totalEggs,
      avgDaily,
      crackedEggs,
      crackedPercent,
      totalRevenue,
      totalCratesSold,
      avgPricePerCrate,
      paidTransactions,
      pendingTransactions,
      totalOperatingCosts,
      totalCostEntries,
      totalExpenses,
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

  const customerSalesMap = new Map<
    number | "walk-in",
    { orders: number; revenue: number }
  >();

  salesData.rows.forEach((sale) => {
    const key = sale.customerId || "walk-in";

    const existing = customerSalesMap.get(key) || {
      orders: 0,
      revenue: 0,
    };

    customerSalesMap.set(key, {
      orders: existing.orders + 1,
      revenue: existing.revenue + (Number(sale.totalAmount) || 0),
    });
  });

  const summaries: CustomerSummary[] = [];

  customerSalesMap.forEach((value, key) => {
    let name = "Walk-in Customers";
    if (key !== "walk-in") {
      const customer = customers.find((entry) => entry.id === key);
      if (!customer) {
        return;
      }
      name = customer.customerName;
    }

    summaries.push({
      name,
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
  totalExpenses: number,
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

    existing.sales += Number(sale.totalAmount) || 0;
    existing.days.add(sale.saleDate);
    weekBuckets.set(weekIndex, existing);
  });

  const dailyExpenses = totalExpenses / totalRangeDays;

  return Array.from(weekBuckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, data]) => {
      const activeDays = Math.max(1, data.days.size);
      const allocatedCost = dailyExpenses * activeDays;

      return {
        week: data.week,
        production: data.production,
        sales: data.sales,
        profit: Math.round(data.sales - allocatedCost),
      };
    });
}
