import { vi } from 'vitest';
import { jsonResponse } from './http';

type RequestHandler = (url: string, init?: RequestInit) => Response | Promise<Response> | undefined;

/** Podstawia fetch prostą funkcją opartą na dopasowaniu ścieżki żądania. */
export function mockApi(handler: RequestHandler) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
    const response = await handler(url, init);

    if (!response) {
      throw new Error(`Brak stubu dla żądania: ${init?.method ?? 'GET'} ${url}`);
    }

    return response;
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function csrfTokenResponse(token = 'test-token'): Response {
  return jsonResponse({
    token,
    headerName: 'X-XSRF-TOKEN',
    cookieName: 'XSRF-TOKEN',
  });
}
