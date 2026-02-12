"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  Target,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getEggPriceEstimate, getSales } from "@/lib/api";

interface CostBreakdown {
  feedCost: number;
  laborCost: number;
  fixedCosts: number;
  healthCosts: number;
  total: number;
}

interface PricingData {
  cost: number;
  markup: number;
  suggested: number;
  current: number;
}

interface MonthlyProjection {
  avgDailyProduction: number;
  avgCostPerEgg: number;
  avgSellingPrice: number;
  profitPerEgg: number;
  monthlyProfit: number;
}

interface CostEstimate {
  date: string;
  avgMonthlyProduction: number;
  avgDailyProduction: number;
  feedCostPerEgg: number;
  laborCostPerEgg: number;
  fixedCostPerEgg: number;
  healthCostPerEgg: number;
  totalCostPerEgg: number;
  suggestedPrice: number;
}

export function CostAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costData, setCostData] = useState<CostEstimate | null>(null);
  const [avgSellingPrice, setAvgSellingPrice] = useState(0);

  useEffect(() => {
    loadCostData();
  }, []);

  const loadCostData = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split("T")[0];

      // Fetch cost estimate and recent sales in parallel
      const [costEstimate, salesData] = await Promise.all([
        getEggPriceEstimate(today),
        getSales({ limit: "100" }).catch(() => []),
      ]);

      setCostData(costEstimate as CostEstimate);

      // Calculate average selling price from recent sales
      const sales = Array.isArray(salesData) ? salesData : [];
      if (sales.length > 0) {
        const totalRevenue = sales.reduce(
          (sum: number, sale: { totalAmount?: number; quantity?: number }) =>
            sum + (Number(sale.totalAmount) || 0),
          0,
        );
        const totalEggs = sales.reduce(
          (sum: number, sale: { totalAmount?: number; quantity?: number }) =>
            sum + (Number(sale.quantity) || 0),
          0,
        );
        setAvgSellingPrice(totalEggs > 0 ? totalRevenue / totalEggs : 0);
      }
    } catch (err) {
      console.error("Failed to load cost data:", err);
      setError("Failed to load cost analysis data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate derived values
  const costBreakdown: CostBreakdown = costData
    ? {
        feedCost: Number(costData.feedCostPerEgg) || 0,
        laborCost: Number(costData.laborCostPerEgg) || 0,
        fixedCosts: Number(costData.fixedCostPerEgg) || 0,
        healthCosts: Number(costData.healthCostPerEgg) || 0,
        total: Number(costData.totalCostPerEgg) || 0,
      }
    : {
        feedCost: 0,
        laborCost: 0,
        fixedCosts: 0,
        healthCosts: 0,
        total: 0,
      };

  const pricingRecommendation: PricingData = costData
    ? {
        cost: costBreakdown.total,
        markup: 20,
        suggested: Number(costData.suggestedPrice) || 0,
        current: avgSellingPrice || Number(costData.suggestedPrice) || 0,
      }
    : { cost: 0, markup: 20, suggested: 0, current: 0 };

  const effectiveSellingPrice =
    avgSellingPrice || costData?.suggestedPrice || 0;
  const profitPerEgg = effectiveSellingPrice - costBreakdown.total;
  const avgDailyProduction = Number(costData?.avgDailyProduction) || 0;

  const monthlyProjection: MonthlyProjection = {
    avgDailyProduction,
    avgCostPerEgg: costBreakdown.total,
    avgSellingPrice: effectiveSellingPrice,
    profitPerEgg,
    monthlyProfit: profitPerEgg * avgDailyProduction * 30,
  };

  const profitMargin =
    effectiveSellingPrice > 0
      ? (profitPerEgg / effectiveSellingPrice) * 100
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <button onClick={loadCostData} className="text-primary hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-balance">Cost Analysis</h2>
        <p className="text-muted-foreground">
          Real-time cost calculations and pricing recommendations
        </p>
      </div>

      {/* Cost Overview */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Cost per Egg
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {costBreakdown.total > 0
                ? `₦${costBreakdown.total.toFixed(2)}`
                : "N/A"}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {costBreakdown.total > 0 ? (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-chart-5" />
                  Based on current data
                </>
              ) : (
                "No production data"
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Profit per Egg
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl sm:text-2xl font-bold ${profitPerEgg > 0 ? "text-chart-5" : "text-destructive"}`}
            >
              {profitPerEgg !== 0 ? `₦${profitPerEgg.toFixed(2)}` : "N/A"}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {profitPerEgg > 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-chart-5" />
                  At current prices
                </>
              ) : (
                "Set selling prices"
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Profit
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${monthlyProjection.monthlyProfit > 0 ? "text-chart-5" : ""}`}
            >
              {monthlyProjection.monthlyProfit !== 0
                ? `₦${monthlyProjection.monthlyProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">
              {avgDailyProduction > 0
                ? `${avgDailyProduction.toFixed(0)} eggs/day avg`
                : "Based on 30 days"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitMargin !== 0 ? `${profitMargin.toFixed(1)}%` : "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">
              {profitMargin > 15
                ? "Above industry average"
                : profitMargin > 0
                  ? "Below target"
                  : "Set prices first"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown per Egg</CardTitle>
            <CardDescription>
              Detailed analysis of production costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {costBreakdown.total > 0 ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Feed Cost</div>
                      <div className="text-xs text-muted-foreground">
                        {(
                          (costBreakdown.feedCost / costBreakdown.total) *
                          100
                        ).toFixed(1)}
                        % of total
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ₦{costBreakdown.feedCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={(costBreakdown.feedCost / costBreakdown.total) * 100}
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Labor Cost</div>
                      <div className="text-xs text-muted-foreground">
                        {(
                          (costBreakdown.laborCost / costBreakdown.total) *
                          100
                        ).toFixed(1)}
                        % of total
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ₦{costBreakdown.laborCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={
                      (costBreakdown.laborCost / costBreakdown.total) * 100
                    }
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Fixed Costs</div>
                      <div className="text-xs text-muted-foreground">
                        {(
                          (costBreakdown.fixedCosts / costBreakdown.total) *
                          100
                        ).toFixed(1)}
                        % of total
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ₦{costBreakdown.fixedCosts.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={
                      (costBreakdown.fixedCosts / costBreakdown.total) * 100
                    }
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Health Costs</div>
                      <div className="text-xs text-muted-foreground">
                        {(
                          (costBreakdown.healthCosts / costBreakdown.total) *
                          100
                        ).toFixed(1)}
                        % of total
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ₦{costBreakdown.healthCosts.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={
                      (costBreakdown.healthCosts / costBreakdown.total) * 100
                    }
                    className="h-2"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="font-medium">Total Cost per Egg</div>
                  <div className="text-xl font-bold">
                    ₦{costBreakdown.total.toFixed(2)}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No cost data available.</p>
                <p className="text-sm mt-2">
                  Record daily logs and set up operating costs to see breakdown.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Recommendation</CardTitle>
            <CardDescription>
              Suggested price based on cost + margin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {costBreakdown.total > 0 ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Suggested Egg Price</div>
                      <div className="text-xs text-muted-foreground">
                        Break-even + {pricingRecommendation.markup}% margin
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium">
                        ₦{pricingRecommendation.suggested.toFixed(2)}/egg
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pricingRecommendation.current > 0
                          ? `Avg sale: ₦${pricingRecommendation.current.toFixed(2)}`
                          : "No sales data"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-sm">Suggested:</div>
                    <Badge variant="outline">
                      ₦{(pricingRecommendation.suggested * 12).toFixed(0)}/dozen
                    </Badge>
                    {pricingRecommendation.current > 0 &&
                      (pricingRecommendation.current >=
                      pricingRecommendation.suggested ? (
                        <Badge variant="default" className="text-xs">
                          Above recommended
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Below recommended
                        </Badge>
                      ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-accent" />
                    <div className="text-sm font-medium">Pricing Insights</div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {profitMargin > 20 ? (
                      <>
                        <p>
                          • Your pricing strategy is generating healthy margins
                        </p>
                        <p>
                          • Consider maintaining prices during high demand
                          periods
                        </p>
                      </>
                    ) : profitMargin > 10 ? (
                      <>
                        <p>• Margins are acceptable but could be improved</p>
                        <p>• Consider slight price increases</p>
                      </>
                    ) : profitMargin > 0 ? (
                      <>
                        <p>• Current margins are below target</p>
                        <p>
                          • Review pricing or look for cost reduction
                          opportunities
                        </p>
                      </>
                    ) : (
                      <>
                        <p>• Record sales to see pricing insights</p>
                        <p>• Suggested prices include recommended markups</p>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No pricing data available.</p>
                <p className="text-sm mt-2">
                  Cost data is needed to generate pricing recommendations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profitability Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Profitability Analysis</CardTitle>
          <CardDescription>Current performance and projections</CardDescription>
        </CardHeader>
        <CardContent>
          {avgDailyProduction > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Daily Profit
                </div>
                <div
                  className={`text-2xl font-bold ${profitPerEgg > 0 ? "text-chart-5" : ""}`}
                >
                  ₦
                  {(avgDailyProduction * profitPerEgg).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 0 },
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {avgDailyProduction.toFixed(0)} eggs × ₦
                  {profitPerEgg.toFixed(2)} profit
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Weekly Profit
                </div>
                <div
                  className={`text-2xl font-bold ${profitPerEgg > 0 ? "text-chart-5" : ""}`}
                >
                  ₦
                  {(avgDailyProduction * profitPerEgg * 7).toLocaleString(
                    undefined,
                    { maximumFractionDigits: 0 },
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  7 days production
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Monthly Profit
                </div>
                <div
                  className={`text-2xl font-bold ${profitPerEgg > 0 ? "text-chart-5" : ""}`}
                >
                  ₦
                  {monthlyProjection.monthlyProfit.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  30 days projection
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No production data available for profitability analysis.</p>
              <p className="text-sm mt-2">
                Record daily logs to see profit projections.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
