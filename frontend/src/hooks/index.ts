export { useHouses } from './useHouses';
export type { UseHousesReturn } from './useHouses';

export { useDailyLogs } from './useDailyLogs';
export { useCreateBulkDailyLogs, useCreateDailyLog, useDeleteDailyLog, useUpdateDailyLog } from './useDailyLogs';
export type { UseDailyLogsReturn } from './useDailyLogs';
export type { DailyLogFilters } from '@/lib/dailyLogs';

export { useFeedInventory } from './useFeedInventory';
export type { UseFeedInventoryReturn } from './useFeedInventory';
export { useFeedManagement } from './useFeedManagement';
export type { UseFeedManagementReturn } from './useFeedManagement';
export { useFarmWorkers } from './useFarmWorkers';
export type { UseFarmWorkersReturn } from './useFarmWorkers';
export { useCostAnalysisOverview } from './useCostAnalysisOverview';
export { useStaffMembers } from './useStaffMembers';
export type { UseStaffMembersReturn } from './useStaffMembers';

export { useSales } from './useSales';
export type { UseSalesReturn, SalesFilters, SalesSummary } from './useSales';

export { useDashboardOverview } from './useDashboardOverview';
export { useReportsOverview } from './useReportsOverview';
export { useWorkAssignments } from './useWorkAssignments';
export type { UseWorkAssignmentsReturn, WorkAssignmentFilters } from './useWorkAssignments';
export { useStaffDashboardOverview } from './useStaffDashboardOverview';
export { useStaffPerformance } from './useStaffPerformance';
export { useLaborers, usePayrollMonth } from './useLaborers';
export type { UseLaborersReturn, UsePayrollMonthReturn } from './useLaborers';

// Re-export toast context for global usage
export { useToastContext } from '@/context/ToastContext';

export {
  usePermission,
  usePermissions,
  useResourcePermissions,
  useIsOwner,
  useIsStaff,
} from './usePermission';
