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
import { Egg, DollarSign, TrendingUp, TrendingDown, Users } from "lucide-react";
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
        title="Dashboard Overview"
        description={`Today: ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`}
      />

      {/* Key Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Eggs Collected
            </CardTitle>
            <Egg className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {safeNumber(todayStats.eggsCollected)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-chart-5" />+
              {calculatePercentageChange(
                safeNumber(todayStats.eggsCollected),
                safeNumber(todayStats.eggsYesterday),
              )}
              % from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Sales Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              ₦{safeNumber(todayStats.salesAmount).toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-chart-5" />+
              {calculatePercentageChange(
                safeNumber(todayStats.salesAmount),
                safeNumber(todayStats.salesYesterday),
              )}
              % from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Cost per Egg
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-chart-5 hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              ₦{safeNumber(todayStats.costPerEgg)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="mr-1 h-3 w-3 text-chart-5" />-
              {calculatePercentageChange(
                safeNumber(todayStats.costYesterday),
                safeNumber(todayStats.costPerEgg),
              )}
              % from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Active Workers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {safeNumber(todayStats.activeWorkers)}/
              {safeNumber(todayStats.totalWorkers)}
            </div>
            <Progress
              value={
                (safeNumber(todayStats.activeWorkers) /
                  (safeNumber(todayStats.totalWorkers) || 1)) *
                100
              }
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Production Trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Weekly Production Trend
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Egg collection over the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyData.map((day) => (
                <div
                  key={day.day}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 text-xs sm:text-sm font-medium flex-shrink-0">
                      {day.day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Progress
                        value={day.eggs > 0 ? (day.eggs / 450) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm font-medium w-10 sm:w-12 text-right flex-shrink-0">
                    {day.eggs > 0 ? day.eggs : "-"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Weekly Sales Trend
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Sales revenue over the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weeklyData.map((day) => (
                <div
                  key={`sales-${day.day}`}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 text-xs sm:text-sm font-medium flex-shrink-0">
                      {day.day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Progress
                        value={
                          day.sales > 0
                            ? Math.min((day.sales / 50000) * 100, 100)
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm font-medium w-16 sm:w-20 text-right flex-shrink-0 truncate">
                    {day.sales > 0 ? `₦${day.sales.toLocaleString()}` : "-"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* House Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            House Performance Today
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Production breakdown by house/coop
          </CardDescription>
        </CardHeader>
        <CardContent>
          {housePerformance.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {housePerformance.map((house) => (
                <div key={house.id} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm sm:text-base truncate mr-2">
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
                      className="flex-shrink-0"
                    >
                      {house.efficiency}%
                    </Badge>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">
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
