import { createFileRoute } from "@tanstack/react-router";
import { HouseManagement } from "@/components/house-management";

export const Route = createFileRoute("/_authenticated/houses")({
  component: HousesPage,
});

function HousesPage() {
  return <HouseManagement />;
}
