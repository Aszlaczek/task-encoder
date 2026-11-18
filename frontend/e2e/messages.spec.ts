import { expect, test } from '@playwright/test';
import {
  cleanupMessageAsAlice,
  createMessageViaUi,
  loginAs,
  logout,
  messagesRegion,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'alice');
});

test('tworzy, podgląda, odszyfrowuje i usuwa wiadomość', async ({ page }) => {
  const plaintext = `E2E wiadomość ${Date.now()}`;
  let id: string | null = null;

  try {
    const region = messagesRegion(page);
    id = await createMessageViaUi(page, plaintext);
    const item = region.locator(`li[data-message-id="${id}"]`);

    await item.getByRole('button', { name: 'Pokaż pakiet' }).click();
    await expect(item.getByLabel('Pakiet szyfrogramu')).toContainText('v1.');

    await item.getByRole('button', { name: 'Odszyfruj' }).click();
    await expect(item.getByLabel('Odszyfrowany tekst')).toHaveText(plaintext);

    await item.getByRole('button', { name: 'Usuń' }).click();
    await expect(
      item.getByText('Usunąć tę wiadomość? Tej operacji nie można cofnąć.'),
    ).toBeVisible();

    await item.getByRole('button', { name: 'Anuluj' }).click();
    await expect(item.getByText('Usunąć tę wiadomość? Tej operacji nie można cofnąć.')).toHaveCount(
      0,
    );

    await item.getByRole('button', { name: 'Usuń' }).click();
    await item.getByRole('button', { name: 'Potwierdź usunięcie' }).click();

    await expect(item).toHaveCount(0);
    id = null;
  } finally {
    if (id) {
      await cleanupMessageAsAlice(page, id);
    }
  }
});

test('wiadomość alice nie jest dostępna dla bob', async ({ page }) => {
  const plaintext = `E2E izolacja ${Date.now()}`;
  let id: string | null = null;

  try {
    id = await createMessageViaUi(page, plaintext);

    await logout(page);
    await loginAs(page, 'bob');

    const region = messagesRegion(page);
    await expect(region.locator(`li[data-message-id="${id}"]`)).toHaveCount(0);

    const listResponse = await page.request.get('/api/messages?page=0&size=50');
    expect(listResponse.ok()).toBeTruthy();
    const list = (await listResponse.json()) as { items: { id: string }[] };
    expect(list.items.map((item) => item.id)).not.toContain(id);

    const detailResponse = await page.request.get(`/api/messages/${id}`);
    expect(detailResponse.status()).toBe(404);

    await cleanupMessageAsAlice(page, id);
    id = null;
  } finally {
    if (id) {
      await cleanupMessageAsAlice(page, id);
    }
  }
});
