import {
  API_BASE_URL,
  fetchWithAuth,
  handleResponse,
} from "@/lib/apiClient";
import type { User } from "@/types";

const BASE = API_BASE_URL;

export async function listStaff(): Promise<User[]> {
  const res = await fetchWithAuth(`${BASE}/api/staff`);
  const data = await handleResponse<{ data?: User[] }>(res);
  return data?.data ?? [];
}

export async function createStaff(payload: {
  username: string;
  password: string;
}): Promise<User> {
  const res = await fetchWithAuth(`${BASE}/api/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: User }>(res);
  return data?.data as User;
}

export async function updateStaff(
  id: number | string,
  payload: { fullName?: string; password?: string; isActive?: boolean },
): Promise<User> {
  const res = await fetchWithAuth(`${BASE}/api/staff/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse<{ data?: User }>(res);
  return data?.data as User;
}

export async function deleteStaff(id: number | string) {
  const res = await fetchWithAuth(`${BASE}/api/staff/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}
