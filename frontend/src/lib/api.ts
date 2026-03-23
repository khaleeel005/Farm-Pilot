// Public frontend API facade. Keep this file as a compatibility layer while
// transport/auth/report concerns are gradually split into focused modules.

import { ApiError } from "@/lib/apiClient";
import { authEvents } from "@/lib/authEvents";

export { ApiError };
export { authEvents };
export { getCurrentUser, login, logout } from "@/lib/authApi";
export { createStaff, deleteStaff, listStaff, updateStaff } from "@/lib/staffApi";
export {
  createDailyLog,
  createHouse,
  deleteDailyLog,
  deleteHouse,
  getDailyLogs,
  getHouses,
  updateDailyLog,
  updateHouse,
} from "@/lib/productionApi";
export {
  createLaborer,
  createWorkAssignment,
  deleteLaborer,
  generatePayroll,
  getLaborers,
  getPayrollMonth,
  getPayrollSummary,
  getWorkAssignments,
  updateLaborer,
  updatePayroll,
  updateWorkAssignment,
} from "@/lib/laborApi";
export type {
  DashboardSummary,
  FinancialReportData,
  ProductionReportData,
  SalesReportData,
} from "@/lib/reportsApi";
export {
  exportReport,
  getDashboardSummary,
  getFinancialReport,
  getProductionReport,
  getReports,
  getSalesReport,
} from "@/lib/reportsApi";
export {
  createCustomer,
  createSale,
  deleteCustomer,
  deleteSale,
  getCustomers,
  getSales,
  updateCustomer,
  updateSale,
} from "@/lib/salesApi";
export {
  addBatchIngredient,
  calculateFeedBatchCost,
  createFeedBatch,
  createFeedRecipe,
  deleteFeedBatch,
  deleteFeedRecipe,
  estimateBatchCost,
  getBatchIngredients,
  getFeedBatchUsageById,
  getFeedBatchUsageStats,
  getFeedBatches,
  getFeedRecipes,
  updateFeedBatch,
  updateFeedRecipe,
} from "@/lib/feedApi";
export {
  createCostEntry,
  createOperatingCost,
  deleteCostEntry,
  getAverageMonthlyProduction,
  getCostEntries,
  getCostEntriesSummary,
  getCostEntry,
  getCostTypes,
  getCostsSummary,
  getDailyCalculation,
  getDailyCosts,
  getEggPriceEstimate,
  updateCostEntry,
} from "@/lib/costsApi";
