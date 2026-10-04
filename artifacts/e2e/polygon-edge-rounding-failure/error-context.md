# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: polygon-edges.spec.ts >> R. 6辺の写真輪郭を直接編集・閉じ辺・自己交差拒否・保存復元
- Location: e2e\polygon-edges.spec.ts:10:1

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 14
Received: 14.1

Expected precision:    2
Expected difference: < 0.005
Received difference:   0.09999999999999964
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - link "Greenly 庭一覧へ" [ref=f1e5] [cursor=pointer]:
      - /url: /
      - generic [aria-hidden] [ref=f1e6]: G
      - generic [ref=f1e7]: Greenly
    - generic [ref=f1e8]:
      - heading "E2E polygon edges 1790941420323" [level=1] [ref=f1e9]
      - paragraph [ref=f1e10]: 14.1 × 8 m · 中心原点 · 1目盛り = 1m
  - generic [ref=f1e11]:
    - button "← 庭一覧" [ref=f1e12] [cursor=pointer]
    - generic [ref=f1e13]: 保存済み
    - button "保存" [disabled] [ref=f1e16]
  - main [ref=f1e17]:
    - complementary [ref=f1e18]:
      - button "オブジェクトパネルを隠す" [expanded] [ref=f1e20] [cursor=pointer]:
        - generic [aria-hidden] [ref=f1e21]: ‹
      - generic [ref=f1e22]:
        - heading "カタログ" [level=2] [ref=f1e24]
        - generic [ref=f1e25]:
          - button "ベンチ 家具 1.6 × 0.85 × 0.65 m" [ref=f1e26] [cursor=pointer]:
            - generic [ref=f1e28]:
              - strong [ref=f1e29]: ベンチ
              - generic [ref=f1e30]: 家具
              - generic [ref=f1e31]: 1.6 × 0.85 × 0.65 m
          - button "レンガ 舗装 0.6 × 0.15 × 0.2 m" [ref=f1e32] [cursor=pointer]:
            - generic [ref=f1e34]:
              - strong [ref=f1e35]: レンガ
              - generic [ref=f1e36]: 舗装
              - generic [ref=f1e37]: 0.6 × 0.15 × 0.2 m
          - button "低木 植物 1.2 × 1.2 × 1.2 m" [ref=f1e38] [cursor=pointer]:
            - generic [ref=f1e40]:
              - strong [ref=f1e41]: 低木
              - generic [ref=f1e42]: 植物
              - generic [ref=f1e43]: 1.2 × 1.2 × 1.2 m
          - button "木 植物 2 × 4 × 2 m" [ref=f1e44] [cursor=pointer]:
            - generic [ref=f1e46]:
              - strong [ref=f1e47]: 木
              - generic [ref=f1e48]: 植物
              - generic [ref=f1e49]: 2 × 4 × 2 m
        - paragraph [ref=f1e50]: 開発用の簡易GLBモデルです。
    - region "庭の3D編集エリア" [ref=f1e51]:
      - generic [ref=f1e53]:
        - button "写真＋設計" [pressed] [ref=f1e54] [cursor=pointer]
        - button "3D庭" [ref=f1e55] [cursor=pointer]
      - generic [ref=f1e56]:
        - generic [ref=f1e57]:
          - button "写真のカメラを設定" [ref=f1e58] [cursor=pointer]
          - button "写真を外す" [ref=f1e59] [cursor=pointer]
          - button "庭の領域を書き直す" [ref=f1e60] [cursor=pointer]
          - generic [ref=f1e61]:
            - generic [ref=f1e62] [cursor=pointer]:
              - checkbox "地面" [checked] [ref=f1e63]
              - text: 地面
            - generic [ref=f1e64] [cursor=pointer]:
              - checkbox "グリッド" [checked] [ref=f1e65]
              - text: グリッド
            - generic [ref=f1e66] [cursor=pointer]:
              - checkbox "配置" [checked] [ref=f1e67]
              - text: 配置
        - paragraph [ref=f1e68]: カメラ未設定：現在の表示は概算です。「写真のカメラを設定」で奥行きと木の大きさを合わせてください。
        - paragraph [ref=f1e69]: 辺をクリックして長さを編集。頂点をドラッグして輪郭を調整できます。木の配置は左のカタログから選択してください。
        - img [ref=f1e71]:
          - generic [ref=f1e80]:
            - generic [ref=f1e81]:
              - button "辺1の長さを編集" [ref=f1e82] [cursor=pointer]
              - generic: 12.17 m
            - generic [ref=f1e83]:
              - button "辺2の長さを編集" [ref=f1e84] [cursor=pointer]
              - generic: 4.47 m
            - generic [ref=f1e85]:
              - button "辺3の長さを編集" [ref=f1e86] [cursor=pointer]
              - generic: 4.17 m
            - generic [ref=f1e87]:
              - button "辺4の長さを編集" [ref=f1e88] [cursor=pointer]
              - generic: 4.00 m
            - generic [ref=f1e89]:
              - button "辺5の長さを編集" [ref=f1e90] [cursor=pointer]
              - generic: 5.83 m
            - generic [ref=f1e91]:
              - button "辺6の長さを編集" [ref=f1e92] [cursor=pointer]
              - generic: 6.00 m
      - generic [ref=f1e105]:
        - generic [ref=f1e106]: 単位：m
        - generic [ref=f1e107]: "読み込み済み: 0 / 0"
        - generic [ref=f1e108]: 配置数 0 / 200
    - complementary [ref=f1e109]:
      - button "配置済み・プロパティパネルを隠す" [expanded] [ref=f1e111] [cursor=pointer]:
        - generic [aria-hidden] [ref=f1e112]: ›
      - generic [ref=f1e113]:
        - generic [ref=f1e114]:
          - generic [ref=f1e115]:
            - heading "配置済み" [level=2] [ref=f1e117]
            - generic [ref=f1e118]: 0 / 200
          - paragraph [ref=f1e119]: カタログから種類を選び、地面をクリックしてください。
        - generic [ref=f1e120]:
          - heading "プロパティ" [level=2] [ref=f1e122]
          - paragraph [ref=f1e123]: オブジェクトを選択すると編集できます。
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
> 46 |     expect(saved.width).toBeCloseTo(14, 2);
     |                         ^ Error: expect(received).toBeCloseTo(expected, precision)
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
  67 |     await page.getByRole('button', { name: '取消', exact: true }).click();
  68 |     await page.getByRole('button', { name: '3D庭', exact: true }).click();
  69 |     await expect(page.getByTestId('garden-canvas')).toBeVisible();
  70 |     await page.screenshot({ path: resolve(directory, 'polygon-edges-3d.png'), fullPage: true });
  71 |   } finally { expect((await request.delete(`${api}/gardens/${initial.id}`)).status()).toBe(204); }
  72 | });
  73 | 
```