import { ApiError } from './types';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const CSRF_PATH = '/api/auth/csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

type CsrfResponse = {
  token: string;
  headerName: string;
  cookieName: string;
};

export type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

let csrfToken: string | null = null;

/** Czyści token CSRF trzymany w pamięci. Cookie przeglądarki pozostaje źródłem prawdy. */
export function resetCsrfToken(): void {
  csrfToken = null;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const prefix = `${name}=`;
  for (const entry of document.cookie.split(';')) {
    const value = entry.trim();
    if (value.startsWith(prefix)) {
      return decodeURIComponent(value.slice(prefix.length));
    }
  }

  return null;
}

async function fetchCsrfToken(): Promise<string> {
  const response = await fetch(CSRF_PATH, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  const payload = (await response.json()) as CsrfResponse;
  csrfToken = payload.token;
  return payload.token;
}

async function ensureCsrfToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    if (csrfToken) {
      return csrfToken;
    }

    const fromCookie = readCookie(CSRF_COOKIE_NAME);
    if (fromCookie) {
      csrfToken = fromCookie;
      return fromCookie;
    }
  }

  return fetchCsrfToken();
}

async function execute<T>(
  path: string,
  options: RequestOptions,
  allowCsrfRetry: boolean,
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!SAFE_METHODS.has(method)) {
    headers[CSRF_HEADER_NAME] = await ensureCsrfToken();
  }

  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (!response.ok) {
    const error = await ApiError.fromResponse(response);
    const csrfFailure =
      error.status === 403 && error.code === 'CSRF_INVALID' && !SAFE_METHODS.has(method);

    if (csrfFailure && allowCsrfRetry) {
      await ensureCsrfToken(true);
      return execute<T>(path, options, false);
    }

    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Klient JSON działający w obrębie jednego origin. Cookie sesji wysyła przeglądarka,
 * a token CSRF jest dołączany wyłącznie do żądań zmieniających stan.
 */
export function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return execute<T>(path, options, true);
}
