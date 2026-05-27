import { appConfig, runtime } from "@/config";

/**
 * Tiny, isomorphic HTTP wrapper around the platform `fetch`.
 *
 * Mirror of novasafe-auth-v2's http client (kept in sync) so headers, error
 * handling, and configuration drift cannot creep in between the two web
 * surfaces.
 */

type QueryValue = string | number | boolean | undefined | null;
type QueryRecord = Record<string, QueryValue>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: QueryRecord;
  headers?: Record<string, string>;
  token?: string;
  signal?: AbortSignal;
  baseUrl?: string;
}

export interface ApiErrorBody {
  message?: string;
  code?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly body?: ApiErrorBody | string | null,
  ) {
    super(message);
    this.name = "ApiError";
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }
  isForbidden(): boolean {
    return this.status === 403;
  }
  isClient(): boolean {
    return this.status >= 400 && this.status < 500;
  }
  isServer(): boolean {
    return this.status >= 500;
  }
}

function buildUrl(path: string, query: QueryRecord | undefined, baseUrl: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${cleanBase}${cleanPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function buildHeaders(hasJsonBody: boolean, options: RequestOptions): Record<string, string> {
  const platform = runtime.isBrowser ? "web" : "web-ssr";
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Source": appConfig.surface,
    "X-Client-Source": appConfig.surface,
    "X-Client-Platform": platform,
    "X-Client-Version": appConfig.version,
    "X-Build-Version": appConfig.version,
    ...options.headers,
  };
  if (hasJsonBody) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  return headers;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const hasBody = options.body !== undefined && options.body !== null;
  const baseUrl = options.baseUrl ?? appConfig.urls.api;

  const response = await fetch(buildUrl(path, options.query, baseUrl), {
    method,
    headers: buildHeaders(hasBody, options),
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const errorBody =
      body && typeof body === "object" && !Array.isArray(body) ? (body as ApiErrorBody) : null;
    throw new ApiError(
      errorBody?.message || `Request failed with status ${response.status}`,
      response.status,
      errorBody?.code,
      errorBody ?? (typeof body === "string" ? body : null),
    );
  }

  return body as T;
}
