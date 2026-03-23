import { createFileRoute } from "@tanstack/react-router";
import { HouseManagement } from "@/components/house-management";
import { housesQueryOptions } from "@/hooks/useHouses";

export const Route = createFileRoute("/_authenticated/houses")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(housesQueryOptions()),
  component: HousesPage,
});

function HousesPage() {
  return <HouseManagement />;
}
