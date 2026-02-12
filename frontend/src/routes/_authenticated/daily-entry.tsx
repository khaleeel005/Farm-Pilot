import { createFileRoute } from "@tanstack/react-router";
import { DailyEntryForm } from "@/components/daily-entry-form";

export const Route = createFileRoute("/_authenticated/daily-entry")({
  component: DailyEntryPage,
});

function DailyEntryPage() {
  return <DailyEntryForm />;
}
