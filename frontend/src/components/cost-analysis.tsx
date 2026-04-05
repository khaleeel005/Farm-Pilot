"use client";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  Target,
  AlertCircle,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ErrorState } from "@/components/shared/error-state";
import { useCostAnalysisOverview } from "@/hooks";
import { getCostBreakdownItems } from "@/lib/costAnalysis";
import { createBirdCost, getBirdCosts } from "@/lib/api";
import { useResourcePermissions, useToastContext } from "@/hooks";
import { useState, useEffect } from "react";

const emptyCostBreakdown = {
  birdCost: 0,
  feedCost: 0,
  laborCost: 0,
  fixedCosts: 0,
  healthCosts: 0,
  total: 0,
};

const emptyPricingRecommendation = {
  cost: 0,
  markup: 20,
  suggested: 0,
  current: 0,
};

const emptyMonthlyProjection = {
  avgDailyProduction: 0,
  avgCostPerEgg: 0,
  avgSellingPrice: 0,
  profitPerEgg: 0,
  monthlyProfit: 0,
};

export function CostAnalysis() {
  const { data, isPending, error, refetch } = useCostAnalysisOverview();
  const toast = useToastContext();
  const { canCreate: canCreateBirdCost } = useResourcePermissions("COSTS");
  const [birdCosts, setBirdCosts] = useState<Array<Record<string, unknown>>>([]);
  const [birdCostsLoading, setBirdCostsLoading] = useState(false);
  const [submittingBirdCost, setSubmittingBirdCost] = useState(false);
  const [birdCostForm, setBirdCostForm] = useState({
    batchDate: new Date().toLocaleDateString("en-CA"),
    birdsPurchased: "",
    costPerBird: "",
    vaccinationCostPerBird: "0",
    expectedLayingMonths: "12",
  });

  const loadBirdCosts = async () => {
    try {
      setBirdCostsLoading(true);
      const rows = await getBirdCosts();
      setBirdCosts(rows as unknown as Array<Record<string, unknown>>);
    } catch {
      setBirdCosts([]);
    } finally {
      setBirdCostsLoading(false);
    }
  };

  useEffect(() => {
    void loadBirdCosts();
  }, []);

  const handleAddBirdCost = async () => {
    try {
      const birdsPurchased = Number.parseInt(birdCostForm.birdsPurchased, 10);
      const costPerBird = Number.parseFloat(birdCostForm.costPerBird);
      const vaccinationCostPerBird = Number.parseFloat(
        birdCostForm.vaccinationCostPerBird,
      );
      const expectedLayingMonths = Number.parseInt(
        birdCostForm.expectedLayingMonths,
        10,
      );

      if (!birdCostForm.batchDate) {
        toast.error("Bird batch date is required.");
        return;
      }
      if (!Number.isInteger(birdsPurchased) || birdsPurchased <= 0) {
        toast.error("Birds purchased must be a positive integer.");
        return;
      }
      if (!Number.isFinite(costPerBird) || costPerBird < 0) {
        toast.error("Cost per bird must be a non-negative number.");
        return;
      }
      if (
        !Number.isFinite(vaccinationCostPerBird) ||
        vaccinationCostPerBird < 0
      ) {
        toast.error("Vaccination cost per bird must be non-negative.");
        return;
      }
      if (!Number.isInteger(expectedLayingMonths) || expectedLayingMonths <= 0) {
        toast.error("Expected laying months must be a positive integer.");
        return;
      }

      setSubmittingBirdCost(true);
      await createBirdCost({
        batchDate: birdCostForm.batchDate,
        birdsPurchased,
        costPerBird,
        vaccinationCostPerBird,
        expectedLayingMonths,
      });

      toast.success("Bird cost added successfully.");
      setBirdCostForm((prev) => ({
        ...prev,
        birdsPurchased: "",
        costPerBird: "",
        vaccinationCostPerBird: "0",
        expectedLayingMonths: "12",
      }));
      await Promise.all([loadBirdCosts(), refetch()]);
    } catch (createError) {
      console.error("Failed to create bird cost:", createError);
      toast.error(
        createError instanceof Error
          ? createError.message
          : "Failed to add bird cost.",
      );
    } finally {
      setSubmittingBirdCost(false);
    }
  };
  const costBreakdown = data?.costBreakdown ?? emptyCostBreakdown;
  const pricingRecommendation =
    data?.pricingRecommendation ?? emptyPricingRecommendation;
  const monthlyProjection = data?.monthlyProjection ?? emptyMonthlyProjection;
  const avgDailyProduction = data?.avgDailyProduction ?? 0;
  const profitPerEgg = data?.profitPerEgg ?? 0;
  const profitMargin = data?.profitMargin ?? 0;
  const pricingInsights = data?.pricingInsights ?? [];

  if (isPending) {
    return <LoadingSpinner fullPage message="Loading cost analysis..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load analysis"
        message={error.message}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Financial Intelligence"
        title="Cost Analysis"
        description="Real-time cost calculations and pricing recommendations"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Cost per Egg
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none">
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
              className={`display-heading text-3xl leading-none ${profitPerEgg > 0 ? "text-chart-5" : "text-destructive"}`}
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
              className={`display-heading text-3xl leading-none ${monthlyProjection.monthlyProfit > 0 ? "text-chart-5" : ""}`}
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
            <div className="display-heading text-3xl leading-none">
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
        <Card>
          <CardHeader>
            <CardTitle className="display-heading text-2xl">
              Cost Breakdown per Egg
            </CardTitle>
            <CardDescription>
              Detailed analysis of production costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {costBreakdown.total > 0 ? (
              <>
                {getCostBreakdownItems(costBreakdown).map((item) => (
                  <div key={item.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {((item.amount / costBreakdown.total) * 100).toFixed(1)}
                          % of total
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ₦{item.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={(item.amount / costBreakdown.total) * 100}
                      className="h-2"
                    />
                  </div>
                ))}

                <Separator />

                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/45 p-3">
                  <div className="font-medium">Total Cost per Egg</div>
                  <div className="display-heading text-3xl leading-none">
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

        <Card>
          <CardHeader>
            <CardTitle className="display-heading text-2xl">
              Pricing Recommendation
            </CardTitle>
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
                    {pricingInsights.map((insight) => (
                      <p key={insight}>• {insight}</p>
                    ))}
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

      <Card>
        <CardHeader>
          <CardTitle className="display-heading text-2xl">
            Profitability Analysis
          </CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle className="display-heading text-2xl">
            Bird Cost Setup
          </CardTitle>
          <CardDescription>
            Optional: add bird acquisition and vaccination costs for pricing
            calculations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canCreateBirdCost ? (
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border/70 bg-muted/35 p-3 md:grid-cols-5">
              <div className="space-y-1">
                <Label htmlFor="bird-batch-date">Batch Date</Label>
                <Input
                  id="bird-batch-date"
                  type="date"
                  value={birdCostForm.batchDate}
                  onChange={(event) =>
                    setBirdCostForm((prev) => ({
                      ...prev,
                      batchDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="birds-purchased">Birds</Label>
                <Input
                  id="birds-purchased"
                  type="number"
                  min="1"
                  value={birdCostForm.birdsPurchased}
                  onChange={(event) =>
                    setBirdCostForm((prev) => ({
                      ...prev,
                      birdsPurchased: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cost-per-bird">Cost/Bird (₦)</Label>
                <Input
                  id="cost-per-bird"
                  type="number"
                  min="0"
                  step="0.01"
                  value={birdCostForm.costPerBird}
                  onChange={(event) =>
                    setBirdCostForm((prev) => ({
                      ...prev,
                      costPerBird: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vaccination-cost">Vaccination/Bird (₦)</Label>
                <Input
                  id="vaccination-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={birdCostForm.vaccinationCostPerBird}
                  onChange={(event) =>
                    setBirdCostForm((prev) => ({
                      ...prev,
                      vaccinationCostPerBird: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="laying-months">Laying Months</Label>
                <Input
                  id="laying-months"
                  type="number"
                  min="1"
                  value={birdCostForm.expectedLayingMonths}
                  onChange={(event) =>
                    setBirdCostForm((prev) => ({
                      ...prev,
                      expectedLayingMonths: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-5">
                <Button
                  onClick={() => {
                    void handleAddBirdCost();
                  }}
                  disabled={submittingBirdCost}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {submittingBirdCost ? "Saving..." : "Add Bird Cost"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You do not have permission to add bird cost entries.
            </p>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Bird Cost Batches</p>
            {birdCostsLoading ? (
              <p className="text-sm text-muted-foreground">Loading bird costs...</p>
            ) : birdCosts.length > 0 ? (
              <div className="space-y-2">
                {birdCosts.slice(0, 5).map((row, index) => (
                  <div
                    key={String(row.id ?? index)}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 p-3"
                  >
                    <span className="text-sm font-medium">
                      {String(row.batchDate ?? "-")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Number(row.birdsPurchased || 0).toLocaleString()} birds
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ₦{Number(row.costPerBird || 0).toLocaleString()} / bird
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Number(row.expectedLayingMonths || 0)} months
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No bird cost batches yet. Add one to include bird cost in
                calculations.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
