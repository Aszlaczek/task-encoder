import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionQueryKey } from '@/features/auth';
import { resetCsrfToken } from '@/shared/api';
import { jsonResponse } from '@/test/http';
import { createTestQueryClient, renderWithQueryClient } from '@/test/render';
import { mockApi } from '@/test/server';
import { MessagesPanel } from './MessagesPanel';

const MESSAGE = { id: 'm-1', createdAt: '2026-11-17T10:00:00Z' };

function pageResponse(page: number, items: (typeof MESSAGE)[] = []) {
  return jsonResponse({
    items,
    page,
    size: 10,
    totalElements: items.length,
    totalPages: items.length > 0 ? 1 : 0,
  });
}

beforeEach(() => {
  resetCsrfToken();
  document.cookie = 'XSRF-TOKEN=test-token; path=/';
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetCsrfToken();
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});

describe('MessagesPanel', () => {
  it('pokazuje pusty stan, gdy brak wiadomości', async () => {
    mockApi(() => pageResponse(0));

    renderWithQueryClient(<MessagesPanel />);

    expect(
      await screen.findByText('Nie masz jeszcze żadnych zapisanych wiadomości.'),
    ).toBeInTheDocument();
  });

  it('przechodzi na kolejną stronę paginacji', async () => {
    mockApi((url) => {
      const parsed = new URL(url, 'http://localhost');
      if (parsed.pathname !== '/api/messages') {
        return undefined;
      }
      const page = Number(parsed.searchParams.get('page') ?? 0);
      const items = Array.from({ length: page === 0 ? 10 : 1 }, (_, index) => ({
        id: `m-${page}-${index}`,
        createdAt: MESSAGE.createdAt,
      }));
      return jsonResponse({
        items,
        page,
        size: 10,
        totalElements: 11,
        totalPages: 2,
      });
    });
    const user = userEvent.setup();
    renderWithQueryClient(<MessagesPanel />);

    expect(await screen.findByText('Strona 1 z 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Następna' }));

    expect(await screen.findByText('Strona 2 z 2')).toBeInTheDocument();
  });

  it('zapisuje nową wiadomość i pokazuje potwierdzenie', async () => {
    let items: (typeof MESSAGE)[] = [];
    const fetchMock = mockApi((url, init) => {
      if (url.startsWith('/api/messages?page=')) {
        return jsonResponse({
          items,
          page: 0,
          size: 10,
          totalElements: items.length,
          totalPages: items.length > 0 ? 1 : 0,
        });
      }
      if (url === '/api/messages' && init?.method === 'POST') {
        items = [MESSAGE];
        return jsonResponse({ ...MESSAGE, packet: 'v1.nonce.ct' }, 201);
      }
      return undefined;
    });
    const user = userEvent.setup();
    renderWithQueryClient(<MessagesPanel />);

    await screen.findByText('Nie masz jeszcze żadnych zapisanych wiadomości.');
    await user.type(screen.getByLabelText('Nowa wiadomość'), 'tajna wiadomość');
    await user.click(screen.getByRole('button', { name: 'Zapisz zaszyfrowaną wiadomość' }));

    expect(await screen.findByText('Wiadomość została zapisana.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/messages',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ plaintext: 'tajna wiadomość' }),
      }),
    );
  });

  it('kończy sesję po otrzymaniu 401 z listy wiadomości', async () => {
    mockApi(() => jsonResponse({ code: 'UNAUTHENTICATED', message: 'Wymagane zalogowanie.' }, 401));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(sessionQueryKey, { id: 'u-1', username: 'alice' });

    render(
      <QueryClientProvider client={queryClient}>
        <MessagesPanel />
      </QueryClientProvider>,
    );

    await vi.waitFor(() => {
      expect(queryClient.getQueryData(sessionQueryKey)).toBeNull();
    });
  });
});
