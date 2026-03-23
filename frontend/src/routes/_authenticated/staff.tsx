import { createFileRoute } from "@tanstack/react-router";
import { StaffManagement } from "@/components/staff-management";
import { staffMembersQueryOptions } from "@/hooks/useStaffMembers";

export const Route = createFileRoute("/_authenticated/staff")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(staffMembersQueryOptions()),
  component: StaffPage,
});

function StaffPage() {
  return <StaffManagement />;
}
