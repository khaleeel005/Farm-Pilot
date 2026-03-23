"use client";

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
import {
  buildCostTypeSelectOptions,
  buildExpenseCategoryOptions,
  getExpenseAmountValue,
  getExpenseCategoryValue,
  getExpenseCostTypeValue,
  getExpenseDateValue,
  getExpenseDescriptionValue,
  getExpenseListDescription,
  getExpenseNotesValue,
  getExpenseReceiptLabel,
  getExpenseRowKey,
  getExpenseSubmitButtonLabel,
  getExpenseVendorValue,
  parseExpenseAmountInput,
  shouldShowSubmittedBy,
  type ExpenseCategory,
  type ExpenseMetrics,
  type ExpenseRecord,
} from "@/lib/expenseManagement";
import type { CostEntry, CostTypeOption } from "@/types/entities/cost";
import { PageHeader } from "@/components/shared/page-header";
import { useExpenseManagement } from "@/hooks/useExpenseManagement";

interface ExpenseManagementProps {
  userRole?: "owner" | "staff";
}

interface AddExpenseDialogProps {
  costTypes: CostTypeOption[];
  loading: boolean;
  newCostEntry: Partial<CostEntry>;
  onEntryChange: (updates: Partial<CostEntry>) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  open: boolean;
}

const CATEGORY_OPTIONS: Array<{
  label: string;
  value: ExpenseCategory;
}> = [
  { value: "all", label: "All categories" },
  { value: "operational", label: "Operational" },
  { value: "capital", label: "Capital" },
  { value: "emergency", label: "Emergency" },
];

const EXPENSE_ENTRY_CATEGORY_OPTIONS = buildExpenseCategoryOptions();

const EXPENSE_PAGE_COPY = {
  owner: {
    title: "Expense Management",
    description: "Track and manage all farm expenses",
  },
  staff: {
    title: "Log Expenses",
    description: "Record and track farm expenses",
  },
} as const;

export function ExpenseManagement({
  userRole = "owner",
}: ExpenseManagementProps) {
  const {
    categoryFilter,
    costTypes,
    currentMonthRange,
    expenseMetrics,
    expenses,
    handleCreateCostEntry,
    handleExport,
    initialLoading,
    isAddExpenseOpen,
    loading,
    newCostEntry,
    searchTerm,
    setCategoryFilter,
    setIsAddExpenseOpen,
    setSearchTerm,
    updateNewCostEntry,
  } = useExpenseManagement();
  const pageCopy = EXPENSE_PAGE_COPY[userRole];

  if (initialLoading) {
    return <ExpenseLoadingState />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cost Ledger"
        title={pageCopy.title}
        description={pageCopy.description}
        actions={
          <AddExpenseDialog
            costTypes={costTypes}
            loading={loading}
            newCostEntry={newCostEntry}
            open={isAddExpenseOpen}
            onEntryChange={updateNewCostEntry}
            onOpenChange={setIsAddExpenseOpen}
            onSubmit={() => {
              void handleCreateCostEntry();
            }}
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

function ExpenseDetailsSection({
  costTypes,
  newCostEntry,
  onEntryChange,
}: Pick<AddExpenseDialogProps, "costTypes" | "newCostEntry" | "onEntryChange">) {
  const costTypeOptions = buildCostTypeSelectOptions(costTypes);

  return (
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
            value={getExpenseDateValue(newCostEntry)}
            onChange={(event) => onEntryChange({ date: event.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="costType">Cost Type</Label>
          <ExpenseSelect
            id="costType"
            value={getExpenseCostTypeValue(newCostEntry)}
            onChange={(value) =>
              onEntryChange({
                costType: value as CostEntry["costType"],
              })
            }
            options={costTypeOptions}
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={getExpenseDescriptionValue(newCostEntry)}
            onChange={(event) =>
              onEntryChange({ description: event.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount (₦)</Label>
          <Input
            id="amount"
            type="number"
            value={getExpenseAmountValue(newCostEntry)}
            onChange={(event) =>
              onEntryChange({
                amount: parseExpenseAmountInput(event.target.value),
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <ExpenseSelect
            id="category"
            value={getExpenseCategoryValue(newCostEntry)}
            onChange={(value) =>
              onEntryChange({
                category: value as NonNullable<CostEntry["category"]>,
              })
            }
            options={EXPENSE_ENTRY_CATEGORY_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}

function ExpenseMetadataSection({
  newCostEntry,
  onEntryChange,
}: Pick<AddExpenseDialogProps, "newCostEntry" | "onEntryChange">) {
  return (
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
            value={getExpenseVendorValue(newCostEntry)}
            onChange={(event) => onEntryChange({ vendor: event.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input
            id="notes"
            value={getExpenseNotesValue(newCostEntry)}
            onChange={(event) => onEntryChange({ notes: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
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
          <ExpenseDetailsSection
            costTypes={costTypes}
            newCostEntry={newCostEntry}
            onEntryChange={onEntryChange}
          />
          <ExpenseMetadataSection
            newCostEntry={newCostEntry}
            onEntryChange={onEntryChange}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {getExpenseSubmitButtonLabel(loading)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseSelect({
  id,
  onChange,
  options,
  value,
}: {
  id: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <select
      id={id}
      className="h-10 rounded-xl border border-input bg-background/80 px-3 py-2 text-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={`${id}-${option.value || "empty"}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
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
  const showSubmittedBy = shouldShowSubmittedBy(userRole);
  const description = getExpenseListDescription(userRole);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="display-heading text-2xl">
              Recent Expenses
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExpenseSelect
              id="expense-category-filter"
              value={categoryFilter}
              onChange={(value) => onCategoryChange(value as ExpenseCategory)}
              options={CATEGORY_OPTIONS}
            />
            <Input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
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
              {showSubmittedBy && <TableHead>Submitted By</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={getExpenseRowKey(expense)}>
                <TableCell>
                  {format(new Date(expense.date), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {expense.description}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCompactCurrency(Number(expense.amount))}
                </TableCell>
                {showSubmittedBy && <TableCell>{expense.submittedBy}</TableCell>}
                <TableCell>
                  <ExpenseStatusBadge status={expense.status} />
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {getExpenseReceiptLabel(expense.receipt)}
                  </span>
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
