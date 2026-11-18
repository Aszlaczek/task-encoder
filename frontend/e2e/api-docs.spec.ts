import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const outputPath = fileURLToPath(new URL('../test-results/openapi.json', import.meta.url));

test('udostępnia dokumentację OpenAPI i Swagger UI', async ({ page }) => {
  const specResponse = await page.request.get('/api/docs');
  expect(specResponse.ok()).toBeTruthy();

  const spec = (await specResponse.json()) as {
    openapi?: string;
    info?: { title?: string };
    paths?: Record<string, unknown>;
  };
  expect(spec.openapi).toMatch(/^3\./);
  expect(spec.info?.title).toBe('Task Encoder API');
  for (const path of ['/api/auth/login', '/api/crypto/encrypt', '/api/messages']) {
    expect(spec.paths, `brak ścieżki ${path}`).toHaveProperty(path);
  }

  mkdirSync(fileURLToPath(new URL('../test-results', import.meta.url)), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(spec, null, 2));

  const uiResponse = await page.request.get('/api/docs.html');
  expect(uiResponse.ok()).toBeTruthy();
  const html = await uiResponse.text();
  expect(html).toContain('swagger-ui');
});
