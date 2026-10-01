import { defineConfig, devices } from '@playwright/test';

const e2eApiUrl = 'http://127.0.0.1:18080';
const e2eWebUrl = 'http://127.0.0.1:15174';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/playwright-report', open: 'never' }],
  ],
  outputDir: 'artifacts/playwright-results',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 960 },
    baseURL: e2eWebUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev:api',
      url: `${e2eApiUrl}/api/assets`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { GREENLY_PROFILE: 'e2e', GREENLY_HOST: '127.0.0.1', GREENLY_PORT: '18080' },
    },
    {
      command: 'npm run dev:web:e2e',
      url: e2eWebUrl,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { GREENLY_API_TARGET: e2eApiUrl },
    },
  ],
});
