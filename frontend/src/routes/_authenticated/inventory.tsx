import { createFileRoute } from "@tanstack/react-router";
import { InventoryDashboard } from "@/components/inventory-dashboard";

export const Route = createFileRoute("/_authenticated/inventory")({
  component: InventoryDashboard,
});
