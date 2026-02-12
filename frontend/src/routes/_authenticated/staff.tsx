import { createFileRoute } from "@tanstack/react-router";
import { StaffManagement } from "@/components/staff-management";

export const Route = createFileRoute("/_authenticated/staff")({
  component: StaffPage,
});

function StaffPage() {
  return <StaffManagement />;
}
