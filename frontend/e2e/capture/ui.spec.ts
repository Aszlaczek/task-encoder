import { expect, test } from '@playwright/test';
import { createMessageViaUi, deleteMessageViaApi, loginAs, messagesRegion } from '../helpers';
import { capture } from './screenshot';

test('ekran logowania w jasnym motywie', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Szyfrowanie wiadomości' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zaloguj się' })).toBeVisible();

  await capture(page, '01-logowanie.png');
});

test('ekran logowania w ciemnym motywie', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Włącz tryb ciemny' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await capture(page, '02-logowanie-ciemny.png');
});

test('panel po zalogowaniu', async ({ page }) => {
  await loginAs(page, 'alice');
  await expect(messagesRegion(page)).toBeVisible();

  await capture(page, '03-panel.png');
});

test('wiadomość z odszyfrowanym tekstem', async ({ page }) => {
  const plaintext = `Zrzut E2E ${Date.now()}`;
  let id: string | null = null;

  await loginAs(page, 'alice');

  try {
    id = await createMessageViaUi(page, plaintext);
    const item = messagesRegion(page).locator(`li[data-message-id="${id}"]`);

    await item.getByRole('button', { name: 'Pokaż pakiet' }).click();
    await item.getByRole('button', { name: 'Odszyfruj' }).click();
    await expect(item.getByLabel('Odszyfrowany tekst')).toHaveText(plaintext);

    await capture(page, '04-wiadomosc-odszyfrowana.png');
  } finally {
    if (id) {
      await deleteMessageViaApi(page, id);
    }
  }
});

test.describe('widok mobilny', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('panel na telefonie', async ({ page }) => {
    await loginAs(page, 'alice');
    await expect(messagesRegion(page)).toBeVisible();

    await capture(page, '05-panel-mobilny.png');
  });
});
