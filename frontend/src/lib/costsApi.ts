import type { CostEntry, CostFilters, OperatingCost } from "@/types";
import {
  API_BASE_URL,
  fetchWithAuth,
  handleResponse,
} from "@/lib/apiClient";

const BASE = API_BASE_URL;

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
