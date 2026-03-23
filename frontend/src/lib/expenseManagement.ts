import { differenceInDays, endOfMonth, format, startOfMonth } from "date-fns";
import type {
  CostEntry,
  CostEntriesResponse,
  CostTypeOption,
} from "@/types/entities/cost";

export type ExpenseCategory =
  | "all"
  | NonNullable<CostEntry["category"]>;

export interface ExpenseMonthRange {
  startDate: string;
  endDate: string;
  daysElapsed: number;
}

export interface ExpenseRecord {
  id?: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: "verified" | "documented" | "recorded";
  submittedBy: string;
  receipt: string | null;
  vendor: string | null;
}

export interface ExpenseMetrics {
  totalExpenses: number;
  verifiedExpenses: number;
  documentedExpenses: number;
  exportedRows: number;
  averageDailyExpense: number;
}

export interface ExpenseSelectOption {
  label: string;
  value: string;
}

export function createEmptyCostEntry(): Partial<CostEntry> {
  return {
    date: new Date().toISOString().split("T")[0],
    costType: undefined,
    description: "",
    amount: 0,
    category: "operational",
  };
}

export function getExpenseDateValue(entry: Partial<CostEntry>): string {
  return entry.date ?? "";
}

export function getExpenseCostTypeValue(entry: Partial<CostEntry>): string {
  return entry.costType ?? "";
}

export function getExpenseDescriptionValue(entry: Partial<CostEntry>): string {
  return entry.description ?? "";
}

export function getExpenseAmountValue(entry: Partial<CostEntry>): number {
  return entry.amount ?? 0;
}

export function getExpenseCategoryValue(
  entry: Partial<CostEntry>,
): NonNullable<CostEntry["category"]> {
  return entry.category ?? "operational";
}

export function getExpenseVendorValue(entry: Partial<CostEntry>): string {
  return entry.vendor ?? "";
}

export function getExpenseNotesValue(entry: Partial<CostEntry>): string {
  return entry.notes ?? "";
}

export function parseExpenseAmountInput(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildCostTypeSelectOptions(
  costTypes: CostTypeOption[],
): ExpenseSelectOption[] {
  return [
    { value: "", label: "Select cost type" },
    ...costTypes.map((type) => ({
      value: type.value,
      label: type.label,
    })),
  ];
}

export function buildExpenseCategoryOptions(): ExpenseSelectOption[] {
  return [
    { value: "operational", label: "Operational" },
    { value: "capital", label: "Capital" },
    { value: "emergency", label: "Emergency" },
  ];
}

export function getExpenseSubmitButtonLabel(loading: boolean): string {
  return loading ? "Adding..." : "Add Expense";
}

export function shouldShowSubmittedBy(userRole: "owner" | "staff"): boolean {
  return userRole === "owner";
}

export function getExpenseListDescription(
  userRole: "owner" | "staff",
): string {
  return shouldShowSubmittedBy(userRole)
    ? "All farm expenses with searchable records"
    : "Your submitted expenses and their documentation quality";
}

export function getExpenseReceiptLabel(receipt: string | null): string {
  return receipt ? `Receipt #${receipt}` : "-";
}

export function getExpenseRowKey(expense: ExpenseRecord): string | number {
  return expense.id ?? `${expense.date}-${expense.description}`;
}

export function getCurrentMonthRange(baseDate = new Date()): ExpenseMonthRange {
  const start = startOfMonth(baseDate);
  const end = endOfMonth(baseDate);

  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
    daysElapsed: differenceInDays(baseDate, start) + 1,
  };
}

export function extractCostTypes(
  response: unknown,
): CostTypeOption[] {
  const payload = response as { data?: CostTypeOption[] } | CostTypeOption[];

  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.data) ? payload.data : [];
}

export function extractCostEntries(response: unknown): CostEntry[] {
  const payload = response as
    | { data?: CostEntriesResponse; costEntries?: CostEntry[] }
    | CostEntry[];

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data?.costEntries)) {
    return payload.data.costEntries;
  }

  return Array.isArray(payload?.costEntries) ? payload.costEntries : [];
}

export function filterExpenseEntries(
  costEntries: CostEntry[],
  categoryFilter: ExpenseCategory,
  searchTerm: string,
): CostEntry[] {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  return costEntries.filter((entry) => {
    const matchesCategory =
      categoryFilter === "all" || entry.category === categoryFilter;
    const searchHaystack = [
      entry.description,
      entry.costType,
      entry.vendor,
      entry.creator?.username,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch =
      normalizedTerm.length === 0 || searchHaystack.includes(normalizedTerm);

    return matchesCategory && matchesSearch;
  });
}

export function mapExpenseEntry(entry: CostEntry): ExpenseRecord {
  return {
    id: entry.id,
    date: entry.date,
    category: entry.category || entry.costType,
    description: entry.description,
    amount: entry.amount,
    status: getExpenseStatus(entry),
    submittedBy: entry.creator?.username || "Unknown",
    receipt: entry.receiptNumber || null,
    vendor: entry.vendor || null,
  };
}

export function calculateExpenseMetrics(
  filteredEntries: CostEntry[],
  expenses: ExpenseRecord[],
  daysElapsed: number,
): ExpenseMetrics {
  const totalExpenses = filteredEntries.reduce(
    (sum, entry) => sum + (Number(entry.amount) || 0),
    0,
  );
  const verifiedExpenses = expenses.filter(
    (expense) => expense.status === "verified",
  ).length;
  const documentedExpenses = expenses.filter(
    (expense) => expense.status === "documented",
  ).length;

  return {
    totalExpenses,
    verifiedExpenses,
    documentedExpenses,
    exportedRows: expenses.length,
    averageDailyExpense: Math.round(totalExpenses / Math.max(daysElapsed, 1)),
  };
}

export function buildExpenseExportCsv(expenses: ExpenseRecord[]): string {
  const headers = [
    "Date",
    "Category",
    "Description",
    "Amount",
    "Submitted By",
    "Status",
    "Receipt Number",
    "Vendor",
  ];

  const csvRows = expenses.map((expense) =>
    [
      expense.date,
      expense.category,
      expense.description,
      Number(expense.amount || 0).toFixed(2),
      expense.submittedBy,
      expense.status,
      expense.receipt || "",
      expense.vendor || "",
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [headers.join(","), ...csvRows].join("\n");
}

function getExpenseStatus(
  entry: CostEntry,
): ExpenseRecord["status"] {
  if (entry.receiptNumber && entry.vendor) {
    return "verified";
  }

  if (entry.receiptNumber || entry.vendor || entry.notes) {
    return "documented";
  }

  return "recorded";
}
