# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: polygon-edges.spec.ts >> R. 6辺の写真輪郭を直接編集・閉じ辺・自己交差拒否・保存復元
- Location: e2e\polygon-edges.spec.ts:10:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByTestId('photo-edge-5')
Expected: visible
Received: hidden
Timeout:  10000ms

Call log:
  - Expect "toBeVisible" getByTestId('photo-edge-5') with timeout 10000ms
  - waiting for getByTestId('photo-edge-5')
    24 × locator resolved to <line x1="200" y1="150" x2="200" y2="600" tabindex="0" role="button" class="edge-hit" aria-pressed="false" aria-label="辺6の長さを編集" aria-disabled="false" data-testid="photo-edge-5" vector-effect="non-scaling-stroke"></line>
       - unexpected value "hidden"

```

```yaml
- banner:
  - link "Greenly 庭一覧へ":
    - /url: /
    - text: Greenly
  - heading "E2E polygon edges 1790941360059" [level=1]
  - paragraph: 10 × 8 m · 中心原点 · 1目盛り = 1m
- button "← 庭一覧"
- text: 保存済み
- button "保存" [disabled]
- main:
  - complementary:
    - button "オブジェクトパネルを隠す" [expanded]
    - heading "カタログ" [level=2]
    - button "ベンチ 家具 1.6 × 0.85 × 0.65 m":
      - strong: ベンチ
      - text: 家具 1.6 × 0.85 × 0.65 m
    - button "レンガ 舗装 0.6 × 0.15 × 0.2 m":
      - strong: レンガ
      - text: 舗装 0.6 × 0.15 × 0.2 m
    - button "低木 植物 1.2 × 1.2 × 1.2 m":
      - strong: 低木
      - text: 植物 1.2 × 1.2 × 1.2 m
    - button "木 植物 2 × 4 × 2 m":
      - strong: 木
      - text: 植物 2 × 4 × 2 m
    - paragraph: 開発用の簡易GLBモデルです。
  - region "庭の3D編集エリア":
    - button "写真＋設計" [pressed]
    - button "3D庭"
    - button "写真のカメラを設定"
    - button "写真を外す"
    - button "庭の領域を書き直す"
    - checkbox "地面" [checked]
    - text: 地面
    - checkbox "グリッド" [checked]
    - text: グリッド
    - checkbox "配置" [checked]
    - text: 配置
    - paragraph: カメラ未設定：現在の表示は概算です。「写真のカメラを設定」で奥行きと木の大きさを合わせてください。
    - paragraph: 辺をクリックして長さを編集。頂点をドラッグして輪郭を調整できます。木の配置は左のカタログから選択してください。
    - img:
      - button "辺1の長さを編集"
      - text: 10.00 m
      - button "辺2の長さを編集"
      - text: 4.00 m
      - button "辺3の長さを編集"
      - text: 4.17 m
      - button "辺4の長さを編集"
      - text: 4.00 m
      - button "辺5の長さを編集"
      - text: 5.83 m
      - button "辺6の長さを編集"
      - text: 8.00 m
    - text: "単位：m 読み込み済み: 0 / 0 配置数 0 / 200"
  - complementary:
    - button "配置済み・プロパティパネルを隠す" [expanded]
    - heading "配置済み" [level=2]
    - text: 0 / 200
    - paragraph: カタログから種類を選び、地面をクリックしてください。
    - heading "プロパティ" [level=2]
    - paragraph: オブジェクトを選択すると編集できます。
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
> 28 |     await expect(page.getByTestId('photo-edge-5')).toBeVisible();
     |                                                    ^ Error: expect(locator).toBeVisible() failed
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
  57 |     await page.getByTestId('photo-edge-1').click();
  58 |     await page.getByLabel('長さ (m)', { exact: true }).fill('8');
  59 |     await expect(page.getByRole('alert')).toContainText('交差');
  60 |     await expect(page.getByRole('button', { name: '長さを適用' })).toBeDisabled();
  61 |     await page.getByRole('button', { name: '取消', exact: true }).click();
  62 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  63 |     expect(await (await request.get(`${api}/gardens/${initial.id}`)).json()).toEqual(saved);
  64 |     await page.getByTestId('photo-edge-4').click();
  65 |     await page.screenshot({ path: resolve(directory, 'polygon-edge-editor.png'), fullPage: true });
  66 |     await writeFile(resolve(directory, 'polygon-edges.json'), JSON.stringify(saved, null, 2));
  67 |     await page.getByRole('button', { name: '取消', exact: true }).click();
  68 |     await page.getByRole('button', { name: '3D庭', exact: true }).click();
  69 |     await expect(page.getByTestId('garden-canvas')).toBeVisible();
  70 |     await page.screenshot({ path: resolve(directory, 'polygon-edges-3d.png'), fullPage: true });
  71 |   } finally { expect((await request.delete(`${api}/gardens/${initial.id}`)).status()).toBe(204); }
  72 | });
  73 | 
```