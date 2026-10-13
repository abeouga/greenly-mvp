import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ headless: false });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const errors = [];
  const apiResponses = [];
  const failures = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failures.push({ url: request.url(), error: request.failure() }));
  page.on('response', (response) => {
    if (response.url().includes('/api/')) apiResponses.push({ url: response.url(), status: response.status() });
  });
  await page.goto('http://127.0.0.1:5173/');
  await expect(page.getByRole('heading', { name: '保存した庭', exact: true })).toBeVisible();
  for (let count = 0; count < 3; count += 1) {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '保存した庭', exact: true })).toBeVisible();
  }
  const response = await page.request.get('http://127.0.0.1:5173/api/gardens');
  expect(response.status()).toBe(200);
  const gardens = await response.json();
  await page.screenshot({ path: 'artifacts/e2e/api-recovery-list.png', fullPage: true });
  const oakId = '35f733b6-1944-482f-824e-cefc33ea7d8e';
  const oak = gardens.find((garden) => garden.id === oakId);
  if (oak) {
    await page.goto(`http://127.0.0.1:5173/gardens/${oakId}`);
    await expect(page.getByTestId('save-status')).toHaveText('保存済み');
    await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
    await page.screenshot({ path: 'artifacts/e2e/api-recovery-editor.png' });
  }
  expect(apiResponses.filter((entry) => entry.status >= 400)).toEqual([]);
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
  await writeFile('artifacts/e2e/api-recovery-browser.json', JSON.stringify({ gardenCount: gardens.length, reloads: 3, oakEditorChecked: Boolean(oak), apiResponses, errors, failures }, null, 2));
  console.log(JSON.stringify({ gardenCount: gardens.length, reloads: 3, oakEditorChecked: Boolean(oak), apiErrors: 0, scriptErrors: errors, failedRequests: failures }));
} finally {
  await browser.close();
}
