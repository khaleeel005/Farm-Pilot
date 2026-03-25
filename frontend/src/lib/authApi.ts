import { authEvents } from "@/lib/authEvents";
import {
  API_BASE_URL,
  clearStoredAuth,
  fetchWithAuth,
  handleResponse,
} from "@/lib/apiClient";

export async function login(credentials: {
  username: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
    } catch {
      // Ignore logout API failures and clear local auth state anyway.
    }
  }

  clearStoredAuth(true);
}

export async function getCurrentUser() {
  try {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/auth/me`);
    if (res.status === 401) {
      clearStoredAuth(true);
      return null;
    }

    const data = await handleResponse<{ user?: unknown; data?: unknown }>(res);
    return data?.user || data?.data || null;
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes("401")) {
      return null;
    }

    throw error;
  }
}
