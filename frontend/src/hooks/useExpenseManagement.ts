import { useState, useEffect, useMemo, useCallback } from "react";
import { createCostEntry, getCostEntries, getCostTypes } from "@/lib/api";
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
} from "@/lib/expenseManagement";
import type { CostEntry, CostTypeOption } from "@/types/entities/cost";
import { useToastContext } from "@/hooks";

export interface UseExpenseManagementReturn {
  categoryFilter: ExpenseCategory;
  costTypes: CostTypeOption[];
  currentMonthRange: ReturnType<typeof getCurrentMonthRange>;
  expenseMetrics: ReturnType<typeof calculateExpenseMetrics>;
  expenses: ReturnType<typeof mapExpenseEntry>[];
  handleCreateCostEntry: () => Promise<void>;
  handleExport: () => void;
  initialLoading: boolean;
  isAddExpenseOpen: boolean;
  loading: boolean;
  newCostEntry: Partial<CostEntry>;
  searchTerm: string;
  setCategoryFilter: (value: ExpenseCategory) => void;
  setIsAddExpenseOpen: (open: boolean) => void;
  setSearchTerm: (value: string) => void;
  updateNewCostEntry: (updates: Partial<CostEntry>) => void;
}

export function useExpenseManagement(): UseExpenseManagementReturn {
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

  return {
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    categoryFilter,
    setCategoryFilter,
    searchTerm,
    setSearchTerm,
    loading,
    initialLoading: loading && costEntries.length === 0 && costTypes.length === 0,
    costTypes,
    newCostEntry,
    updateNewCostEntry,
    handleCreateCostEntry,
    handleExport,
    currentMonthRange,
    expenses,
    expenseMetrics,
  };
}

export default useExpenseManagement;
