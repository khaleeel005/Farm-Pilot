// API client for frontend to communicate with backend
// Uses relative URLs - works with Next.js rewrites in dev and same-origin in production

import type {
  House,
  HousePayload,
  DailyLog,
  DailyLogPayload,
  Sale,
  SalePayload,
  Customer,
  CustomerPayload,
  FeedRecipe,
  FeedRecipePayload,
  FeedBatch,
  FeedBatchPayload,
  Ingredient,
  BatchUsageStats,
  Laborer,
  LaborerPayload,
  WorkAssignment,
  WorkAssignmentPayload,
  Payroll,
  PayrollPayload,
  CostEntry,
  CostFilters,
  OperatingCost,
} from "@/types";

// Use empty string for relative URLs - works with Next.js rewrites and same-origin production
const BASE = "";

// ============================================
// Auth Helpers
// ============================================

function authHeader(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("fm_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;
    const refresh = localStorage.getItem("fm_refresh");
    if (!refresh) return false;

    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!res.ok) return false;
    const body = await res.json().catch(() => ({}));
    const token = body?.token || body?.data?.token;

    if (token) {
      localStorage.setItem("fm_token", token);
      authEvents.emit("refresh");
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
  retry = true,
) {
  const headers = new Headers(init?.headers as HeadersInit | undefined);
  const ah = authHeader();
  Object.entries(ah).forEach(([k, v]) => {
    if (v !== undefined && v !== null) headers.set(k, String(v));
  });

  const merged: RequestInit = { ...init, headers };
  const res = await fetch(input, merged);

  if (res.status === 401 && retry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const headers2 = new Headers(init?.headers as HeadersInit | undefined);
      const ah2 = authHeader();
      Object.entries(ah2).forEach(([k, v]) => {
        if (v !== undefined && v !== null) headers2.set(k, String(v));
      });
      const retried: RequestInit = { ...init, headers: headers2 };
      return fetch(input, retried);
    }
  }
  return res;
}

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code =
      status === 403 ? "FORBIDDEN" : status === 401 ? "UNAUTHORIZED" : "ERROR";
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

async function handleResponse<T = unknown>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      // ignore JSON parse errors
    }

    // Provide user-friendly messages for common errors
    if (res.status === 403) {
      message = message || "You do not have permission to perform this action";
    } else if (res.status === 401) {
      message = message || "Please log in to continue";
    } else if (res.status === 404) {
      message = message || "The requested resource was not found";
    }

    const error = new ApiError(message, res.status);
    // Use Promise.reject instead of throw to avoid Next.js error overlay in dev
    return Promise.reject(error);
  }
  return res.json().catch(() => ({}) as T);
}

// ============================================
// Event Emitter for Auth Events
// ============================================

class EventEmitter {
  private events: Record<string, ((...args: unknown[]) => void)[]> = {};

  emit(event: string, ...args: unknown[]) {
    (this.events[event] || []).forEach((fn) => fn(...args));
  }

  on(event: string, fn: (...args: unknown[]) => void) {
    this.events[event] = this.events[event] || [];
    this.events[event].push(fn);
  }

  off(event: string, fn: (...args: unknown[]) => void) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((f) => f !== fn);
  }
}

export const authEvents = new EventEmitter();

// ============================================
// Auth API
// ============================================

export async function login(credentials: {
  username: string;
  password: string;
}) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await handleResponse<{
    token?: string;
    refreshToken?: string;
    user?: unknown;
  }>(res);
  if (data?.token) {
    localStorage.setItem("fm_token", data.token);
    if (data.refreshToken) {
      localStorage.setItem("fm_refresh", data.refreshToken);
    }
    authEvents.emit("login");
  }
  return data;
}

export async function logout() {
  const refresh = localStorage.getItem("fm_refresh");
  if (refresh) {
    try {
      await fetch(`${BASE}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
    } catch {
      // ignore
    }
  }
  localStorage.removeItem("fm_token");
  localStorage.removeItem("fm_refresh");
  authEvents.emit("logout");
}

export async function getCurrentUser() {
  try {
    const res = await fetchWithAuth(`${BASE}/api/auth/me`);
    if (res.status === 401) return null;
    const data = await handleResponse<{ user?: unknown; data?: unknown }>(res);
    return data?.user || data?.data || null;
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes("401")) {
      return null;
    }
    throw error;
  }
}

// ============================================
// Staff API
// ============================================

export async function listStaff() {
  const res = await fetchWithAuth(`${BASE}/api/staff`);
  return handleResponse(res);
}

export async function createStaff(payload: {
  username: string;
  password: string;
}) {
  const res = await fetchWithAuth(`${BASE}/api/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateStaff(
  id: number | string,
  payload: { fullName?: string; password?: string; isActive?: boolean },
) {
  const res = await fetchWithAuth(`${BASE}/api/staff/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteStaff(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/staff/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ============================================
// Houses API
// ============================================

export async function getHouses(): Promise<House[]> {
  const res = await fetchWithAuth(`${BASE}/api/houses`);
  const data = await handleResponse<{ data?: House[] }>(res);
  return data?.data || [];
}

export async function createHouse(payload: HousePayload): Promise<House> {
  const res = await fetchWithAuth(`${BASE}/api/houses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: House }>(res);
  return data?.data as House;
}

export async function updateHouse(
  id: number | string,
  payload: HousePayload,
): Promise<House> {
  const res = await fetchWithAuth(`${BASE}/api/houses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: House }>(res);
  return data?.data as House;
}

export async function deleteHouse(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/houses/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ============================================
// Daily Logs API
// ============================================

export async function getDailyLogs(
  filters: Record<string, string> = {},
): Promise<DailyLog[]> {
  const params = new URLSearchParams(filters);
  const res = await fetchWithAuth(`${BASE}/api/daily-logs?${params}`);
  const data = await handleResponse<{ data?: DailyLog[] }>(res);
  return data?.data || [];
}

export async function createDailyLog(
  payload: DailyLogPayload,
): Promise<DailyLog> {
  const res = await fetchWithAuth(`${BASE}/api/daily-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: DailyLog }>(res);
  return data?.data as DailyLog;
}

export async function updateDailyLog(
  id: number | string,
  payload: Partial<DailyLogPayload>,
): Promise<DailyLog> {
  const res = await fetchWithAuth(`${BASE}/api/daily-logs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: DailyLog }>(res);
  return data?.data as DailyLog;
}

export async function deleteDailyLog(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/daily-logs/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ============================================
// Customers API
// ============================================

export async function getCustomers(): Promise<Customer[]> {
  const res = await fetchWithAuth(`${BASE}/api/customers`);
  const data = await handleResponse<{ data?: Customer[] }>(res);
  return data?.data || [];
}

export async function createCustomer(
  payload: CustomerPayload,
): Promise<Customer> {
  const res = await fetchWithAuth(`${BASE}/api/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: Customer }>(res);
  return data?.data as Customer;
}

export async function updateCustomer(
  id: number | string,
  payload: Partial<CustomerPayload>,
): Promise<Customer> {
  const res = await fetchWithAuth(`${BASE}/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: Customer }>(res);
  return data?.data as Customer;
}

export async function deleteCustomer(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/customers/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ============================================
// Sales API
// ============================================

export async function getSales(
  filters: Record<string, string> = {},
): Promise<Sale[]> {
  const params = new URLSearchParams(filters);
  const res = await fetchWithAuth(`${BASE}/api/sales?${params}`);
  const data = await handleResponse<{ data?: Sale[] }>(res);
  return data?.data || [];
}

export async function createSale(payload: SalePayload): Promise<Sale> {
  const res = await fetchWithAuth(`${BASE}/api/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: Sale }>(res);
  return data?.data as Sale;
}

export async function updateSale(
  id: number | string,
  payload: Partial<SalePayload>,
): Promise<Sale> {
  const res = await fetchWithAuth(`${BASE}/api/sales/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: Sale }>(res);
  return data?.data as Sale;
}

export async function deleteSale(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/sales/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ============================================
// Laborers API
// ============================================

export async function getLaborers(): Promise<Laborer[]> {
  const res = await fetchWithAuth(`${BASE}/api/laborers`);
  const data = await handleResponse<{ data?: Laborer[] }>(res);
  return data?.data || [];
}

export async function createLaborer(payload: LaborerPayload): Promise<Laborer> {
  const res = await fetchWithAuth(`${BASE}/api/laborers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: Laborer }>(res);
  return data?.data as Laborer;
}

export async function updateLaborer(
  id: number | string,
  payload: Partial<LaborerPayload>,
): Promise<Laborer> {
  const res = await fetchWithAuth(`${BASE}/api/laborers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: Laborer }>(res);
  return data?.data as Laborer;
}

export async function deleteLaborer(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/laborers/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ============================================
// Work Assignments API
// ============================================

export async function getWorkAssignments(
  filters: Record<string, string> = {},
): Promise<WorkAssignment[]> {
  const params = new URLSearchParams(filters);
  const res = await fetchWithAuth(`${BASE}/api/work-assignments?${params}`);
  const data = await handleResponse<{ data?: WorkAssignment[] }>(res);
  return data?.data || [];
}

export async function createWorkAssignment(
  payload: WorkAssignmentPayload,
): Promise<WorkAssignment> {
  const res = await fetchWithAuth(`${BASE}/api/work-assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: WorkAssignment }>(res);
  return data?.data as WorkAssignment;
}

export async function updateWorkAssignment(
  id: number | string,
  payload: Partial<WorkAssignmentPayload>,
): Promise<WorkAssignment> {
  const res = await fetchWithAuth(`${BASE}/api/work-assignments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: WorkAssignment }>(res);
  return data?.data as WorkAssignment;
}

// ============================================
// Payroll API
// ============================================

export async function getPayrollMonth(monthYear: string): Promise<Payroll[]> {
  const res = await fetchWithAuth(`${BASE}/api/payroll/${monthYear}`);
  const data = await handleResponse<{ data?: Payroll[] }>(res);
  return data?.data || [];
}

export async function generatePayroll(monthYear: string): Promise<Payroll[]> {
  const res = await fetchWithAuth(`${BASE}/api/payroll/generate/${monthYear}`, {
    method: "POST",
  });
  const data = await handleResponse<{ data?: Payroll[] }>(res);
  return data?.data || [];
}

export async function updatePayroll(
  id: number | string,
  payload: PayrollPayload,
): Promise<Payroll> {
  const res = await fetchWithAuth(`${BASE}/api/payroll/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: Payroll }>(res);
  return data?.data as Payroll;
}

export async function getPayrollSummary(year?: string) {
  const q = year ? `?year=${encodeURIComponent(year)}` : "";
  const res = await fetchWithAuth(`${BASE}/api/payroll/summary${q}`);
  const data = await handleResponse<{ data?: unknown }>(res);
  return data?.data || {};
}

// ============================================
// Feed Recipes API
// ============================================

export async function getFeedRecipes(): Promise<FeedRecipe[]> {
  const res = await fetchWithAuth(`${BASE}/api/feed/recipes`);
  const data = await handleResponse<{ data?: FeedRecipe[] }>(res);
  return data?.data || [];
}

export async function createFeedRecipe(
  payload: FeedRecipePayload,
): Promise<FeedRecipe> {
  const res = await fetchWithAuth(`${BASE}/api/feed/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: FeedRecipe }>(res);
  return data?.data as FeedRecipe;
}

export async function updateFeedRecipe(
  id: number | string,
  payload: Partial<FeedRecipePayload>,
): Promise<FeedRecipe> {
  const res = await fetchWithAuth(`${BASE}/api/feed/recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: FeedRecipe }>(res);
  return data?.data as FeedRecipe;
}

export async function deleteFeedRecipe(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/feed/recipes/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

// ============================================
// Feed Batches API
// ============================================

export async function getFeedBatches(
  filters: Record<string, string> = {},
): Promise<FeedBatch[]> {
  const params = new URLSearchParams(filters);
  const res = await fetchWithAuth(`${BASE}/api/feed/batches?${params}`);
  const data = await handleResponse<{ data?: FeedBatch[] }>(res);
  return data?.data || [];
}

export async function createFeedBatch(
  payload: FeedBatchPayload,
): Promise<FeedBatch> {
  const res = await fetchWithAuth(`${BASE}/api/feed/batches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: FeedBatch }>(res);
  return data?.data as FeedBatch;
}

export async function updateFeedBatch(
  id: number | string,
  payload: Partial<FeedBatchPayload>,
): Promise<FeedBatch> {
  const res = await fetchWithAuth(`${BASE}/api/feed/batches/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: FeedBatch }>(res);
  return data?.data as FeedBatch;
}

export async function deleteFeedBatch(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/feed/batches/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function getBatchIngredients(
  batchId: number | string,
): Promise<Ingredient[]> {
  const res = await fetchWithAuth(
    `${BASE}/api/feed/batches/${batchId}/ingredients`,
  );
  const data = await handleResponse<{ data?: Ingredient[] }>(res);
  return data?.data || [];
}

export async function addBatchIngredient(
  batchId: number | string,
  payload: Partial<Ingredient>,
): Promise<Ingredient> {
  const res = await fetchWithAuth(
    `${BASE}/api/feed/batches/${batchId}/ingredients`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  const data = await handleResponse<{ data?: Ingredient }>(res);
  return data?.data as Ingredient;
}

export async function estimateBatchCost(payload: {
  ingredients: Ingredient[];
}) {
  const res = await fetchWithAuth(`${BASE}/api/feed/estimate-cost`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function calculateFeedBatchCost(
  payload: Partial<FeedBatchPayload>,
) {
  const res = await fetchWithAuth(`${BASE}/api/feed/batches/calculate-cost`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getFeedBatchUsageStats(): Promise<BatchUsageStats[]> {
  const res = await fetchWithAuth(`${BASE}/api/feed/batches-usage`);
  const data = await handleResponse<{ data?: BatchUsageStats[] }>(res);
  return data?.data || [];
}

export async function getFeedBatchUsageById(
  id: number | string,
): Promise<BatchUsageStats | null> {
  const res = await fetchWithAuth(`${BASE}/api/feed/batches/${id}/usage`);
  const data = await handleResponse<{ data?: BatchUsageStats }>(res);
  return data?.data || null;
}

// ============================================
// Costs API
// ============================================

export async function getDailyCosts(date: string) {
  const res = await fetchWithAuth(`${BASE}/api/costs/daily/${date}`);
  return handleResponse(res);
}

export async function getCostsSummary(start: string, end: string) {
  const res = await fetchWithAuth(
    `${BASE}/api/costs/summary?start=${start}&end=${end}`,
  );
  return handleResponse(res);
}

export async function createOperatingCost(payload: Partial<OperatingCost>) {
  const res = await fetchWithAuth(`${BASE}/api/costs/operating`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getEggPriceEstimate(date: string) {
  const res = await fetchWithAuth(`${BASE}/api/costs/egg-price/${date}`);
  return handleResponse(res);
}

export async function getDailyCalculation(date: string) {
  const res = await fetchWithAuth(
    `${BASE}/api/costs/daily-calculation/${date}`,
  );
  return handleResponse(res);
}

export async function getAverageMonthlyProduction(date: string) {
  const res = await fetchWithAuth(`${BASE}/api/costs/avg-production/${date}`);
  return handleResponse(res);
}

// ============================================
// Cost Entries API
// ============================================

export async function getCostTypes() {
  const res = await fetchWithAuth(`${BASE}/api/cost-entries/types`);
  return handleResponse(res);
}

export async function getCostEntries(
  filters: CostFilters = {},
  page = 1,
  limit = 50,
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...Object.fromEntries(
      Object.entries(filters)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    ),
  });
  const res = await fetchWithAuth(`${BASE}/api/cost-entries?${params}`);
  return handleResponse(res);
}

export async function getCostEntry(id: number): Promise<CostEntry> {
  const res = await fetchWithAuth(`${BASE}/api/cost-entries/${id}`);
  const data = await handleResponse<{ data?: CostEntry }>(res);
  return data?.data as CostEntry;
}

export async function createCostEntry(
  payload: Partial<CostEntry>,
): Promise<CostEntry> {
  const res = await fetchWithAuth(`${BASE}/api/cost-entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: CostEntry }>(res);
  return data?.data as CostEntry;
}

export async function updateCostEntry(
  id: number,
  payload: Partial<CostEntry>,
): Promise<CostEntry> {
  const res = await fetchWithAuth(`${BASE}/api/cost-entries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: CostEntry }>(res);
  return data?.data as CostEntry;
}

export async function deleteCostEntry(id: number) {
  const res = await fetchWithAuth(`${BASE}/api/cost-entries/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function getCostEntriesSummary(filters: CostFilters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(filters)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    ),
  );
  const res = await fetchWithAuth(`${BASE}/api/cost-entries/summary?${params}`);
  return handleResponse(res);
}

// ============================================
// Reports API
// ============================================

export interface ProductionReportData {
  start: string;
  end: string;
  days: number;
  totalEggs: number;
  avgPerDay: number;
  logs: Array<{
    logDate: string;
    eggsCollected: number;
    crackedEggs: number;
    feedBagsUsed: number;
    mortalityCount: number;
    houseId?: number;
  }>;
}

export interface SalesReportData {
  start: string;
  end: string;
  totalAmount: number;
  totalEggs: number;
  rows: Array<{
    saleDate: string;
    quantity: number;
    pricePerEgg: number;
    totalAmount: number;
    customerId?: number;
    paymentStatus?: string;
  }>;
}

export interface FinancialReportData {
  start: string;
  end: string;
  totalOperating: number;
  totalSales: number;
  ops: Array<{
    monthYear: string;
    totalMonthlyCost: number;
    supervisorSalary?: number;
  }>;
  sales: Array<{
    saleDate: string;
    totalAmount: number;
  }>;
}

export async function getReports(
  type: string,
  filters: Record<string, string> = {},
) {
  const params = new URLSearchParams(filters);
  const res = await fetchWithAuth(`${BASE}/api/reports/${type}?${params}`);
  return handleResponse(res);
}

export async function getProductionReport(
  startDate: string,
  endDate: string,
): Promise<ProductionReportData> {
  const res = await fetchWithAuth(
    `${BASE}/api/reports/production?start=${startDate}&end=${endDate}`,
  );
  const data = await handleResponse<{ data?: ProductionReportData }>(res);
  return (
    data?.data || {
      start: startDate,
      end: endDate,
      days: 0,
      totalEggs: 0,
      avgPerDay: 0,
      logs: [],
    }
  );
}

export async function getSalesReport(
  startDate: string,
  endDate: string,
): Promise<SalesReportData> {
  const res = await fetchWithAuth(
    `${BASE}/api/reports/sales?start=${startDate}&end=${endDate}`,
  );
  const data = await handleResponse<{ data?: SalesReportData }>(res);
  return (
    data?.data || {
      start: startDate,
      end: endDate,
      totalAmount: 0,
      totalEggs: 0,
      rows: [],
    }
  );
}

export async function getFinancialReport(
  startDate: string,
  endDate: string,
): Promise<FinancialReportData> {
  const res = await fetchWithAuth(
    `${BASE}/api/reports/financial?start=${startDate}&end=${endDate}`,
  );
  const data = await handleResponse<{ data?: FinancialReportData }>(res);
  return (
    data?.data || {
      start: startDate,
      end: endDate,
      totalOperating: 0,
      totalSales: 0,
      ops: [],
      sales: [],
    }
  );
}

export async function exportReport(
  type: "production" | "sales" | "financial",
  format: "csv" | "pdf",
  startDate: string,
  endDate: string,
): Promise<Blob> {
  const res = await fetchWithAuth(
    `${BASE}/api/reports/export/${type}?format=${format}&start=${startDate}&end=${endDate}`,
  );
  if (!res.ok) {
    throw new ApiError("Failed to export report", res.status);
  }
  return res.blob();
}

// ============================================
// Dashboard Summary API (aggregated data)
// ============================================

export interface DashboardSummary {
  production: {
    totalEggs: number;
    avgDaily: number;
    crackedPercent: number;
  };
  sales: {
    totalRevenue: number;
    totalEggsSold: number;
    pendingPayments: number;
    paidCount: number;
    pendingCount: number;
  };
  costs: {
    totalOperating: number;
    profitMargin: number;
  };
}

export async function getDashboardSummary(
  startDate: string,
  endDate: string,
): Promise<DashboardSummary> {
  // Fetch all three reports in parallel and compute summary
  const [production, sales, financial] = await Promise.all([
    getProductionReport(startDate, endDate).catch(() => null),
    getSalesReport(startDate, endDate).catch(() => null),
    getFinancialReport(startDate, endDate).catch(() => null),
  ]);

  const totalEggs = production?.totalEggs || 0;
  const crackedEggs =
    production?.logs.reduce((sum, l) => sum + (l.crackedEggs || 0), 0) || 0;
  const crackedPercent = totalEggs > 0 ? (crackedEggs / totalEggs) * 100 : 0;

  const totalRevenue = sales?.totalAmount || 0;
  const totalEggsSold = sales?.totalEggs || 0;
  const paidCount =
    sales?.rows.filter((r) => r.paymentStatus === "paid").length || 0;
  const pendingCount =
    sales?.rows.filter((r) => r.paymentStatus === "pending").length || 0;
  const pendingPayments =
    sales?.rows
      .filter((r) => r.paymentStatus === "pending")
      .reduce((sum, r) => sum + r.totalAmount, 0) || 0;

  const totalOperating = financial?.totalOperating || 0;
  const profitMargin =
    totalRevenue > 0
      ? ((totalRevenue - totalOperating) / totalRevenue) * 100
      : 0;

  return {
    production: {
      totalEggs,
      avgDaily: production?.avgPerDay || 0,
      crackedPercent: Math.round(crackedPercent * 10) / 10,
    },
    sales: {
      totalRevenue,
      totalEggsSold,
      pendingPayments,
      paidCount,
      pendingCount,
    },
    costs: {
      totalOperating,
      profitMargin: Math.round(profitMargin * 10) / 10,
    },
  };
}
