import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionQueryKey } from '@/features/auth';
import { resetCsrfToken } from '@/shared/api';
import { jsonResponse } from '@/test/http';
import { createTestQueryClient, renderWithQueryClient } from '@/test/render';
import { mockApi } from '@/test/server';
import { MessageListItem } from './MessageListItem';

const MESSAGE = { id: 'm-1', createdAt: '2026-11-17T10:00:00Z' };

function renderItem() {
  return renderWithQueryClient(
    <ul>
      <MessageListItem message={MESSAGE} />
    </ul>,
  );
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

describe('MessageListItem', () => {
  it('pobiera i wyświetla pakiet wiadomości', async () => {
    mockApi((url) =>
      url === `/api/messages/${MESSAGE.id}`
        ? jsonResponse({ ...MESSAGE, packet: 'v1.nonce.ciphertext' })
        : undefined,
    );
    const user = userEvent.setup();
    renderItem();

    await user.click(screen.getByRole('button', { name: 'Pokaż pakiet' }));

    expect(await screen.findByText('v1.nonce.ciphertext')).toBeInTheDocument();
  });

  it('odszyfrowuje wiadomość i pozwala ukryć tekst', async () => {
    mockApi((url, init) => {
      if (url === `/api/messages/${MESSAGE.id}/decrypt` && init?.method === 'POST') {
        return jsonResponse({ plaintext: 'jawny tekst' });
      }
      return undefined;
    });
    const user = userEvent.setup();
    renderItem();

    await user.click(screen.getByRole('button', { name: 'Odszyfruj' }));

    expect(await screen.findByText('jawny tekst')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ukryj tekst' }));

    expect(screen.queryByText('jawny tekst')).not.toBeInTheDocument();
  });

  it('wymaga potwierdzenia przed usunięciem', async () => {
    const fetchMock = mockApi((url, init) => {
      if (url === `/api/messages/${MESSAGE.id}` && init?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      return undefined;
    });
    const user = userEvent.setup();
    renderItem();

    await user.click(screen.getByRole('button', { name: 'Usuń' }));

    expect(
      screen.getByText('Usunąć tę wiadomość? Tej operacji nie można cofnąć.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Potwierdź usunięcie' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/messages/${MESSAGE.id}`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
    expect(
      screen.queryByText('Usunąć tę wiadomość? Tej operacji nie można cofnąć.'),
    ).not.toBeInTheDocument();
  });

  it('pokazuje komunikat, gdy wiadomość zniknęła', async () => {
    mockApi(() =>
      jsonResponse({ code: 'MESSAGE_NOT_FOUND', message: 'Nie znaleziono wiadomości.' }, 404),
    );
    const user = userEvent.setup();
    renderItem();

    await user.click(screen.getByRole('button', { name: 'Odszyfruj' }));

    expect(await screen.findByText('Wiadomość nie jest już dostępna.')).toBeInTheDocument();
  });

  it('kończy sesję po 401 z operacji na wiadomości', async () => {
    mockApi(() => jsonResponse({ code: 'UNAUTHENTICATED', message: 'Wymagane zalogowanie.' }, 401));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(sessionQueryKey, { id: 'u-1', username: 'alice' });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <ul>
          <MessageListItem message={MESSAGE} />
        </ul>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Odszyfruj' }));

    await waitFor(() => {
      expect(queryClient.getQueryData(sessionQueryKey)).toBeNull();
    });
  });
});
