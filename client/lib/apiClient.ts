import { getToken } from "@clerk/nextjs";

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

export interface ApiRequestOptions {
  method?: ApiMethod;
  body?: any;
  token?: string | null;
  headers?: Record<string, string>;
  shouldStringify?: boolean;
}

export async function apiFetch<T = any>(
  path: string,
  opts: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,

    headers = {},
    shouldStringify = true,
  } = opts;
  const token = await getToken?.();
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

  if (body && shouldStringify) fetchOpts.body = JSON.stringify(body);

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

export async function apiFormData<T = any>(
  path: string,
  formData: FormData,
  opts?: {
    method?: "POST" | "PATCH";
  },
): Promise<T> {
  const token = await getToken?.();
  const url = path.startsWith("/")
    ? `${API_BASE}${path}`
    : `${API_BASE}/${path}`;

  const res = await fetch(url, {
    method: opts?.method ? opts?.method : "POST",
    body: formData,
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText || `Request failed: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }

  return res.text() as unknown as T;
}

export default { apiFetch, apiFormData };
