import { screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetCsrfToken } from '@/shared/api';
import { jsonResponse } from '@/test/http';
import { renderWithQueryClient } from '@/test/render';
import { ProtectedRoute } from './ProtectedRoute';

const fetchMock = vi.fn();

function renderProtectedRoutes() {
  return renderWithQueryClient(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<p>Chroniona treść</p>} />
        </Route>
        <Route path="/login" element={<p>Ekran logowania</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  resetCsrfToken();
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetCsrfToken();
});

describe('ProtectedRoute', () => {
  it('pokazuje stan ładowania, a potem przekierowuje anonimowego użytkownika', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ code: 'UNAUTHENTICATED', message: 'Wymagane zalogowanie.' }, 401),
    );

    renderProtectedRoutes();

    expect(screen.getByText('Sprawdzanie sesji…')).toBeInTheDocument();
    expect(await screen.findByText('Ekran logowania')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('renderuje chronioną treść dla zalogowanego użytkownika', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: '11111111-1111-1111-1111-111111111111', username: 'alice' }),
    );

    renderProtectedRoutes();

    expect(await screen.findByText('Chroniona treść')).toBeInTheDocument();
  });
});
