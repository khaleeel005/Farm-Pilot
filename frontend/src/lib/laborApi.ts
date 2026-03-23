import type {
  Laborer,
  LaborerPayload,
  Payroll,
  PayrollPayload,
  WorkAssignment,
  WorkAssignmentPayload,
} from "@/types";
import {
  API_BASE_URL,
  fetchWithAuth,
  handleResponse,
} from "@/lib/apiClient";

const BASE = API_BASE_URL;

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
  const query = year ? `?year=${encodeURIComponent(year)}` : "";
  const res = await fetchWithAuth(`${BASE}/api/payroll/summary${query}`);
  const data = await handleResponse<{ data?: unknown }>(res);
  return data?.data || {};
}
