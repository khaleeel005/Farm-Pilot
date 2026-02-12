import { createFileRoute } from "@tanstack/react-router";
import { ExpenseManagement } from "@/components/expense-management";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesPage,
});

function ExpensesPage() {
  return <ExpenseManagement />;
}
