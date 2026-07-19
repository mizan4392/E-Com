type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

export interface ApiRequestOptions {
  method?: ApiMethod;
  body?: any;
  token?: string | null;
  headers?: Record<string, string>;
}

export async function apiFetch<T = any>(
  path: string,
  opts: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token, headers = {} } = opts;
  const url = path.startsWith("/")
    ? `${API_BASE}${path}`
    : `${API_BASE}/${path}`;

  const fetchOpts: RequestInit = {
    method,
    headers: {
      "Content-Type": body ? "application/json" : "application/json",
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  };

  if (body) fetchOpts.body = JSON.stringify(body);

  const res = await fetch(url, fetchOpts);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const msg = text || res.statusText || `Request failed: ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }

  // fallback to text
  return res.text() as unknown as T;
}

export default apiFetch;
