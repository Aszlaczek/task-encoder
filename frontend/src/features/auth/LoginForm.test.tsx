import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetCsrfToken } from '@/shared/api';
import { jsonResponse } from '@/test/http';
import { renderWithQueryClient } from '@/test/render';
import { LoginForm } from './LoginForm';

const fetchMock = vi.fn();

function renderLogin() {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/" element={<p>Panel główny</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillCredentials(username: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Login'), username);
  await user.type(screen.getByLabelText('Hasło'), password);
  await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));
  return user;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  resetCsrfToken();
  document.cookie = 'XSRF-TOKEN=test-token; path=/';
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetCsrfToken();
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});

describe('LoginForm', () => {
  it('pokazuje błędy walidacji bez wysyłania żądania', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(await screen.findByText('Podaj login.')).toBeInTheDocument();
    expect(screen.getByText('Podaj hasło.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pokazuje błąd po nieprawidłowych danych i wysyła token CSRF', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ code: 'INVALID_CREDENTIALS', message: 'Nieprawidłowy login lub hasło.' }, 401),
    );

    renderLogin();
    await fillCredentials('alice', 'zle-haslo');

    expect(await screen.findByRole('alert')).toHaveTextContent('Nieprawidłowy login lub hasło.');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/login');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ username: 'alice', password: 'zle-haslo' }));
    expect((init.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('test-token');
  });

  it('po poprawnym logowaniu przechodzi do panelu', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: '11111111-1111-1111-1111-111111111111', username: 'alice' }),
    );

    renderLogin();
    await fillCredentials('alice', 'AliceDemo123!');

    expect(await screen.findByText('Panel główny')).toBeInTheDocument();
  });

  it('mapuje błędy walidacji zwrócone przez serwer na pola formularza', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          code: 'VALIDATION_FAILED',
          message: 'Dane żądania są nieprawidłowe.',
          fieldErrors: [{ field: 'password', message: 'Hasło jest wymagane.' }],
        },
        400,
      ),
    );

    renderLogin();
    await fillCredentials('alice', 'x');

    expect(await screen.findByText('Hasło jest wymagane.')).toBeInTheDocument();
  });
});
