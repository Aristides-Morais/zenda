let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

// Lê a URL do backend a partir das variáveis de ambiente (na Vercel)
const API_URL = import.meta.env.VITE_API_URL || "";

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

type ApiOptions = RequestInit & { skipAuth?: boolean };

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken: string };
      accessToken = data.accessToken;
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth, ...init } = options;

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // Aqui está a mágica: junta o link do Render com o caminho da API
  let response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retryHeaders = new Headers(init.headers);
      if (init.body && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }
      retryHeaders.set("Authorization", `Bearer ${accessToken}`);
      response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: retryHeaders,
        credentials: "include",
      });
    }
  }

  if (!response.ok) {
    let errorBody: { error?: { code: string; message: string; details?: unknown } } = {};
    try {
      errorBody = await response.json();
    } catch {
      // resposta sem JSON
    }
    const err = new Error(
      errorBody.error?.message ?? `HTTP ${response.status}`
    ) as Error & {
      code?: string;
      status?: number;
      details?: unknown;
    };
    err.code = errorBody.error?.code;
    err.status = response.status;
    err.details = errorBody.error?.details;
    throw err;
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}