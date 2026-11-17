import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, resetCsrfToken } from '@/shared/api';
import { jsonResponse } from '@/test/http';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  resetCsrfToken();
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetCsrfToken();
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});

describe('apiRequest', () => {
  it('nie dołącza nagłówka CSRF do żądań bezpiecznych', async () => {
    document.cookie = 'XSRF-TOKEN=cookie-token; path=/';
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'u-1', username: 'alice' }));

    await apiRequest('/api/auth/me');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['X-XSRF-TOKEN']).toBeUndefined();
  });

  it('dołącza nagłówek CSRF i JSON do mutacji', async () => {
    document.cookie = 'XSRF-TOKEN=cookie-token; path=/';
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await apiRequest('/api/messages', { method: 'POST', body: { plaintext: 'tajne' } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['X-XSRF-TOKEN']).toBe('cookie-token');
    expect(headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ plaintext: 'tajne' }));
  });

  it('odświeża token CSRF i ponawia żądanie po odpowiedzi CSRF_INVALID', async () => {
    document.cookie = 'XSRF-TOKEN=stale-token; path=/';
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ code: 'CSRF_INVALID', message: 'Odrzucony token CSRF.' }, 403),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          token: 'fresh-token',
          headerName: 'X-XSRF-TOKEN',
          cookieName: 'XSRF-TOKEN',
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await apiRequest('/api/auth/login', { method: 'POST', body: {} });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [csrfUrl] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(csrfUrl).toBe('/api/auth/csrf');

    const [, retryInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect((retryInit.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('fresh-token');
  });

  it('zamienia odpowiedź błędu na ApiError z listą błędów pól', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          code: 'VALIDATION_FAILED',
          message: 'Dane żądania są nieprawidłowe.',
          fieldErrors: [{ field: 'username', message: 'Login jest wymagany.' }],
        },
        400,
      ),
    );

    await expect(apiRequest('/api/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject(
      {
        name: 'ApiError',
        status: 400,
        code: 'VALIDATION_FAILED',
        fieldErrors: [{ field: 'username', message: 'Login jest wymagany.' }],
      },
    );
  });

  it('zwraca undefined dla odpowiedzi 204', async () => {
    document.cookie = 'XSRF-TOKEN=test-token; path=/';
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(apiRequest('/api/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('opakowuje nie-JSON odpowiedź błędu w ApiError', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>błąd proxy</html>', { status: 502 }));

    const error = await apiRequest('/api/auth/me').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 502, code: 'UNKNOWN_ERROR' });
  });
});
