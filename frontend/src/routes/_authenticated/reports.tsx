import { createFileRoute } from "@tanstack/react-router";
import { ReportsSection } from "@/components/reports-section";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  return <ReportsSection />;
}
