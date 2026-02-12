import { createFileRoute } from "@tanstack/react-router";
import { LaborManagement } from "@/components/labor-management";

export const Route = createFileRoute("/_authenticated/labor")({
  component: LaborPage,
});

function LaborPage() {
  return <LaborManagement />;
}
