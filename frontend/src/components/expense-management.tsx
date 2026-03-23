"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  Receipt,
  Plus,
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { getCostTypes, getCostEntries, createCostEntry } from "@/lib/api";
import formatCurrency from "@/lib/format";
import {
  buildExpenseExportCsv,
  calculateExpenseMetrics,
  createEmptyCostEntry,
  extractCostEntries,
  extractCostTypes,
  filterExpenseEntries,
  getCurrentMonthRange,
  mapExpenseEntry,
  type ExpenseCategory,
  type ExpenseMetrics,
  type ExpenseRecord,
} from "@/lib/expenseManagement";
import type { CostEntry, CostTypeOption } from "@/types/entities/cost";
import { useToastContext } from "@/hooks";
import { PageHeader } from "@/components/shared/page-header";

interface ExpenseManagementProps {
  userRole?: "owner" | "staff";
}

const CATEGORY_OPTIONS: Array<{
  value: ExpenseCategory;
  label: string;
}> = [
  { value: "all", label: "All categories" },
  { value: "operational", label: "Operational" },
  { value: "capital", label: "Capital" },
  { value: "emergency", label: "Emergency" },
];

export function ExpenseManagement({
  userRole = "owner",
}: ExpenseManagementProps) {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] =
    useState<ExpenseCategory>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [costEntries, setCostEntries] = useState<CostEntry[]>([]);
  const [costTypes, setCostTypes] = useState<CostTypeOption[]>([]);
  const [newCostEntry, setNewCostEntry] = useState<Partial<CostEntry>>(
    createEmptyCostEntry,
  );
  const toast = useToastContext();

  const currentMonthRange = useMemo(() => getCurrentMonthRange(), []);

  const updateNewCostEntry = useCallback((updates: Partial<CostEntry>) => {
    setNewCostEntry((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetNewCostEntry = useCallback(() => {
    setNewCostEntry(createEmptyCostEntry());
  }, []);

  const loadCostData = useCallback(async () => {
    try {
      setLoading(true);
      const [typesRes, entriesRes] = await Promise.all([
        getCostTypes(),
        getCostEntries({
          startDate: currentMonthRange.startDate,
          endDate: currentMonthRange.endDate,
        }),
      ]);

      setCostTypes(extractCostTypes(typesRes));
      setCostEntries(extractCostEntries(entriesRes));
    } catch (error) {
      console.error("Failed to load cost data:", error);
      setCostEntries([]);
      setCostTypes([]);
      toast.error("Failed to load cost data.");
    } finally {
      setLoading(false);
    }
  }, [currentMonthRange.endDate, currentMonthRange.startDate, toast]);

  useEffect(() => {
    void loadCostData();
  }, [loadCostData]);

  const handleCreateCostEntry = useCallback(async () => {
    try {
      setLoading(true);
      const result = await createCostEntry(newCostEntry as Partial<CostEntry>);

      if (!result) {
        toast.error("Failed to add cost entry.");
        return;
      }

      setIsAddExpenseOpen(false);
      resetNewCostEntry();
      await loadCostData();
      toast.success("Cost entry added successfully.");
    } catch (error) {
      console.error("Failed to create cost entry:", error);
      toast.error("Failed to add cost entry.");
    } finally {
      setLoading(false);
    }
  }, [loadCostData, newCostEntry, resetNewCostEntry, toast]);

  const filteredExpenses = useMemo(
    () => filterExpenseEntries(costEntries, categoryFilter, searchTerm),
    [categoryFilter, costEntries, searchTerm],
  );

  const expenses = useMemo(
    () => filteredExpenses.map(mapExpenseEntry),
    [filteredExpenses],
  );

  const expenseMetrics = useMemo(
    () =>
      calculateExpenseMetrics(
        filteredExpenses,
        expenses,
        currentMonthRange.daysElapsed,
      ),
    [currentMonthRange.daysElapsed, expenses, filteredExpenses],
  );

  const handleExport = useCallback(() => {
    if (expenses.length === 0) {
      toast.error("No expenses available to export.");
      return;
    }

    const csv = buildExpenseExportCsv(expenses);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `expenses-${currentMonthRange.startDate}-to-${currentMonthRange.endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Expense export downloaded.");
  }, [
    currentMonthRange.endDate,
    currentMonthRange.startDate,
    expenses,
    toast,
  ]);

  if (loading && costEntries.length === 0 && costTypes.length === 0) {
    return <ExpenseLoadingState />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cost Ledger"
        title={userRole === "staff" ? "Log Expenses" : "Expense Management"}
        description={
          userRole === "staff"
            ? "Record and track farm expenses"
            : "Track and manage all farm expenses"
        }
        actions={
          <AddExpenseDialog
            costTypes={costTypes}
            loading={loading}
            newCostEntry={newCostEntry}
            open={isAddExpenseOpen}
            onEntryChange={updateNewCostEntry}
            onOpenChange={setIsAddExpenseOpen}
            onSubmit={handleCreateCostEntry}
          />
        }
      />

      <ExpenseStatsCards
        daysElapsed={currentMonthRange.daysElapsed}
        metrics={expenseMetrics}
        userRole={userRole}
      />

      <ExpenseListCard
        categoryFilter={categoryFilter}
        expenses={expenses}
        exportedRows={expenseMetrics.exportedRows}
        searchTerm={searchTerm}
        userRole={userRole}
        onCategoryChange={setCategoryFilter}
        onExport={handleExport}
        onSearchTermChange={setSearchTerm}
      />
    </div>
  );
}

function ExpenseLoadingState() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Loading cost data...</p>
      </div>
    </div>
  );
}

interface AddExpenseDialogProps {
  costTypes: CostTypeOption[];
  loading: boolean;
  newCostEntry: Partial<CostEntry>;
  open: boolean;
  onEntryChange: (updates: Partial<CostEntry>) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

function AddExpenseDialog({
  costTypes,
  loading,
  newCostEntry,
  open,
  onEntryChange,
  onOpenChange,
  onSubmit,
}: AddExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Operating Cost
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Add a single expense line (pick a type, enter amount and
            description).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
              Step 1
            </p>
            <h3 className="display-heading text-2xl">Expense Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newCostEntry.date || ""}
                  onChange={(e) => onEntryChange({ date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="costType">Cost Type</Label>
                <select
                  id="costType"
                  className="h-10 rounded-xl border border-input bg-background/80 px-3 py-2 text-sm"
                  value={newCostEntry.costType || ""}
                  onChange={(e) =>
                    onEntryChange({
                      costType: e.target.value as CostEntry["costType"],
                    })
                  }
                >
                  <option value="">Select cost type</option>
                  {costTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newCostEntry.description || ""}
                  onChange={(e) =>
                    onEntryChange({ description: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newCostEntry.amount || 0}
                  onChange={(e) =>
                    onEntryChange({
                      amount: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="h-10 rounded-xl border border-input bg-background/80 px-3 py-2 text-sm"
                  value={newCostEntry.category || "operational"}
                  onChange={(e) =>
                    onEntryChange({
                      category: e.target.value as NonNullable<
                        CostEntry["category"]
                      >,
                    })
                  }
                >
                  <option value="operational">Operational</option>
                  <option value="capital">Capital</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
              Step 2
            </p>
            <h3 className="display-heading text-2xl">Optional Metadata</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="vendor">Vendor (optional)</Label>
                <Input
                  id="vendor"
                  value={newCostEntry.vendor || ""}
                  onChange={(e) => onEntryChange({ vendor: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={newCostEntry.notes || ""}
                  onChange={(e) => onEntryChange({ notes: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ExpenseStatsCardsProps {
  daysElapsed: number;
  metrics: ExpenseMetrics;
  userRole: "owner" | "staff";
}

function ExpenseStatsCards({
  daysElapsed,
  metrics,
  userRole,
}: ExpenseStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium sm:text-sm">
            Total Expenses
          </CardTitle>
          <Receipt className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </CardHeader>
        <CardContent>
          <div className="truncate text-lg font-bold sm:text-2xl">
            {formatCompactCurrency(metrics.totalExpenses)}
          </div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>

      {userRole === "owner" && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Verified
              </CardTitle>
              <CheckCircle className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold sm:text-2xl">
                {metrics.verifiedExpenses}
              </div>
              <p className="text-xs text-muted-foreground">
                Includes receipt + vendor
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Documented
              </CardTitle>
              <CheckCircle className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold sm:text-2xl">
                {metrics.documentedExpenses}
              </div>
              <p className="text-xs text-muted-foreground">
                Vendor, note, or receipt attached
              </p>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium sm:text-sm">
            Avg Daily
          </CardTitle>
          <AlertCircle className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </CardHeader>
        <CardContent>
          <div className="truncate text-lg font-bold sm:text-2xl">
            {formatCompactCurrency(metrics.averageDailyExpense)}
          </div>
          <p className="text-xs text-muted-foreground">
            Based on {daysElapsed} days this month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface ExpenseListCardProps {
  categoryFilter: ExpenseCategory;
  expenses: ExpenseRecord[];
  exportedRows: number;
  searchTerm: string;
  userRole: "owner" | "staff";
  onCategoryChange: (value: ExpenseCategory) => void;
  onExport: () => void;
  onSearchTermChange: (value: string) => void;
}

function ExpenseListCard({
  categoryFilter,
  expenses,
  exportedRows,
  searchTerm,
  userRole,
  onCategoryChange,
  onExport,
  onSearchTermChange,
}: ExpenseListCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="display-heading text-2xl">
              Recent Expenses
            </CardTitle>
            <CardDescription>
              {userRole === "staff"
                ? "Your submitted expenses and their documentation quality"
                : "All farm expenses with searchable records"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value as ExpenseCategory)}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Input
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder="Search description, type, vendor..."
              className="h-9 w-full sm:w-[260px]"
            />
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV ({exportedRows})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              {userRole === "owner" && <TableHead>Submitted By</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow
                key={expense.id || `${expense.date}-${expense.description}`}
              >
                <TableCell>
                  {format(new Date(expense.date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {expense.description}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(Number(expense.amount))}
                </TableCell>
                {userRole === "owner" && (
                  <TableCell>{expense.submittedBy}</TableCell>
                )}
                <TableCell>
                  <ExpenseStatusBadge status={expense.status} />
                </TableCell>
                <TableCell>
                  {expense.receipt ? (
                    <span className="text-xs text-muted-foreground">
                      Receipt #{expense.receipt}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ExpenseStatusBadge({
  status,
}: {
  status: ExpenseRecord["status"];
}) {
  if (status === "verified") {
    return (
      <Badge className="border-transparent bg-success text-success-foreground">
        <CheckCircle className="mr-1 h-3 w-3" />
        Verified
      </Badge>
    );
  }

  if (status === "documented") {
    return <Badge variant="secondary">Documented</Badge>;
  }

  return <Badge variant="outline">Recorded</Badge>;
}

function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
