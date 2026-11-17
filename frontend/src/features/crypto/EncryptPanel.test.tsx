import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetCsrfToken } from '@/shared/api';
import { jsonResponse } from '@/test/http';
import { renderWithQueryClient } from '@/test/render';
import { mockApi } from '@/test/server';
import { EncryptPanel } from './EncryptPanel';

let fetchMock: ReturnType<typeof mockApi>;

beforeEach(() => {
  resetCsrfToken();
  document.cookie = 'XSRF-TOKEN=test-token; path=/';
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetCsrfToken();
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});

describe('EncryptPanel', () => {
  it('waliduje pusty tekst bez wysyłania żądania', async () => {
    fetchMock = mockApi(() => undefined);
    const user = userEvent.setup();
    renderWithQueryClient(<EncryptPanel />);

    await user.click(screen.getByRole('button', { name: 'Zaszyfruj' }));

    expect(await screen.findByText('Podaj tekst do zaszyfrowania.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('szyfruje tekst i wyświetla pakiet', async () => {
    fetchMock = mockApi((url, init) => {
      if (url === '/api/crypto/encrypt' && init?.method === 'POST') {
        return jsonResponse({ packet: 'v1.nonce.ciphertext' });
      }
      return undefined;
    });
    const user = userEvent.setup();
    renderWithQueryClient(<EncryptPanel />);

    await user.type(screen.getByLabelText('Tekst jawny'), 'tajna wiadomość');
    await user.click(screen.getByRole('button', { name: 'Zaszyfruj' }));

    expect(await screen.findByText('v1.nonce.ciphertext')).toBeInTheDocument();
    expect(screen.getByText('Pakiet szyfrogramu')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('pokazuje błąd walidacji zwrócony przez backend', async () => {
    fetchMock = mockApi(() =>
      jsonResponse(
        {
          code: 'VALIDATION_FAILED',
          message: 'Dane żądania są nieprawidłowe.',
          fieldErrors: [{ field: 'plaintext', message: 'Tekst jest wymagany.' }],
        },
        400,
      ),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<EncryptPanel />);

    await user.type(screen.getByLabelText('Tekst jawny'), 'x');
    await user.click(screen.getByRole('button', { name: 'Zaszyfruj' }));

    expect(await screen.findByText('Tekst jest wymagany.')).toBeInTheDocument();
  });
});
