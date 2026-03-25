import { authEvents } from "@/lib/authEvents";

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error("API_URL must be set");
}

export const API_BASE_URL = API_URL.endsWith("/")
  ? API_URL.slice(0, -1)
  : API_URL;

export function clearStoredAuth(emitLogout = false): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("fm_token");
  localStorage.removeItem("fm_refresh");

  if (emitLogout) {
    authEvents.emit("logout");
  }
}

function authHeader(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("fm_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;
    const refresh = localStorage.getItem("fm_refresh");
    if (!refresh) {
      if (localStorage.getItem("fm_token")) {
        clearStoredAuth(true);
      }
      return false;
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!res.ok) {
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        clearStoredAuth(true);
      }
      return false;
    }
    const body = await res.json().catch(() => ({}));
    const token = body?.token || body?.data?.token;

    if (token) {
      localStorage.setItem("fm_token", token);
      authEvents.emit("refresh");
      return true;
    }

    clearStoredAuth(true);
    return false;
  } catch {
    return false;
  }
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
  retry = true,
): Promise<Response> {
  const headers = new Headers(init?.headers as HeadersInit | undefined);
  const ah = authHeader();

  Object.entries(ah).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      headers.set(key, String(value));
    }
  });

  const merged: RequestInit = { ...init, headers };
  const res = await fetch(input, merged);

  if (res.status === 401 && retry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryHeaders = new Headers(init?.headers as HeadersInit | undefined);
      const retryAuthHeaders = authHeader();

      Object.entries(retryAuthHeaders).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          retryHeaders.set(key, String(value));
        }
      });

      const retried: RequestInit = { ...init, headers: retryHeaders };
      return fetch(input, retried);
    }
  }

  return res;
}

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

export async function handleResponse<T = unknown>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;

    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      // Ignore non-JSON error responses.
    }

    if (res.status === 403) {
      message = message || "You do not have permission to perform this action";
    } else if (res.status === 401) {
      message = message || "Please log in to continue";
    } else if (res.status === 404) {
      message = message || "The requested resource was not found";
    }

    return Promise.reject(new ApiError(message, res.status));
  }

  return res.json().catch(() => ({}) as T);
}
