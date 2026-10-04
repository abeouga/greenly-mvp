# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: polygon-edges.spec.ts >> R. 6辺の写真輪郭を直接編集・閉じ辺・自己交差拒否・保存復元
- Location: e2e\polygon-edges.spec.ts:10:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('button', { name: '写真のカメラを設定' })
Expected: focused
Received: inactive
Timeout:  10000ms

Call log:
  - Expect "toBeFocused" getByRole('button', { name: '写真のカメラを設定' }) with timeout 10000ms
  - waiting for getByRole('button', { name: '写真のカメラを設定' })
    24 × locator resolved to <button type="button" class="text-button" aria-haspopup="dialog">…</button>
       - unexpected value "inactive"

```

```yaml
- button "写真のカメラを設定"
```

# Test source

```ts
  1  | import { mkdir, writeFile } from 'node:fs/promises';
  2  | import { resolve } from 'node:path';
  3  | import { expect, test } from '@playwright/test';
  4  | import type { GardenDocument } from '../frontend/src/types/garden.js';
  5  | 
  6  | const api = 'http://127.0.0.1:18080/api';
  7  | const directory = resolve('artifacts/e2e');
  8  | const boundary = [{ x: .2, y: .8 }, { x: .8, y: .8 }, { x: .8, y: .5 }, { x: .55, y: .5 }, { x: .55, y: .2 }, { x: .2, y: .2 }];
  9  | 
  10 | test('R. 6辺の写真輪郭を直接編集・閉じ辺・自己交差拒否・保存復元', async ({ page, request }) => {
  11 |   await mkdir(directory, { recursive: true });
  12 |   const initial = await (await request.post(`${api}/gardens`, { data: { name: `E2E polygon edges ${Date.now()}` } })).json() as GardenDocument;
  13 |   try {
  14 |     await page.goto(`/gardens/${initial.id}`);
  15 |     const dataUrl = await page.evaluate(() => {
  16 |       const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 750;
  17 |       const ctx = canvas.getContext('2d')!;
  18 |       ctx.fillStyle = '#a3af93'; ctx.fillRect(0, 0, 1000, 750);
  19 |       ctx.fillStyle = '#d9d6c8'; ctx.fillRect(500, 80, 350, 250);
  20 |       ctx.fillStyle = '#68765b'; ctx.fillRect(60, 70, 100, 610);
  21 |       ctx.fillStyle = '#e6e1d2'; ctx.font = '22px sans-serif'; ctx.fillText('POLYGON / SYNTHETIC IMAGE', 200, 80);
  22 |       return canvas.toDataURL('image/png');
  23 |     });
  24 |     const photo = { dataUrl, imageWidth: 1000, imageHeight: 750, boundary,
  25 |       corners: [{ x: .2, y: .8 }, { x: .8, y: .8 }, { x: .8, y: .2 }, { x: .2, y: .2 }] };
  26 |     expect((await request.put(`${api}/gardens/${initial.id}`, { data: { ...initial, photo } })).status()).toBe(200);
  27 |     await page.reload();
  28 |     await expect(page.getByTestId('photo-edge-5')).toBeVisible();
  29 |     await expect(page.locator('#properties-panel').getByText('土台の辺の長さ')).toHaveCount(0);
  30 |     // An edge beyond the original mapping rectangle must remain editable in metres.
  31 |     await page.getByTestId('photo-edge-0').click();
  32 |     await expect(page.getByRole('dialog', { name: '選択した辺の長さ' })).toBeVisible();
  33 |     await page.getByLabel('長さ (m)', { exact: true }).fill('12');
  34 |     await page.getByRole('button', { name: '長さを適用' }).click();
  35 |     await page.getByTestId('photo-edge-0').click();
  36 |     await expect(page.getByLabel('長さ (m)', { exact: true })).toHaveValue('12.00');
  37 |     await page.getByRole('button', { name: '辺の編集を閉じる' }).click();
  38 |     await page.getByTestId('photo-edge-5').click();
  39 |     await page.getByLabel('長さ (m)', { exact: true }).fill('6');
  40 |     await page.getByRole('button', { name: '長さを適用' }).click();
  41 |     await page.getByTestId('save-garden').click();
  42 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  43 |     const saved = await (await request.get(`${api}/gardens/${initial.id}`)).json() as GardenDocument;
  44 |     expect(saved.photo!.boundary).toHaveLength(6);
  45 |     expect(saved.photo!.projectionSize).toEqual({ width: 10, depth: 8 });
  46 |     expect(saved.width).toBeCloseTo(14, 2);
  47 |     expect(saved.photo!.boundary[1].x).toBeCloseTo(.92, 5);
  48 |     expect(saved.photo!.boundary[0].y).toBeCloseTo(.65, 5);
  49 |     expect(saved.photo!.boundary.slice(2)).toEqual(boundary.slice(2));
  50 |     await page.reload();
  51 |     await page.getByTestId('photo-edge-5').click();
  52 |     await expect(page.getByLabel('長さ (m)', { exact: true })).toHaveValue('6.00');
  53 |     await page.getByLabel('長さ (m)', { exact: true }).fill('70');
  54 |     await expect(page.getByRole('button', { name: '長さを適用' })).toBeDisabled();
  55 |     await expect(page.getByRole('alert')).toContainText('写真の外');
  56 |     await page.getByRole('button', { name: '取消', exact: true }).click();
  57 |     await page.getByTestId('photo-edge-2').click();
  58 |     await page.getByLabel('長さ (m)', { exact: true }).fill('11');
  59 |     await expect(page.getByRole('alert')).toContainText('交差');
  60 |     await expect(page.getByRole('button', { name: '長さを適用' })).toBeDisabled();
  61 |     await page.getByRole('button', { name: '取消', exact: true }).click();
  62 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  63 |     expect(await (await request.get(`${api}/gardens/${initial.id}`)).json()).toEqual(saved);
  64 |     await page.getByTestId('photo-edge-4').click();
  65 |     await page.screenshot({ path: resolve(directory, 'polygon-edge-editor.png'), fullPage: true });
  66 |     await writeFile(resolve(directory, 'polygon-edges.json'), JSON.stringify(saved, null, 2));
  67 |     await page.setViewportSize({ width: 1024, height: 768 });
  68 |     const popup = page.getByRole('dialog', { name: '選択した辺の長さ' });
  69 |     await expect.poll(async () => {
  70 |       const box = (await popup.boundingBox())!, stage = (await page.locator('.photo-stage-shell').boundingBox())!;
  71 |       return box.x >= stage.x && box.y >= stage.y && box.x + box.width <= stage.x + stage.width && box.y + box.height <= stage.y + stage.height;
  72 |     }).toBe(true);
  73 |     await page.screenshot({ path: resolve(directory, 'workspace-edge-1024.png'), fullPage: true });
  74 |     await page.keyboard.press('Escape');
  75 |     await expect(page.getByTestId('photo-edge-4')).toBeFocused();
  76 |     await expect(popup).toHaveCount(0);
  77 |     const camera = page.getByRole('button', { name: '写真のカメラを設定' });
  78 |     await camera.click();
  79 |     await expect(page.getByRole('dialog', { name: '写真のカメラを合わせる' })).toBeVisible();
  80 |     await page.getByLabel('基準の幅（m）').fill('3');
  81 |     await page.screenshot({ path: resolve(directory, 'workspace-camera-dialog.png'), fullPage: true });
  82 |     await page.keyboard.press('Escape');
> 83 |     await expect(camera).toBeFocused();
     |                          ^ Error: expect(locator).toBeFocused() failed
  84 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  85 |     expect(await (await request.get(`${api}/gardens/${initial.id}`)).json()).toEqual(saved);
  86 |     await page.setViewportSize({ width: 1440, height: 960 });
  87 |     await page.getByRole('button', { name: '3D庭', exact: true }).click();
  88 |     await expect(page.getByTestId('garden-canvas')).toBeVisible();
  89 |     await page.screenshot({ path: resolve(directory, 'polygon-edges-3d.png'), fullPage: true });
  90 |   } finally { expect((await request.delete(`${api}/gardens/${initial.id}`)).status()).toBe(204); }
  91 | });
  92 | 
```