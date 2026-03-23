import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createStaff, deleteStaff, listStaff } from "@/lib/api";
import type { StaffFormData, StaffMember } from "@/lib/staffManagement";
import { normalizeStaffMembers } from "@/lib/staffManagement";

export interface UseStaffMembersReturn {
  create: (payload: StaffFormData) => Promise<StaffMember>;
  error: Error | null;
  isCreating: boolean;
  isDeleting: boolean;
  isMutating: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  remove: (id: number | string) => Promise<void>;
  staffMembers: StaffMember[];
}

export const STAFF_MEMBERS_QUERY_KEY = ["staff-members"] as const;

async function fetchStaffMembers(): Promise<StaffMember[]> {
  const response = await listStaff();
  return normalizeStaffMembers(response);
}

export function staffMembersQueryOptions() {
  return queryOptions({
    queryKey: STAFF_MEMBERS_QUERY_KEY,
    queryFn: fetchStaffMembers,
  });
}

export function useStaffMembers(): UseStaffMembersReturn {
  const queryClient = useQueryClient();
  const staffMembersQuery = useQuery(staffMembersQueryOptions());

  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STAFF_MEMBERS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => deleteStaff(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STAFF_MEMBERS_QUERY_KEY });
    },
  });

  const error =
    staffMembersQuery.error || createMutation.error || deleteMutation.error || null;

  return {
    staffMembers: staffMembersQuery.data ?? [],
    loading: staffMembersQuery.isPending,
    error: error instanceof Error ? error : null,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: STAFF_MEMBERS_QUERY_KEY });
      await staffMembersQuery.refetch();
    },
    create: async (payload) => {
      const createdStaffMember = await createMutation.mutateAsync(payload);
      return createdStaffMember as StaffMember;
    },
    remove: async (id) => {
      await deleteMutation.mutateAsync(id);
    },
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMutating: createMutation.isPending || deleteMutation.isPending,
  };
}

export default useStaffMembers;
