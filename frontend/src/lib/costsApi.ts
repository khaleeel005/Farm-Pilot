import type { CostEntry, CostFilters, OperatingCost } from "@/types";
import {
  API_BASE_URL,
  fetchWithAuth,
  handleResponse,
} from "@/lib/apiClient";

const BASE = API_BASE_URL;

export async function getDailyCosts(date: string) {
  const res = await fetchWithAuth(`${BASE}/api/costs/daily/${date}`);
  const payload = await handleResponse<{ data?: unknown }>(res);
  return (payload as { data?: unknown })?.data ?? payload;
}

export async function getCostsSummary(start: string, end: string) {
  const res = await fetchWithAuth(
    `${BASE}/api/costs/summary?start=${start}&end=${end}`,
  );
  const payload = await handleResponse<{ data?: unknown }>(res);
  return (payload as { data?: unknown })?.data ?? payload;
}

export async function createOperatingCost(payload: Partial<OperatingCost>) {
  const res = await fetchWithAuth(`${BASE}/api/costs/operating`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<{ data?: unknown }>(res);
  return (body as { data?: unknown })?.data ?? body;
}

export async function getEggPriceEstimate(date: string) {
  const res = await fetchWithAuth(`${BASE}/api/costs/egg-price/${date}`);
  const payload = await handleResponse<{ data?: unknown }>(res);
  return (payload as { data?: unknown })?.data ?? payload;
}

export async function getDailyCalculation(date: string) {
  const res = await fetchWithAuth(
    `${BASE}/api/costs/daily-calculation/${date}`,
  );
  const payload = await handleResponse<{ data?: unknown }>(res);
  return (payload as { data?: unknown })?.data ?? payload;
}

export async function getAverageMonthlyProduction(date: string) {
  const res = await fetchWithAuth(`${BASE}/api/costs/avg-production/${date}`);
  const payload = await handleResponse<{ data?: unknown }>(res);
  return (payload as { data?: unknown })?.data ?? payload;
}

export interface BirdCostPayload {
  batchDate: string;
  birdsPurchased: number;
  costPerBird: number;
  vaccinationCostPerBird?: number;
  expectedLayingMonths?: number;
}

export interface BirdCostRecord extends BirdCostPayload {
  id: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function getBirdCosts(): Promise<BirdCostRecord[]> {
  const res = await fetchWithAuth(`${BASE}/api/costs/bird-costs`);
  const data = await handleResponse<{ data?: BirdCostRecord[] }>(res);
  return data?.data || [];
}

export async function createBirdCost(
  payload: BirdCostPayload,
): Promise<BirdCostRecord> {
  const res = await fetchWithAuth(`${BASE}/api/costs/bird-costs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: BirdCostRecord }>(res);
  return data?.data as BirdCostRecord;
}

export async function getHealthCostPerEgg(date: string): Promise<number> {
  const res = await fetchWithAuth(`${BASE}/api/costs/health-cost/${date}`);
  const data = await handleResponse<{
    data?: { date?: string; healthCostPerEgg?: number };
  }>(res);
  return Number(data?.data?.healthCostPerEgg || 0);
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
