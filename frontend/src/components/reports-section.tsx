"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  FileSpreadsheet,
} from "lucide-react";
import { useResourcePermissions, useToastContext } from "@/hooks";
import { useReportsOverview } from "@/hooks/useReportsOverview";
import { exportReport } from "@/lib/api";
import {
  getReportDateRange,
  type ReportsDateRange,
  type ReportsExportFormat,
  type ReportsTab,
} from "@/lib/reportsOverview";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export function ReportsSection() {
  const [dateRange, setDateRange] = useState<ReportsDateRange>("last-30-days");
  const [reportType, setReportType] = useState<ReportsTab>("production");
  const [exportFormat, setExportFormat] = useState<ReportsExportFormat>("pdf");
  const [exporting, setExporting] = useState(false);
  const {
    data,
    error,
    isLoading,
    refetch,
  } = useReportsOverview(dateRange);

  // Permission checks - export is owner only
  const { canExport } = useResourcePermissions("REPORTS");
  const toast = useToastContext();
  const range = data?.range ?? getReportDateRange(dateRange);
  const productionData = data?.productionData ?? null;
  const topCustomers = data?.topCustomers ?? [];
  const weeklyData = data?.weeklyData ?? [];
  const metrics = data?.metrics ?? {
    totalEggs: 0,
    avgDaily: 0,
    crackedEggs: 0,
    crackedPercent: 0,
    totalRevenue: 0,
    totalEggsSold: 0,
    totalDozens: 0,
    avgPricePerDozen: 0,
    paidTransactions: 0,
    pendingTransactions: 0,
    totalOperatingCosts: 0,
    netProfit: 0,
    profitMargin: 0,
  };

  // Handle export
  const handleExport = async (
    type: ReportsTab,
    format: ReportsExportFormat,
  ) => {
    setExporting(true);
    const { startDate, endDate } = range;

    try {
      const blob = await exportReport(type, format, startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${startDate}-to-${endDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${type} report exported successfully`);
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading reports..." />;
  }

  if (error) {
    return (
      <EmptyState
        variant="reports"
        title="Failed to load reports"
        description={
          error instanceof Error ? error.message : "Please try refreshing."
        }
      />
    );
  }

  const headerActions = (
    <div className="flex gap-2">
      {canExport && (
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-transparent"
          onClick={() =>
            handleExport(
              reportType,
              exportFormat,
            )
          }
          disabled={exporting}
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exporting..." : "Export Data"}
        </Button>
      )}
      <Button
        className="flex items-center gap-2"
        onClick={() => {
          void refetch();
        }}
      >
        <FileText className="h-4 w-4" />
        Refresh Report
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Intelligence"
        title="Reports & Analytics"
        description="Comprehensive business insights and data export"
        actions={headerActions}
      />

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="display-heading flex items-center gap-2 text-2xl">
            <Calendar className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select
                value={dateRange}
                onValueChange={(value) =>
                  setDateRange(value as ReportsDateRange)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select
                value={reportType}
                onValueChange={(value) => setReportType(value as ReportsTab)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production Report</SelectItem>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="financial">Financial Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  setExportFormat(value as ReportsExportFormat)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="csv">CSV Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="production" className="text-xs sm:text-sm">
            Production
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs sm:text-sm">
            Sales
          </TabsTrigger>
          <TabsTrigger value="financial" className="text-xs sm:text-sm">
            Financial
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total Production
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </CardHeader>
              <CardContent>
                <div className="display-heading text-3xl leading-none">
                  {metrics.totalEggs.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(metrics.avgDaily)} eggs/day average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </CardHeader>
              <CardContent>
                <div className="display-heading text-3xl leading-none">
                  ₦{metrics.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalDozens} dozens sold
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Profit Margin
                </CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </CardHeader>
              <CardContent>
                <div className="display-heading text-3xl leading-none">
                  {metrics.profitMargin}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.profitMargin > 15 ? "Above" : "Below"} industry average
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="display-heading text-2xl">
                Weekly Performance Summary
              </CardTitle>
              <CardDescription>
                Production, sales, and profit trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Production (eggs)</TableHead>
                      <TableHead>Sales Revenue</TableHead>
                      <TableHead>Est. Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyData.map((week) => (
                      <TableRow key={week.week}>
                        <TableCell className="font-medium">
                          {week.week}
                        </TableCell>
                        <TableCell>
                          {week.production.toLocaleString()}
                        </TableCell>
                        <TableCell>₦{week.sales.toLocaleString()}</TableCell>
                        <TableCell className="text-chart-5">
                          ₦{week.profit.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  variant="reports"
                  title="No data available"
                  description="No production data found for the selected period."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total Eggs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {metrics.totalEggs.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Cracked Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {metrics.crackedPercent}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {metrics.crackedEggs.toLocaleString()} eggs
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Daily Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {Math.round(metrics.avgDaily)}
                </div>
                <div className="text-xs text-muted-foreground">
                  eggs per day
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="display-heading text-2xl">
                Production Log
              </CardTitle>
              <CardDescription>Daily production records</CardDescription>
            </CardHeader>
            <CardContent>
              {productionData?.logs && productionData.logs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Eggs Collected</TableHead>
                      <TableHead>Cracked</TableHead>
                      <TableHead>Feed Used (bags)</TableHead>
                      <TableHead>Mortality</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionData.logs.slice(0, 10).map((log, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {new Date(log.logDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {(log.eggsCollected || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{log.crackedEggs || 0}</TableCell>
                        <TableCell>{log.feedBagsUsed || 0}</TableCell>
                        <TableCell>{log.mortalityCount || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  variant="logs"
                  title="No production logs"
                  description="No production data found for the selected period."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold truncate">
                  ₦{metrics.totalRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Dozens Sold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">
                  {metrics.totalDozens.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Avg Price/Dozen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold truncate">
                  ₦{Math.round(metrics.avgPricePerDozen).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Payment Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">
                  {metrics.paidTransactions + metrics.pendingTransactions > 0
                    ? Math.round(
                        (metrics.paidTransactions /
                          (metrics.paidTransactions + metrics.pendingTransactions)) *
                          100,
                      )
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="display-heading text-2xl">
                Top Customers
              </CardTitle>
              <CardDescription>
                Best performing customers by revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topCustomers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Avg Order</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((customer) => (
                      <TableRow key={customer.name}>
                        <TableCell className="font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell>{customer.orders}</TableCell>
                        <TableCell>
                          ₦{customer.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          ₦{customer.avgOrder.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              customer.avgOrder > 10000
                                ? "default"
                                : "secondary"
                            }
                          >
                            {customer.avgOrder > 10000
                              ? "Business"
                              : "Individual"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  variant="customers"
                  title="No customer data"
                  description="No sales data found for the selected period."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-chart-5 truncate">
                  ₦{metrics.totalRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Operating Costs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-destructive truncate">
                  ₦{metrics.totalOperatingCosts.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Net Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-lg sm:text-2xl font-bold truncate ${metrics.netProfit >= 0 ? "text-chart-5" : "text-destructive"}`}
                >
                  ₦{metrics.netProfit.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="display-heading text-2xl">
                Profit & Loss Summary
              </CardTitle>
              <CardDescription>Financial performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col justify-between gap-2 rounded-lg border border-border/70 p-3 sm:flex-row sm:items-center">
                  <span className="font-medium text-sm">Total Revenue</span>
                  <span className="text-base sm:text-lg font-bold text-chart-5">
                    ₦{metrics.totalRevenue.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col justify-between gap-2 rounded-lg border border-border/70 p-3 sm:flex-row sm:items-center">
                  <span className="font-medium text-sm">
                    Total Operating Costs
                  </span>
                  <span className="text-base sm:text-lg font-bold text-destructive">
                    ₦{metrics.totalOperatingCosts.toLocaleString()}
                  </span>
                </div>

                <Separator />

                <div className="flex flex-col justify-between gap-2 rounded-lg border border-primary/25 bg-primary/10 p-3 sm:flex-row sm:items-center sm:p-4">
                  <span className="text-base sm:text-lg font-medium">
                    Net Profit
                  </span>
                  <span
                    className={`text-xl sm:text-2xl font-bold ${metrics.netProfit >= 0 ? "text-primary" : "text-destructive"}`}
                  >
                    ₦{metrics.netProfit.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col justify-between gap-2 rounded-lg border border-border/70 p-3 sm:flex-row sm:items-center">
                  <span className="font-medium text-sm">Profit Margin</span>
                  <Badge
                    variant={
                      metrics.profitMargin > 15
                        ? "default"
                        : metrics.profitMargin > 0
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {metrics.profitMargin}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Export Actions */}
      {canExport && (
        <Card>
          <CardHeader>
            <CardTitle className="display-heading flex items-center gap-2 text-2xl">
              <FileSpreadsheet className="h-5 w-5" />
              Quick Export Options
            </CardTitle>
            <CardDescription>
              Generate and download reports instantly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Button
                variant="outline"
                className="justify-start bg-transparent text-xs sm:text-sm"
                onClick={() => handleExport("production", "pdf")}
                disabled={exporting}
              >
                <Download className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Production Report (PDF)</span>
              </Button>
              <Button
                variant="outline"
                className="justify-start bg-transparent text-xs sm:text-sm"
                onClick={() => handleExport("sales", "csv")}
                disabled={exporting}
              >
                <Download className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Sales Data (CSV)</span>
              </Button>
              <Button
                variant="outline"
                className="justify-start bg-transparent text-xs sm:text-sm"
                onClick={() => handleExport("financial", "pdf")}
                disabled={exporting}
              >
                <Download className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Financial Summary (PDF)</span>
              </Button>
              <Button
                variant="outline"
                className="justify-start bg-transparent text-xs sm:text-sm"
                onClick={() => handleExport("production", "csv")}
                disabled={exporting}
              >
                <Download className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">All Data (CSV)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
