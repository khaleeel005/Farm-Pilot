import type {
  DailyLog,
  DailyLogPayload,
  House,
  HousePayload,
} from "@/types";
import {
  API_BASE_URL,
  fetchWithAuth,
  handleResponse,
} from "@/lib/apiClient";

const BASE = API_BASE_URL;

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
