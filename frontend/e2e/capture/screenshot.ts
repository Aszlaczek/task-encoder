import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

const outputDir = fileURLToPath(new URL('../../test-results/screenshots', import.meta.url));

/** Zapisuje deterministycznie nazwany zrzut całej strony do katalogu artefaktów. */
export async function capture(page: Page, name: string): Promise<void> {
  mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: true });
}
