# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: site-header.spec.ts >> 共通ヘッダー・ECへの移動確認・未保存の変更保護
- Location: e2e\site-header.spec.ts:5:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('save-status')
Expected: "未保存の変更"
Received: "保存"
Timeout:  10000ms

Call log:
  - Expect "toHaveText" getByTestId('save-status') with timeout 10000ms
  - waiting for getByTestId('save-status')
    23 × locator resolved to <span aria-live="polite" data-testid="save-status">保存</span>
       - unexpected value "保存"

```

```yaml
- text: 保存
```

# Test source

```ts
  1  | import { mkdir, writeFile } from 'node:fs/promises';
  2  | import { expect, test } from '@playwright/test';
  3  | import { api } from './api-url.js';
  4  | 
  5  | test('共通ヘッダー・ECへの移動確認・未保存の変更保護', async ({ page, request }) => {
  6  |   const response = await request.post(`${api}/gardens`, { data: { name: `E2E header ${Date.now()}` } });
  7  |   expect(response.ok()).toBe(true);
  8  |   const garden = await response.json();
  9  |   try {
  10 |     await page.goto(`/gardens/${garden.id}`);
  11 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  12 |     const header = page.locator('.kusakari-site-header');
  13 |     await expect(header.locator('.kusakari-feature-name')).toHaveCount(0);
  14 |     await expect(header.getByRole('link', { name: 'Canvas', exact: true })).toBeVisible();
  15 |     await expect(header.getByRole('link', { name: '出店者', exact: true })).toHaveAttribute('href', /\/seller$/);
  16 |     await expect(header.getByRole('link', { name: '注文履歴' })).toHaveAttribute('href', /\?panel=orders$/);
  17 |     await expect(header.getByRole('link', { name: 'ログイン', exact: true })).toHaveAttribute('href', /\?panel=login$/);
  18 |     await expect(header.getByRole('link', { name: /^ECでカートを確認/ })).toHaveAttribute('href', /\/cart$/);
  19 |     await expect(page.locator('.announcement')).toContainText('ひと鉢からはじまる、緑のある暮らし。');
  20 | 
  21 |     await page.getByRole('button', { name: '土台設定', exact: true }).click();
  22 |     await page.getByLabel('幅 (m)', { exact: true }).fill('11');
  23 |     await page.getByRole('button', { name: '土台に適用', exact: true }).click();
  24 |     await page.getByRole('button', { name: '土台設定を閉じる', exact: true }).click();
> 25 |     await expect(page.getByTestId('save-garden')).toBeEnabled();
     |                                                   ^ Error: expect(locator).toHaveText(expected) failed
  26 |     await header.getByRole('link', { name: /^ECでカートを確認/ }).click();
  27 |     await expect(page.getByRole('dialog', { name: '変更を保存せずに戻りますか？' })).toBeVisible();
  28 |     await page.getByRole('button', { name: '編集を続ける', exact: true }).click();
  29 |     await expect(page).toHaveURL(new RegExp(`/gardens/${garden.id}$`));
  30 |     await page.getByTestId('save-garden').click();
  31 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  32 |     await page.reload();
  33 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  34 |     const saved = await (await request.get(`${api}/gardens/${garden.id}`)).json();
  35 |     expect(saved.width).toBe(11);
  36 |     await mkdir('artifacts/e2e', { recursive: true });
  37 |     await writeFile('artifacts/e2e/site-header-garden.json', JSON.stringify(saved, null, 2));
  38 |     await page.screenshot({ path: 'artifacts/e2e/site-header-editor-e2e.png' });
  39 |     await page.setViewportSize({ width: 390, height: 844 });
  40 |     await expect(header.getByRole('link', { name: /^ECでカートを確認/ })).toBeVisible();
  41 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  42 |     await page.screenshot({ path: 'artifacts/e2e/site-header-mobile-e2e.png', fullPage: true });
  43 |     await page.goto('/');
  44 |     await expect(page.getByRole('heading', { name: '保存した庭', exact: true })).toBeVisible();
  45 |     await expect(page.getByText('庭のワークスペース', { exact: true })).toHaveCount(0);
  46 |     await expect(page.getByText('マイガーデン', { exact: true })).toHaveCount(0);
  47 |     await expect(page.getByText('写真と3Dで、庭の形や植栽の配置を編集します。', { exact: true })).toHaveCount(0);
  48 |     await expect(page.locator('.page-footer')).toHaveText(`kusakari ${new Date().getFullYear()}`);
  49 |     for (const width of [320, 390, 768, 1280, 1600]) {
  50 |       await page.setViewportSize({ width, height: 960 });
  51 |       const layout = await page.locator('.page-shell').boundingBox();
  52 |       const headerBox = await header.boundingBox();
  53 |       expect(layout!.width).toBeLessThanOrEqual(1360);
  54 |       expect(Math.abs(layout!.x + layout!.width / 2 - headerBox!.x - headerBox!.width / 2)).toBeLessThan(1);
  55 |       expect(await page.locator('.page-footer').evaluate((element) => getComputedStyle(element).justifyContent)).toBe('center');
  56 |       expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  57 |     }
  58 |     await page.screenshot({ path: 'artifacts/e2e/site-header-list-e2e.png', fullPage: true });
  59 |   } finally {
  60 |     await request.delete(`${api}/gardens/${garden.id}`);
  61 |   }
  62 | });
  63 | 
```