"use client";

import { useState, useEffect } from "react";
import {
  getDailyLogs,
  getHouses,
  getSales,
  getLaborers,
  getEggPriceEstimate,
} from "@/lib/api";
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
import { House } from "@/types";
import { CardGridSkeleton } from "@/components/shared/loading-spinner";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

type Log = {
  id: string | number;
  logDate: string;
  houseId: number | string;
  eggsCollected: number;
  feedBagsUsed: number;
  notes?: string;
  House?: { houseName?: string };
};

interface HousePerformance {
  id: number;
  name: string;
  eggs: number;
  capacity: number;
  efficiency: number;
}

export function DashboardOverview() {
  const [stats, setStats] = useState({
    eggsCollected: 0,
    eggsYesterday: 0,
    salesAmount: 0,
    salesYesterday: 0,
    costPerEgg: 0,
    costYesterday: 0,
    activeWorkers: 0,
    totalWorkers: 0,
  });
  const [weeklyData, setWeeklyData] = useState([
    { day: "Mon", eggs: 0, sales: 0 },
    { day: "Tue", eggs: 0, sales: 0 },
    { day: "Wed", eggs: 0, sales: 0 },
    { day: "Thu", eggs: 0, sales: 0 },
    { day: "Fri", eggs: 0, sales: 0 },
    { day: "Sat", eggs: 0, sales: 0 },
    { day: "Sun", eggs: 0, sales: 0 },
  ]);
  const [housePerformance, setHousePerformance] = useState<HousePerformance[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0];

        // Fetch all data in parallel
        const [
          todayLogsRes,
          yesterdayLogsRes,
          housesRes,
          todaySalesRes,
          yesterdaySalesRes,
          laborersRes,
          costEstimateRes,
        ] = await Promise.all([
          getDailyLogs({ date: today }),
          getDailyLogs({ date: yesterday }),
          getHouses().catch(() => []),
          getSales({ startDate: today, endDate: today }).catch(() => []),
          getSales({ startDate: yesterday, endDate: yesterday }).catch(
            () => [],
          ),
          getLaborers().catch(() => []),
          getEggPriceEstimate(today).catch(() => ({ totalCostPerEgg: 0 })),
        ]);

        const todayLogs: Log[] = (todayLogsRes as Log[]) || [];
        const yesterdayLogs: Log[] = (yesterdayLogsRes as Log[]) || [];
        const houses: House[] = (housesRes as House[]) || [];
        const todaySales = Array.isArray(todaySalesRes) ? todaySalesRes : [];
        const yesterdaySales = Array.isArray(yesterdaySalesRes)
          ? yesterdaySalesRes
          : [];
        const laborers = Array.isArray(laborersRes) ? laborersRes : [];
        const costEstimate =
          (costEstimateRes as { totalCostPerEgg?: number }) || {};

        const totalEggsToday = todayLogs.reduce(
          (sum, log) => sum + (Number(log.eggsCollected) || 0),
          0,
        );
        const totalEggsYesterday = yesterdayLogs.reduce(
          (sum, log) => sum + (Number(log.eggsCollected) || 0),
          0,
        );

        // Calculate sales totals
        const todaySalesTotal = todaySales.reduce(
          (sum, sale: { totalAmount?: number }) =>
            sum + (Number(sale.totalAmount) || 0),
          0,
        );
        const yesterdaySalesTotal = yesterdaySales.reduce(
          (sum, sale: { totalAmount?: number }) =>
            sum + (Number(sale.totalAmount) || 0),
          0,
        );

        // Calculate house performance
        const housePerf: HousePerformance[] = houses.map((house) => {
          const houseLogs = todayLogs.filter(
            (log) => Number(log.houseId) === house.id,
          );
          const houseEggs = houseLogs.reduce(
            (sum, log) => sum + (Number(log.eggsCollected) || 0),
            0,
          );
          const capacity = house.currentBirdCount || house.capacity || 100;
          // Efficiency is eggs collected / expected production (assuming ~1 egg per bird per day max)
          const efficiency =
            capacity > 0
              ? Math.min(100, Math.round((houseEggs / capacity) * 100))
              : 0;

          return {
            id: house.id,
            name: house.houseName || `House ${house.id}`,
            eggs: houseEggs,
            capacity,
            efficiency,
          };
        });

        // Count active laborers
        const activeLaborers = laborers.filter(
          (l: { isActive?: boolean }) => l.isActive !== false,
        ).length;

        // Fetch weekly data (logs and sales in parallel)
        const weeklyLogPromises = [];
        const weeklySalesPromises = [];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        for (let i = 6; i >= 0; i--) {
          const date = new Date(Date.now() - i * 86400000)
            .toISOString()
            .split("T")[0];
          weeklyLogPromises.push(getDailyLogs({ date }));
          weeklySalesPromises.push(
            getSales({ startDate: date, endDate: date }).catch(() => []),
          );
        }

        const [weeklyLogResults, weeklySalesResults] = await Promise.all([
          Promise.all(weeklyLogPromises),
          Promise.all(weeklySalesPromises),
        ]);

        const newWeeklyData = weeklyLogResults.map((result, index) => {
          const logs: Log[] = (result as Log[]) || [];
          const totalEggs = logs.reduce(
            (sum, log) => sum + (Number(log.eggsCollected) || 0),
            0,
          );
          const dayIndex = new Date(
            Date.now() - (6 - index) * 86400000,
          ).getDay();

          // Calculate actual sales for this day
          const daySales = Array.isArray(weeklySalesResults[index])
            ? weeklySalesResults[index]
            : [];
          const totalSales = daySales.reduce(
            (sum: number, sale: { totalAmount?: number }) =>
              sum + (Number(sale.totalAmount) || 0),
            0,
          );

          return {
            day: dayNames[dayIndex],
            eggs: totalEggs,
            sales: totalSales,
          };
        });

        setStats({
          eggsCollected: totalEggsToday,
          eggsYesterday: totalEggsYesterday,
          salesAmount: todaySalesTotal,
          salesYesterday: yesterdaySalesTotal,
          costPerEgg: Number(costEstimate.totalCostPerEgg) || 0,
          costYesterday: 0, // Would need historical data
          activeWorkers: activeLaborers,
          totalWorkers: laborers.length,
        });

        setHousePerformance(housePerf);
        setWeeklyData(newWeeklyData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const todayStats = stats;

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

  if (loading) {
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
          message={error}
          onRetry={() => window.location.reload()}
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
