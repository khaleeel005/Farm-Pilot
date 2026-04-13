import type { Sale } from "@/types";

export interface CostBreakdown {
  birdCost: number;
  feedCost: number;
  fixedCosts: number;
  healthCosts: number;
  laborCost: number;
  total: number;
}

export interface PricingData {
  cost: number;
  current: number;
  markup: number;
  suggested: number;
}

export interface MonthlyProjection {
  avgCostPerEgg: number;
  avgDailyProduction: number;
  avgSellingPrice: number;
  daysInProjection: number;
  monthlyProfit: number;
  projectedEggs: number;
  profitPerEgg: number;
}

export interface CostEstimate {
  avgDailyProduction?: number;
  avgMonthlyProduction?: number;
  date: string;
  birdCostPerEgg?: number;
  feedCostPerEgg?: number;
  fixedCostPerEgg?: number;
  healthCostPerEgg?: number;
  laborCostPerEgg?: number;
  suggestedPrice?: number;
  totalCostPerEgg?: number;
}

export interface CostAnalysisOverviewData {
  avgDailyProduction: number;
  avgSellingPrice: number;
  costBreakdown: CostBreakdown;
  costEstimate: CostEstimate | null;
  effectiveSellingPrice: number;
  monthlyProjection: MonthlyProjection;
  pricingInsights: string[];
  pricingRecommendation: PricingData;
  profitMargin: number;
  profitPerEgg: number;
}

const DEFAULT_MARKUP = 20;

function toNumber(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getDaysInMonth(date: string | undefined): number {
  if (!date) {
    return 30;
  }

  const [yearValue, monthValue] = date.split("-");
  const year = Number(yearValue);
  const month = Number(monthValue);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return 30;
  }

  return new Date(year, month, 0).getDate();
}

export function getTodayIsoDate(): string {
  return new Date().toLocaleDateString("en-CA") ?? "";
}

export function calculateAverageSellingPrice(sales: Sale[]): number {
  const paidSales = sales.filter(
    (sale) => String(sale.paymentStatus || "").toLowerCase() === "paid",
  );

  const sourceSales = paidSales.length > 0 ? paidSales : sales;

  const totals = sourceSales.reduce(
    (sum, sale) => ({
      revenue: sum.revenue + toNumber(sale.totalAmount),
      quantity: sum.quantity + toNumber(sale.quantity),
    }),
    { revenue: 0, quantity: 0 },
  );

  const EGGS_PER_CRATE = 30;
  return totals.quantity > 0 ? (totals.revenue / totals.quantity) / EGGS_PER_CRATE : 0;
}

export function buildCostBreakdown(costEstimate: CostEstimate | null): CostBreakdown {
  const birdCost =
    toNumber(costEstimate?.birdCostPerEgg) ||
    toNumber(costEstimate?.healthCostPerEgg);

  return {
    birdCost,
    feedCost: toNumber(costEstimate?.feedCostPerEgg),
    laborCost: toNumber(costEstimate?.laborCostPerEgg),
    fixedCosts: toNumber(costEstimate?.fixedCostPerEgg),
    healthCosts: birdCost,
    total: toNumber(costEstimate?.totalCostPerEgg),
  };
}

export function getCostBreakdownItems(costBreakdown: CostBreakdown) {
  return [
    { key: "feed", label: "Feed Cost", amount: costBreakdown.feedCost },
    { key: "labor", label: "Labor Cost", amount: costBreakdown.laborCost },
    { key: "fixed", label: "Fixed Costs", amount: costBreakdown.fixedCosts },
    { key: "bird", label: "Bird Cost", amount: costBreakdown.birdCost },
  ];
}

export function getProfitMargin(
  effectiveSellingPrice: number,
  profitPerEgg: number,
): number {
  return effectiveSellingPrice > 0
    ? (profitPerEgg / effectiveSellingPrice) * 100
    : 0;
}

export function getProfitabilityLabel(profitMargin: number): string {
  if (profitMargin > 0) {
    return "Profitable at current pricing";
  }

  if (profitMargin < 0) {
    return "Current pricing is below cost";
  }

  return "Waiting for pricing data";
}

export function getPricingInsights(profitMargin: number): string[] {
  if (profitMargin > 20) {
    return [
      "Your pricing strategy is generating healthy margins.",
      "Consider maintaining prices during high-demand periods.",
    ];
  }

  if (profitMargin > 10) {
    return [
      "Margins are acceptable but could be improved.",
      "Consider a slight price increase if demand stays steady.",
    ];
  }

  if (profitMargin > 0) {
    return [
      "Current margins are below target.",
      "Review pricing or look for cost-reduction opportunities.",
    ];
  }

  return [
    "Record sales to unlock pricing insights.",
    "Suggested prices already include a recommended markup.",
  ];
}

export function buildCostAnalysisOverviewData(input: {
  costEstimate: CostEstimate | null;
  sales: Sale[];
}): CostAnalysisOverviewData {
  const costBreakdown = buildCostBreakdown(input.costEstimate);
  const avgSellingPrice = calculateAverageSellingPrice(input.sales);
  const fallbackSuggestedPrice = toNumber(input.costEstimate?.suggestedPrice);
  const effectiveSellingPrice = avgSellingPrice || fallbackSuggestedPrice;
  const profitPerEgg = effectiveSellingPrice - costBreakdown.total;
  const avgDailyProduction = toNumber(input.costEstimate?.avgDailyProduction);
  const avgMonthlyProduction = toNumber(input.costEstimate?.avgMonthlyProduction);
  const daysInProjection = getDaysInMonth(input.costEstimate?.date);
  const projectedEggs =
    avgMonthlyProduction || avgDailyProduction * daysInProjection;
  const monthlyProjection: MonthlyProjection = {
    avgDailyProduction,
    avgCostPerEgg: costBreakdown.total,
    avgSellingPrice: effectiveSellingPrice,
    daysInProjection,
    projectedEggs,
    profitPerEgg,
    monthlyProfit: profitPerEgg * projectedEggs,
  };
  const pricingRecommendation: PricingData = {
    cost: costBreakdown.total,
    markup: DEFAULT_MARKUP,
    suggested: fallbackSuggestedPrice,
    current: avgSellingPrice,
  };
  const profitMargin = getProfitMargin(effectiveSellingPrice, profitPerEgg);

  return {
    costEstimate: input.costEstimate,
    avgSellingPrice,
    avgDailyProduction,
    costBreakdown,
    effectiveSellingPrice,
    monthlyProjection,
    pricingRecommendation,
    profitPerEgg,
    profitMargin,
    pricingInsights: getPricingInsights(profitMargin),
  };
}
