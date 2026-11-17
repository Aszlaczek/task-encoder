import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetCsrfToken } from '@/shared/api';
import { jsonResponse } from '@/test/http';
import { renderWithQueryClient } from '@/test/render';
import { mockApi } from '@/test/server';
import { DecryptPanel } from './DecryptPanel';

beforeEach(() => {
  resetCsrfToken();
  document.cookie = 'XSRF-TOKEN=test-token; path=/';
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetCsrfToken();
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});

describe('DecryptPanel', () => {
  it('waliduje pusty pakiet', async () => {
    const fetchMock = mockApi(() => undefined);
    const user = userEvent.setup();
    renderWithQueryClient(<DecryptPanel />);

    await user.click(screen.getByRole('button', { name: 'Odszyfruj' }));

    expect(await screen.findByText('Podaj pakiet do odszyfrowania.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('odszyfrowuje pakiet i pokazuje tekst', async () => {
    mockApi((url, init) => {
      if (url === '/api/crypto/decrypt' && init?.method === 'POST') {
        return jsonResponse({ plaintext: 'jawny tekst' });
      }
      return undefined;
    });
    const user = userEvent.setup();
    renderWithQueryClient(<DecryptPanel />);

    await user.type(screen.getByLabelText('Pakiet'), 'v1.nonce.ciphertext');
    await user.click(screen.getByRole('button', { name: 'Odszyfruj' }));

    expect(await screen.findByText('jawny tekst')).toBeInTheDocument();
    expect(screen.getByText('Odszyfrowany tekst')).toBeInTheDocument();
  });

  it('pokazuje komunikat dla nieprawidłowego pakietu', async () => {
    mockApi(() =>
      jsonResponse(
        {
          code: 'CRYPTO_PAYLOAD_INVALID',
          message: 'Nieprawidłowy pakiet szyfrogramu.',
        },
        400,
      ),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<DecryptPanel />);

    await user.type(screen.getByLabelText('Pakiet'), 'v1.cos.zlego');
    await user.click(screen.getByRole('button', { name: 'Odszyfruj' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nieprawidłowy pakiet szyfrogramu.');
  });
});
