// Custom hooks for data fetching and state management
export { useAsync, useList } from './useAsync';
export type { AsyncState, UseAsyncReturn, UseListReturn } from './useAsync';

export { useHouses } from './useHouses';
export type { UseHousesReturn } from './useHouses';

export { useDailyLogs } from './useDailyLogs';
export type { UseDailyLogsReturn, DailyLogFilters } from './useDailyLogs';

export { useSales } from './useSales';
export type { UseSalesReturn, SalesFilters, SalesSummary } from './useSales';

// Re-export toast context for global usage
export { useToastContext } from '@/context/ToastContext';

export {
  usePermission,
  usePermissions,
  useResourcePermissions,
  useIsOwner,
  useIsStaff,
} from './usePermission';
