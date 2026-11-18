import { expect, test } from '@playwright/test';
import { loginAs, logout } from './helpers';

test('przekierowuje anonimowego użytkownika na logowanie', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Szyfrowanie wiadomości' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zaloguj się' })).toBeVisible();
});

test('odrzuca błędne poświadczenia', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Login').fill('alice');
  await page.getByLabel('Hasło').fill('NieprawidloweHaslo123!');
  await page.getByRole('button', { name: 'Zaloguj się' }).click();

  await expect(page.getByRole('alert')).toHaveText('Nieprawidłowy login lub hasło.');
  await expect(page).toHaveURL(/\/login$/);
});

test('loguje i wylogowuje użytkownika demonstracyjnego', async ({ page }) => {
  await loginAs(page, 'alice');

  await expect(page.getByText('Zalogowano jako').locator('strong')).toHaveText('alice');
  await expect(page.getByRole('heading', { name: 'Szyfrowanie', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Zapisane wiadomości', exact: true }),
  ).toBeVisible();

  await logout(page);

  await expect(page.getByRole('button', { name: 'Zaloguj się' })).toBeVisible();
});
