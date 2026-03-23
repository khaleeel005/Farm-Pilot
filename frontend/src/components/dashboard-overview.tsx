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
import {
  Egg,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { CardGridSkeleton } from "@/components/shared/loading-spinner";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";
import { EMPTY_DASHBOARD_STATS } from "@/lib/dashboardOverview";

export function DashboardOverview() {
  const { data, error, isLoading, refetch } = useDashboardOverview();
  const todayStats = data?.stats ?? EMPTY_DASHBOARD_STATS;
  const weeklyData = data?.weeklyData ?? [];
  const housePerformance = data?.housePerformance ?? [];

  // Helper function to calculate percentage change safely
  const calculatePercentageChange = (
    current: number,
    previous: number,
  ): string => {
    // Ensure both values are valid numbers
    const currentVal = Number(current) || 0;
    const previousVal = Number(previous) || 0;

    if (previousVal === 0) return currentVal > 0 ? "100.0" : "0.0";
    const result = ((currentVal - previousVal) / previousVal) * 100;
    return isNaN(result) ? "0.0" : result.toFixed(1);
  };

  const safeNumber = (value: unknown): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const maxWeeklyEggs = Math.max(
    1,
    ...weeklyData.map((day) => safeNumber(day.eggs)),
  );
  const maxWeeklySales = Math.max(
    1,
    ...weeklyData.map((day) => safeNumber(day.sales)),
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard Overview"
          description="Loading your farm data..."
        />
        <CardGridSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard Overview" />
        <ErrorState
          title="Failed to load dashboard"
          message={error instanceof Error ? error.message : "Failed to load dashboard"}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Farm Activity"
        title="Dashboard Overview"
        description={`Today: ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eggs Collected
            </CardTitle>
            <div className="rounded-lg bg-primary/10 p-2">
              <Egg className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl">
              {safeNumber(todayStats.eggsCollected)}
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-primary" />+
              {calculatePercentageChange(
                safeNumber(todayStats.eggsCollected),
                safeNumber(todayStats.eggsYesterday),
              )}
              % from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sales Revenue
            </CardTitle>
            <div className="rounded-lg bg-chart-2/15 p-2">
              <DollarSign className="h-4 w-4 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl">
              ₦{safeNumber(todayStats.salesAmount).toLocaleString()}
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-primary" />+
              {calculatePercentageChange(
                safeNumber(todayStats.salesAmount),
                safeNumber(todayStats.salesYesterday),
              )}
              % from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cost per Egg
            </CardTitle>
            <div className="rounded-lg bg-chart-5/15 p-2">
              <TrendingDown className="h-4 w-4 text-chart-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl">
              ₦{safeNumber(todayStats.costPerEgg)}
            </div>
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <TrendingDown className="mr-1 h-3 w-3 text-chart-5" />-
              {calculatePercentageChange(
                safeNumber(todayStats.costYesterday),
                safeNumber(todayStats.costPerEgg),
              )}
              % from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Workers
            </CardTitle>
            <div className="rounded-lg bg-info/15 p-2">
              <Users className="h-4 w-4 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl">
              {safeNumber(todayStats.activeWorkers)}/
              {safeNumber(todayStats.totalWorkers)}
            </div>
            <Progress
              value={
                (safeNumber(todayStats.activeWorkers) /
                  (safeNumber(todayStats.totalWorkers) || 1)) *
                100
              }
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Production Trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-4 w-4 text-primary" />
              Weekly Production Trend
            </CardTitle>
            <CardDescription className="text-sm">
              Egg collection over the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyData.map((day) => (
                <div
                  key={day.day}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 shrink-0 text-sm font-medium">
                      {day.day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Progress
                        value={
                          safeNumber(day.eggs) > 0
                            ? (safeNumber(day.eggs) / maxWeeklyEggs) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                  <div className="w-12 shrink-0 text-right text-sm font-medium">
                    {day.eggs > 0 ? day.eggs : "-"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowUpRight className="h-4 w-4 text-chart-2" />
              Weekly Sales Trend
            </CardTitle>
            <CardDescription className="text-sm">
              Sales revenue over the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyData.map((day) => (
                <div
                  key={`sales-${day.day}`}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 shrink-0 text-sm font-medium">
                      {day.day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Progress
                        value={
                          safeNumber(day.sales) > 0
                            ? Math.min((safeNumber(day.sales) / maxWeeklySales) * 100, 100)
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                  <div className="w-24 shrink-0 truncate text-right text-sm font-medium">
                    {day.sales > 0 ? `₦${day.sales.toLocaleString()}` : "-"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* House Performance */}
      <Card className="border-border/70 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            House Performance Today
          </CardTitle>
          <CardDescription className="text-sm">
            Production breakdown by house/coop
          </CardDescription>
        </CardHeader>
        <CardContent>
          {housePerformance.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {housePerformance.map((house) => (
                <div
                  key={house.id}
                  className="space-y-3 rounded-xl border border-border/70 bg-background/55 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="truncate pr-2 text-base font-medium">
                      {house.name}
                    </h4>
                    <Badge
                      variant={
                        house.efficiency > 80
                          ? "default"
                          : house.efficiency > 50
                            ? "secondary"
                            : "destructive"
                      }
                      className="shrink-0"
                    >
                      {house.efficiency}%
                    </Badge>
                  </div>
                  <div className="display-heading text-3xl">
                    {house.eggs} eggs
                  </div>
                  <Progress value={house.efficiency} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {house.eggs}/{house.capacity} birds
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              variant="houses"
              title="No house data available"
              description="Add houses and record daily logs to see performance metrics."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
