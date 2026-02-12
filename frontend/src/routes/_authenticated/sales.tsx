import { createFileRoute } from "@tanstack/react-router";
import { SalesManagement } from "@/components/sales-management";

export const Route = createFileRoute("/_authenticated/sales")({
  component: SalesPage,
});

function SalesPage() {
  return <SalesManagement />;
}
