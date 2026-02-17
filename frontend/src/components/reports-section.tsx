"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  getProductionReport,
  getSalesReport,
  getFinancialReport,
  exportReport,
  ProductionReportData,
  SalesReportData,
  FinancialReportData,
  getCustomers,
  getSales,
} from "@/lib/api";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

interface CustomerSummary {
  name: string;
  orders: number;
  revenue: number;
  avgOrder: number;
}

export function ReportsSection() {
  const [dateRange, setDateRange] = useState("last-30-days");
  const [reportType, setReportType] = useState("production");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Report data
  const [productionData, setProductionData] =
    useState<ProductionReportData | null>(null);
  const [salesData, setSalesData] = useState<SalesReportData | null>(null);
  const [financialData, setFinancialData] =
    useState<FinancialReportData | null>(null);
  const [topCustomers, setTopCustomers] = useState<CustomerSummary[]>([]);

  // Permission checks - export is owner only
  const { canExport } = useResourcePermissions("REPORTS");
  const toast = useToastContext();

  // Calculate date range
  const getDateRange = useCallback(() => {
    const end = new Date();
    let start = new Date();

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
  }, [dateRange]);

  // Load all report data
  const loadReports = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();

    try {
      const [production, sales, financial] = await Promise.all([
        getProductionReport(startDate, endDate).catch(() => null),
        getSalesReport(startDate, endDate).catch(() => null),
        getFinancialReport(startDate, endDate).catch(() => null),
      ]);

      setProductionData(production);
      setSalesData(sales);
      setFinancialData(financial);

      // Calculate top customers from sales data
      if (sales && sales.rows.length > 0) {
        try {
          const [customers, allSales] = await Promise.all([
            getCustomers(),
            getSales(),
          ]);

          // Group sales by customer
          const customerSalesMap = new Map<
            number,
            { orders: number; revenue: number }
          >();
          allSales.forEach((sale) => {
            if (sale.customerId) {
              const existing = customerSalesMap.get(sale.customerId) || {
                orders: 0,
                revenue: 0,
              };
              customerSalesMap.set(sale.customerId, {
                orders: existing.orders + 1,
                revenue: existing.revenue + (Number(sale.totalAmount) || 0),
              });
            }
          });

          // Map to customer names and sort by revenue
          const customerSummaries: CustomerSummary[] = [];
          customerSalesMap.forEach((value, customerId) => {
            const customer = customers.find((c) => c.id === customerId);
            if (customer) {
              customerSummaries.push({
                name: customer.customerName,
                orders: value.orders,
                revenue: value.revenue,
                avgOrder:
                  value.orders > 0
                    ? Math.round(value.revenue / value.orders)
                    : 0,
              });
            }
          });

          setTopCustomers(
            customerSummaries.sort((a, b) => b.revenue - a.revenue).slice(0, 5),
          );
        } catch {
          setTopCustomers([]);
        }
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [getDateRange, toast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Handle export
  const handleExport = async (
    type: "production" | "sales" | "financial",
    format: "csv" | "pdf",
  ) => {
    setExporting(true);
    const { startDate, endDate } = getDateRange();

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

  // Calculate derived stats
  const totalEggs = productionData?.totalEggs || 0;
  const avgDaily = productionData?.avgPerDay || 0;
  const crackedEggs =
    productionData?.logs.reduce((sum, l) => sum + (l.crackedEggs || 0), 0) || 0;
  const crackedPercent =
    totalEggs > 0 ? Math.round((crackedEggs / totalEggs) * 100 * 10) / 10 : 0;

  const totalRevenue = salesData?.totalAmount || 0;
  const totalEggsSold = salesData?.totalEggs || 0;
  const totalDozens = Math.floor(totalEggsSold / 12);
  const avgPricePerDozen = totalDozens > 0 ? totalRevenue / totalDozens : 0;
  const paidTransactions =
    salesData?.rows.filter((r) => r.paymentStatus === "paid").length || 0;
  const pendingTransactions =
    salesData?.rows.filter((r) => r.paymentStatus === "pending").length || 0;

  const totalOperatingCosts = financialData?.totalOperating || 0;
  const netProfit = totalRevenue - totalOperatingCosts;
  const profitMargin =
    totalRevenue > 0
      ? Math.round((netProfit / totalRevenue) * 100 * 10) / 10
      : 0;

  // Group production by week for weekly data
  const weeklyData = productionData?.logs
    ? (() => {
        const weeks: { [key: string]: { production: number; sales: number } } =
          {};
        productionData.logs.forEach((log, idx) => {
          const weekNum = Math.floor(idx / 7) + 1;
          const weekKey = `Week ${weekNum}`;
          if (!weeks[weekKey]) weeks[weekKey] = { production: 0, sales: 0 };
          weeks[weekKey].production += log.eggsCollected || 0;
        });

        // Add sales data by week
        salesData?.rows.forEach((sale, idx) => {
          const weekNum = Math.floor(idx / 7) + 1;
          const weekKey = `Week ${weekNum}`;
          if (!weeks[weekKey]) weeks[weekKey] = { production: 0, sales: 0 };
          weeks[weekKey].sales += sale.totalAmount || 0;
        });

        return Object.entries(weeks).map(([week, data]) => ({
          week,
          production: data.production,
          sales: data.sales,
          profit: Math.round(data.sales * 0.2), // Estimated profit margin
        }));
      })()
    : [];

  if (loading) {
    return <LoadingSpinner fullPage message="Loading reports..." />;
  }

  const headerActions = (
    <div className="flex gap-2">
      {canExport && (
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-transparent"
          onClick={() =>
            handleExport(
              reportType as "production" | "sales" | "financial",
              exportFormat as "csv" | "pdf",
            )
          }
          disabled={exporting}
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exporting..." : "Export Data"}
        </Button>
      )}
      <Button className="flex items-center gap-2" onClick={loadReports}>
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
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/70 bg-background/55 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
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
              <Select value={reportType} onValueChange={setReportType}>
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
              <Select value={exportFormat} onValueChange={setExportFormat}>
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
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total Production
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </CardHeader>
              <CardContent>
                <div className="display-heading text-3xl leading-none">
                  {totalEggs.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round(avgDaily)} eggs/day average
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
                  ₦{totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalDozens} dozens sold
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
                  {profitMargin}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {profitMargin > 15 ? "Above" : "Below"} industry average
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
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total Eggs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {totalEggs.toLocaleString()}
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
                  {crackedPercent}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {crackedEggs.toLocaleString()} eggs
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
                  {Math.round(avgDaily)}
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
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold truncate">
                  ₦{totalRevenue.toLocaleString()}
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
                  {totalDozens.toLocaleString()}
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
                  ₦{Math.round(avgPricePerDozen).toLocaleString()}
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
                  {paidTransactions + pendingTransactions > 0
                    ? Math.round(
                        (paidTransactions /
                          (paidTransactions + pendingTransactions)) *
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
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-chart-5 truncate">
                  ₦{totalRevenue.toLocaleString()}
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
                  ₦{totalOperatingCosts.toLocaleString()}
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
                  className={`text-lg sm:text-2xl font-bold truncate ${netProfit >= 0 ? "text-chart-5" : "text-destructive"}`}
                >
                  ₦{netProfit.toLocaleString()}
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
                    ₦{totalRevenue.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col justify-between gap-2 rounded-lg border border-border/70 p-3 sm:flex-row sm:items-center">
                  <span className="font-medium text-sm">
                    Total Operating Costs
                  </span>
                  <span className="text-base sm:text-lg font-bold text-destructive">
                    ₦{totalOperatingCosts.toLocaleString()}
                  </span>
                </div>

                <Separator />

                <div className="flex flex-col justify-between gap-2 rounded-lg border border-primary/25 bg-primary/10 p-3 sm:flex-row sm:items-center sm:p-4">
                  <span className="text-base sm:text-lg font-medium">
                    Net Profit
                  </span>
                  <span
                    className={`text-xl sm:text-2xl font-bold ${netProfit >= 0 ? "text-primary" : "text-destructive"}`}
                  >
                    ₦{netProfit.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col justify-between gap-2 rounded-lg border border-border/70 p-3 sm:flex-row sm:items-center">
                  <span className="font-medium text-sm">Profit Margin</span>
                  <Badge
                    variant={
                      profitMargin > 15
                        ? "default"
                        : profitMargin > 0
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {profitMargin}%
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
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
