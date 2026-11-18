import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Osobny przebieg generujący zrzuty ekranu do artefaktów CI.
 * Nie nadpisuje raportu HTML z głównego zestawu E2E.
 */
export default defineConfig({
  ...baseConfig,
  testDir: './e2e/capture',
  testIgnore: [],
  outputDir: './test-results/screenshots',
  reporter: [['list']],
  use: {
    ...baseConfig.use,
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
});
