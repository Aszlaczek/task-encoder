import { expect, test } from '@playwright/test';
import { cryptoRegion, loginAs } from './helpers';

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'alice');
});

test('szyfruje tekst i odszyfrowuje otrzymany pakiet', async ({ page }) => {
  const region = cryptoRegion(page);
  const plaintext = `E2E szyfrowanie ${Date.now()}`;

  await region.getByLabel('Tekst jawny').fill(plaintext);
  await region.getByRole('button', { name: 'Zaszyfruj' }).click();

  const packet = await region.getByLabel('Pakiet szyfrogramu').innerText();
  expect(packet).toMatch(/^v1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/);

  await region.getByLabel('Pakiet', { exact: true }).fill(packet);
  await region.getByRole('button', { name: 'Odszyfruj' }).click();

  await expect(region.getByLabel('Odszyfrowany tekst')).toHaveText(plaintext);
});

test('pokazuje błąd dla nieprawidłowego pakietu', async ({ page }) => {
  const region = cryptoRegion(page);

  await region.getByLabel('Pakiet', { exact: true }).fill('v1.czy.to.jest.poprawne');
  await region.getByRole('button', { name: 'Odszyfruj' }).click();

  await expect(region.getByRole('alert')).toHaveText('Nieprawidłowy pakiet szyfrogramu.');
  await expect(region.getByLabel('Odszyfrowany tekst')).toHaveCount(0);
});
