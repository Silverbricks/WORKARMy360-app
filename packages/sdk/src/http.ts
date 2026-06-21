import type { ApiError, ApiErrorCode } from '@workarmy/types';

/** Error thrown for any non-2xx response, carrying the typed API error body. */
export class WorkArmyApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(status: number, body: Partial<ApiError>) {
    super(body.message ?? 'Request failed');
    this.name = 'WorkArmyApiError';
    this.status = status;
    this.code = body.code ?? 'INTERNAL';
    this.details = body.details;
  }
}

export interface HttpClientOptions {
  baseUrl: string;
  /** Supplies the access token for the Authorization header, if any. */
  getAccessToken?: () => string | null | undefined;
  /** Headers added to every request (e.g. forwarded cookies in RSC). */
  defaultHeaders?: Record<string, string>;
  /** Override fetch (tests / server runtimes). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export class HttpClient {
  constructor(private readonly opts: HttpClientOptions) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const doFetch = this.opts.fetchImpl ?? fetch;
    const url = this.opts.baseUrl.replace(/\/$/, '') + path;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.opts.defaultHeaders,
      ...options.headers,
    };
    const token = this.opts.getAccessToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await doFetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
      signal: options.signal,
    });

    const text = await res.text();
    const data = text ? parseJson(text) : undefined;

    if (!res.ok) {
      throw new WorkArmyApiError(res.status, (data as Partial<ApiError>) ?? {});
    }
    return data as T;
  }
}
