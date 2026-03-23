import type { Sale } from "@/types";

export interface CostBreakdown {
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
  monthlyProfit: number;
  profitPerEgg: number;
}

export interface CostEstimate {
  avgDailyProduction?: number;
  avgMonthlyProduction?: number;
  date: string;
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

export function getTodayIsoDate(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export function calculateAverageSellingPrice(sales: Sale[]): number {
  const totals = sales.reduce(
    (sum, sale) => ({
      revenue: sum.revenue + toNumber(sale.totalAmount),
      quantity: sum.quantity + toNumber(sale.quantity),
    }),
    { revenue: 0, quantity: 0 },
  );

  return totals.quantity > 0 ? totals.revenue / totals.quantity : 0;
}

export function buildCostBreakdown(costEstimate: CostEstimate | null): CostBreakdown {
  return {
    feedCost: toNumber(costEstimate?.feedCostPerEgg),
    laborCost: toNumber(costEstimate?.laborCostPerEgg),
    fixedCosts: toNumber(costEstimate?.fixedCostPerEgg),
    healthCosts: toNumber(costEstimate?.healthCostPerEgg),
    total: toNumber(costEstimate?.totalCostPerEgg),
  };
}

export function getCostBreakdownItems(costBreakdown: CostBreakdown) {
  return [
    { key: "feed", label: "Feed Cost", amount: costBreakdown.feedCost },
    { key: "labor", label: "Labor Cost", amount: costBreakdown.laborCost },
    { key: "fixed", label: "Fixed Costs", amount: costBreakdown.fixedCosts },
    { key: "health", label: "Health Costs", amount: costBreakdown.healthCosts },
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
  const effectiveSellingPrice =
    avgSellingPrice || toNumber(input.costEstimate?.suggestedPrice);
  const profitPerEgg = effectiveSellingPrice - costBreakdown.total;
  const avgDailyProduction = toNumber(input.costEstimate?.avgDailyProduction);
  const monthlyProjection: MonthlyProjection = {
    avgDailyProduction,
    avgCostPerEgg: costBreakdown.total,
    avgSellingPrice: effectiveSellingPrice,
    profitPerEgg,
    monthlyProfit: profitPerEgg * avgDailyProduction * 30,
  };
  const pricingRecommendation: PricingData = {
    cost: costBreakdown.total,
    markup: DEFAULT_MARKUP,
    suggested: toNumber(input.costEstimate?.suggestedPrice),
    current: effectiveSellingPrice,
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
