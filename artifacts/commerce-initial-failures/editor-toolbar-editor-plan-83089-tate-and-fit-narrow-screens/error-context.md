# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: editor-toolbar.spec.ts >> editor plan actions share the garden bar, preserve state and fit narrow screens
- Location: e2e\editor-toolbar.spec.ts:5:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected: "http://127.0.0.1:5186/"
Received: "chrome-error://chromewebdata/"
Timeout:  10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    23 × locator resolved to <html>…</html>
       - unexpected value "chrome-error://chromewebdata/"

```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { mkdir, writeFile } from 'node:fs/promises';
  3  | import { api } from './api-url.js';
  4  | 
  5  | test('editor plan actions share the garden bar, preserve state and fit narrow screens', async ({ page, request }) => {
  6  |   const garden = await (await request.post(`${api}/gardens`, { data: { name: `E2E toolbar ${Date.now()}` } })).json();
  7  |   try {
  8  |     await page.goto(`/gardens/${garden.id}`);
  9  |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  10 |     const bar = page.locator('.document-bar');
  11 |     await expect(bar.getByRole('group', { name: '庭の計画と購入' }).getByRole('button')).toHaveCount(5);
  12 |     await expect(page.locator('.editor-shell > .plan-actions')).toHaveCount(0);
  13 |     for (const width of [1440, 1280, 1100, 1024, 768, 390, 320]) {
  14 |       await page.setViewportSize({ width, height: 960 });
  15 |       expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  16 |       const bounds = await bar.boundingBox();
  17 |       for (const button of await bar.getByRole('button').all()) {
  18 |         const item = await button.boundingBox();
  19 |         expect(item!.x).toBeGreaterThanOrEqual(bounds!.x);
  20 |         expect(item!.x + item!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1);
  21 |       }
  22 |       if (width >= 1280) expect(bounds!.height).toBeLessThanOrEqual(70);
  23 |     }
  24 |     await page.setViewportSize({ width: 1440, height: 960 });
  25 |     await bar.getByRole('button', { name: '数量・施工範囲', exact: true }).click();
  26 |     await expect(page.getByRole('dialog', { name: '配置数量・施工範囲' })).toContainText('配置したものはありません');
  27 |     await page.keyboard.press('Escape');
  28 |     await expect(bar.getByRole('button', { name: '数量・施工範囲', exact: true })).toBeFocused();
  29 |     await bar.getByRole('button', { name: '植物候補を相談', exact: true }).click();
  30 |     await page.getByRole('combobox', { name: '日照', exact: true }).selectOption('半日陰');
  31 |     await page.getByRole('button', { name: '候補を確認', exact: true }).click();
  32 |     await expect(page.getByRole('dialog')).toContainText('アオキ・ヤブラン');
  33 |     await page.keyboard.press('Escape');
  34 |     await page.getByRole('button', { name: '上から見る', exact: true }).click();
  35 |     await page.getByTestId('asset-tree_oak').click();
  36 |     const canvas = await page.locator('[data-testid="garden-canvas"] canvas').boundingBox();
  37 |     await page.mouse.click(canvas!.x + canvas!.width / 2, canvas!.y + canvas!.height / 2);
  38 |     await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  39 |     await page.keyboard.press('Escape');
  40 |     await bar.getByRole('button', { name: '数量・施工範囲', exact: true }).click();
  41 |     await page.getByLabel('木の配置個数').fill('2');
  42 |     await expect(page.getByLabel('木の配置個数')).toHaveValue('2');
  43 |     await page.keyboard.press('Escape');
  44 |     await bar.getByRole('button', { name: '配置したものから商品を探す', exact: true }).click();
  45 |     await expect(page.getByRole('dialog', { name: '変更を保存して進みますか？' })).toBeVisible();
  46 |     await page.getByRole('button', { name: '取消', exact: true }).click();
  47 |     await expect(page).toHaveURL(new RegExp(`/gardens/${garden.id}$`));
  48 |     await bar.getByTestId('save-garden').click();
  49 |     await expect(bar.getByTestId('save-status')).toHaveText('保存済み');
  50 |     await page.reload();
  51 |     await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  52 |     const saved = await (await request.get(`${api}/gardens/${garden.id}`)).json();
  53 |     expect(saved.objects).toHaveLength(2);
  54 |     await mkdir('artifacts/e2e', { recursive: true });
  55 |     await writeFile('artifacts/e2e/editor-toolbar-reloaded.json', JSON.stringify(saved, null, 2));
  56 |     await page.screenshot({ path: 'artifacts/e2e/editor-toolbar-reloaded.png' });
  57 |     await bar.getByRole('button', { name: '完成イメージを確認', exact: true }).click();
  58 |     await expect(page.getByRole('dialog', { name: '庭の完成イメージ' }).locator('img')).toBeVisible();
  59 |     await page.keyboard.press('Escape');
  60 |     await bar.getByRole('button', { name: 'ECへ戻る', exact: true }).click();
> 61 |     await expect(page).toHaveURL('http://127.0.0.1:5186/');
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  62 |   } finally {
  63 |     expect((await request.delete(`${api}/gardens/${garden.id}`)).status()).toBe(204);
  64 |   }
  65 | });
  66 | 
```