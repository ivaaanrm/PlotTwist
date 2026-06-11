import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
const API_PREFIX = "/api/v1";

export class APIError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "APIError";
    this.status = status;
    this.detail = detail;
  }
}

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("access_token");
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync("access_token", token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync("access_token");
}

export async function hasToken(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  formData?: Record<string, string>;
};

export async function api<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    headers = {},
    requiresAuth = true,
    formData,
  } = options;

  let url = `${BASE_URL}${API_PREFIX}${path}`;

  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const reqHeaders: Record<string, string> = { ...headers };

  if (requiresAuth) {
    const token = await getToken();
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  let reqBody: string | undefined;

  if (formData) {
    reqHeaders["Content-Type"] = "application/x-www-form-urlencoded";
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(formData)) {
      params.append(key, value);
    }
    reqBody = params.toString();
  } else if (body !== undefined) {
    reqHeaders["Content-Type"] = "application/json";
    reqBody = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: reqBody,
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    throw new APIError(res.status, error.detail ?? "Request failed");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
