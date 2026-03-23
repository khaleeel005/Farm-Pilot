import { createFileRoute } from "@tanstack/react-router";
import { SalesManagement } from "@/components/sales-management";
import { customersQueryOptions, salesQueryOptions } from "@/hooks/useSales";

export const Route = createFileRoute("/_authenticated/sales")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(salesQueryOptions()),
      context.queryClient.ensureQueryData(customersQueryOptions()),
    ]),
  component: SalesPage,
});

function SalesPage() {
  return <SalesManagement />;
}
