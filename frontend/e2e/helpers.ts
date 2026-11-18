import { expect, type Page } from '@playwright/test';

export const DEMO_USERS = {
  alice: { username: 'alice', password: 'AliceDemo123!' },
  bob: { username: 'bob', password: 'BobDemo1234!' },
} as const;

export type DemoUser = keyof typeof DEMO_USERS;

export function cryptoRegion(page: Page) {
  return page.getByRole('region', { name: 'Szyfrowanie' });
}

export function messagesRegion(page: Page) {
  return page.getByRole('region', { name: 'Zapisane wiadomości' });
}

export async function loginAs(page: Page, user: DemoUser): Promise<void> {
  const credentials = DEMO_USERS[user];

  await page.goto('/login');
  await page.getByLabel('Login').fill(credentials.username);
  await page.getByLabel('Hasło').fill(credentials.password);
  await page.getByRole('button', { name: 'Zaloguj się' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Panel', exact: true })).toBeVisible();
}

export async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Wyloguj' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** Zakłada wiadomość przez UI i zwraca jej identyfikator z odpowiedzi API. */
export async function createMessageViaUi(page: Page, plaintext: string): Promise<string> {
  const region = messagesRegion(page);
  await region.getByLabel('Nowa wiadomość').fill(plaintext);

  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === 'POST' && candidate.url().endsWith('/api/messages'),
    ),
    region.getByRole('button', { name: 'Zapisz zaszyfrowaną wiadomość' }).click(),
  ]);

  expect(response.status()).toBe(201);
  const body = (await response.json()) as { id: string };

  await expect(region.getByText('Wiadomość została zapisana.')).toBeVisible();
  await expect(region.locator('li').first()).toBeVisible();

  return body.id;
}

/** Sprząta wiadomość niezależnie od tego, na którym koncie zakończył się test. */
export async function cleanupMessageAsAlice(page: Page, id: string): Promise<void> {
  await page.goto('/');

  // Po nawigacji React jeszcze nie zdążył zamontować nagłówka — czekamy na
  // którykolwiek z widoków, zanim podejmiemy decyzję o logowaniu.
  const logoutButton = page.getByRole('button', { name: 'Wyloguj' });
  const loginButton = page.getByRole('button', { name: 'Zaloguj się' });
  await expect(logoutButton.or(loginButton).first()).toBeVisible();

  if (await loginButton.isVisible()) {
    await loginAs(page, 'alice');
  } else {
    const username = await page
      .getByText('Zalogowano jako')
      .locator('strong')
      .textContent()
      .catch(() => null);

    if (username?.trim() !== 'alice') {
      await logout(page);
      await loginAs(page, 'alice');
    }
  }

  await deleteMessageViaApi(page, id);
}

/** Usuwa wiadomość przez API — używamy do sprzątania po testach izolacji. */
export async function deleteMessageViaApi(page: Page, id: string): Promise<void> {
  const csrfResponse = await page.request.get('/api/auth/csrf');
  expect(csrfResponse.ok()).toBeTruthy();
  const { token } = (await csrfResponse.json()) as { token: string };

  const response = await page.request.delete(`/api/messages/${id}`, {
    headers: { 'X-XSRF-TOKEN': token },
  });
  // Sprzątanie jest idempotentne — wiadomość mogła już zostać usunięta w teście.
  expect(response.ok() || response.status() === 404).toBeTruthy();
}
