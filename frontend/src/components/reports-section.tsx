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
  type CustomerSummary,
  type ReportsDateRange,
  type ReportsExportFormat,
  type ReportsMetrics,
  type ReportsTab,
  type WeeklyReportSummary,
} from "@/lib/reportsOverview";
import type { ProductionReportData } from "@/lib/api";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

const EMPTY_METRICS: ReportsMetrics = {
  totalEggs: 0,
  avgDaily: 0,
  crackedEggs: 0,
  crackedPercent: 0,
  totalRevenue: 0,
  totalCratesSold: 0,
  avgPricePerCrate: 0,
  paidTransactions: 0,
  pendingTransactions: 0,
  totalOperatingCosts: 0,
  netProfit: 0,
  profitMargin: 0,
};

interface ReportsHeaderActionsProps {
  canExport: boolean;
  exportFormat: ReportsExportFormat;
  exporting: boolean;
  onExport: (type: ReportsTab, format: ReportsExportFormat) => Promise<void>;
  onRefresh: () => void;
  reportType: ReportsTab;
}

interface ReportConfigurationCardProps {
  dateRange: ReportsDateRange;
  exportFormat: ReportsExportFormat;
  onDateRangeChange: (value: ReportsDateRange) => void;
  onExportFormatChange: (value: ReportsExportFormat) => void;
  onReportTypeChange: (value: ReportsTab) => void;
  reportType: ReportsTab;
}

interface OverviewTabContentProps {
  metrics: ReportsMetrics;
  weeklyData: WeeklyReportSummary[];
}

interface ProductionTabContentProps {
  metrics: ReportsMetrics;
  productionData: ProductionReportData | null;
}

interface SalesTabContentProps {
  metrics: ReportsMetrics;
  topCustomers: CustomerSummary[];
}

interface FinancialTabContentProps {
  metrics: ReportsMetrics;
}

interface QuickExportActionsProps {
  exporting: boolean;
  onExport: (type: ReportsTab, format: ReportsExportFormat) => Promise<void>;
}

function ReportsHeaderActions({
  canExport,
  exportFormat,
  exporting,
  onExport,
  onRefresh,
  reportType,
}: ReportsHeaderActionsProps) {
  return (
    <div className="flex gap-2">
      {canExport && (
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-transparent"
          onClick={() => {
            void onExport(reportType, exportFormat);
          }}
          disabled={exporting}
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exporting..." : "Export Data"}
        </Button>
      )}
      <Button className="flex items-center gap-2" onClick={onRefresh}>
        <FileText className="h-4 w-4" />
        Refresh Report
      </Button>
    </div>
  );
}

function ReportConfigurationCard({
  dateRange,
  exportFormat,
  onDateRangeChange,
  onExportFormatChange,
  onReportTypeChange,
  reportType,
}: ReportConfigurationCardProps) {
  return (
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
            <Select value={dateRange} onValueChange={onDateRangeChange}>
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
            <Select value={reportType} onValueChange={onReportTypeChange}>
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
            <Select value={exportFormat} onValueChange={onExportFormatChange}>
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
  );
}

function OverviewTabContent({
  metrics,
  weeklyData,
}: OverviewTabContentProps) {
  return (
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
              {metrics.totalCratesSold} crates sold
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

      <Card>
        <CardHeader>
          <CardTitle className="display-heading text-2xl">
            Weekly Performance Summary
          </CardTitle>
          <CardDescription>Production, sales, and profit trends</CardDescription>
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
                    <TableCell className="font-medium">{week.week}</TableCell>
                    <TableCell>{week.production.toLocaleString()}</TableCell>
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
  );
}

function ProductionTabContent({
  metrics,
  productionData,
}: ProductionTabContentProps) {
  return (
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
            <div className="text-xs text-muted-foreground">eggs per day</div>
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
                {productionData.logs.slice(0, 10).map((log, index) => (
                  <TableRow key={index}>
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
  );
}

function SalesTabContent({ metrics, topCustomers }: SalesTabContentProps) {
  const paymentRate =
    metrics.paidTransactions + metrics.pendingTransactions > 0
      ? Math.round(
          (metrics.paidTransactions /
            (metrics.paidTransactions + metrics.pendingTransactions)) *
            100,
        )
      : 0;

  return (
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
              Crates Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {metrics.totalCratesSold.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Avg Price/Crate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold truncate">
              ₦{Math.round(metrics.avgPricePerCrate).toLocaleString()}
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
            <div className="text-lg sm:text-2xl font-bold">{paymentRate}%</div>
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
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.orders}</TableCell>
                    <TableCell>₦{customer.revenue.toLocaleString()}</TableCell>
                    <TableCell>₦{customer.avgOrder.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={customer.avgOrder > 10000 ? "default" : "secondary"}
                      >
                        {customer.avgOrder > 10000 ? "Business" : "Individual"}
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
  );
}

function FinancialTabContent({ metrics }: FinancialTabContentProps) {
  return (
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
              <span className="font-medium text-sm">Total Operating Costs</span>
              <span className="text-base sm:text-lg font-bold text-destructive">
                ₦{metrics.totalOperatingCosts.toLocaleString()}
              </span>
            </div>

            <Separator />

            <div className="flex flex-col justify-between gap-2 rounded-lg border border-primary/25 bg-primary/10 p-3 sm:flex-row sm:items-center sm:p-4">
              <span className="text-base sm:text-lg font-medium">Net Profit</span>
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
  );
}

function QuickExportActions({
  exporting,
  onExport,
}: QuickExportActionsProps) {
  const exportButtons: Array<{
    format: ReportsExportFormat;
    label: string;
    type: ReportsTab;
  }> = [
    { type: "production", format: "pdf", label: "Production Report (PDF)" },
    { type: "sales", format: "csv", label: "Sales Data (CSV)" },
    { type: "financial", format: "pdf", label: "Financial Summary (PDF)" },
    { type: "production", format: "csv", label: "All Data (CSV)" },
  ];

  return (
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
          {exportButtons.map((button) => (
            <Button
              key={`${button.type}-${button.format}`}
              variant="outline"
              className="justify-start bg-transparent text-xs sm:text-sm"
              onClick={() => {
                void onExport(button.type, button.format);
              }}
              disabled={exporting}
            >
              <Download className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">{button.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportsSection() {
  const [dateRange, setDateRange] = useState<ReportsDateRange>("last-30-days");
  const [reportType, setReportType] = useState<ReportsTab>("production");
  const [exportFormat, setExportFormat] = useState<ReportsExportFormat>("pdf");
  const [exporting, setExporting] = useState(false);
  const { data, error, isLoading, refetch } = useReportsOverview(dateRange);
  const { canExport } = useResourcePermissions("REPORTS");
  const toast = useToastContext();

  const range = data?.range ?? getReportDateRange(dateRange);
  const productionData = (data?.productionData ?? null) as ProductionReportData | null;
  const topCustomers = data?.topCustomers ?? [];
  const weeklyData = data?.weeklyData ?? [];
  const metrics = data?.metrics ?? EMPTY_METRICS;

  const handleExport = async (
    type: ReportsTab,
    format: ReportsExportFormat,
  ) => {
    setExporting(true);

    try {
      const blob = await exportReport(type, format, range.startDate, range.endDate);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${type}-report-${range.startDate}-to-${range.endDate}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      toast.success(`${type} report exported successfully`);
    } catch (exportError) {
      console.error("Export failed:", exportError);
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Reports & Analytics"
        description="Comprehensive business insights and data export"
        actions={
          <ReportsHeaderActions
            canExport={canExport}
            exportFormat={exportFormat}
            exporting={exporting}
            onExport={handleExport}
            onRefresh={() => {
              void refetch();
            }}
            reportType={reportType}
          />
        }
      />

      <ReportConfigurationCard
        dateRange={dateRange}
        exportFormat={exportFormat}
        onDateRangeChange={(value) => setDateRange(value)}
        onExportFormatChange={(value) => setExportFormat(value)}
        onReportTypeChange={(value) => setReportType(value)}
        reportType={reportType}
      />

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

        <OverviewTabContent metrics={metrics} weeklyData={weeklyData} />
        <ProductionTabContent metrics={metrics} productionData={productionData} />
        <SalesTabContent metrics={metrics} topCustomers={topCustomers} />
        <FinancialTabContent metrics={metrics} />
      </Tabs>

      {canExport && (
        <QuickExportActions exporting={exporting} onExport={handleExport} />
      )}
    </div>
  );
}
