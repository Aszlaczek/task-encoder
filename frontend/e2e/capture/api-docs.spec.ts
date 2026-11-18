import { expect, test } from '@playwright/test';
import { capture } from './screenshot';

test('dokumentacja API w Swagger UI', async ({ page }) => {
  await page.goto('/api/docs.html');
  await expect(page.locator('.swagger-ui').first()).toBeVisible({ timeout: 20_000 });

  await capture(page, '06-dokumentacja-api.png');
});
