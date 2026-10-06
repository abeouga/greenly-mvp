# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace-ux.spec.ts >> S. 作業面・独立開閉・ダイアログのフォーカス・未保存確認
- Location: e2e\workspace-ux.spec.ts:8:1

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 1000
Received:   1000
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - button "Greenly 庭一覧へ" [ref=e5] [cursor=pointer]:
      - generic [ref=e8]: Greenly
    - button "← 庭一覧" [ref=e9] [cursor=pointer]
    - generic [ref=e12]:
      - heading "E2E workspace 1790943682563" [level=1] [ref=e13]
      - generic [ref=e14]: 10 × 8 m
    - generic [ref=e15]: 保存済み
    - button "保存" [disabled] [ref=e18]
  - main [ref=e19]:
    - region "庭の3D編集エリア" [ref=e20]:
      - generic [ref=e21]:
        - group "表示モード" [ref=e22]:
          - button "写真＋設計" [ref=e23] [cursor=pointer]
          - button "3D庭" [pressed] [ref=e26] [cursor=pointer]
        - generic [ref=e29]:
          - button "土台設定" [ref=e30] [cursor=pointer]
          - button "上から見る" [ref=e33] [cursor=pointer]
          - button "初期視点" [ref=e36] [cursor=pointer]
          - button "配置済み・プロパティパネルを表示" [active] [ref=e39] [cursor=pointer]:
            - generic [ref=e42]: 配置・編集
      - generic [ref=e43]:
        - generic [aria-hidden]: "N"
      - generic [ref=e47]:
        - generic [ref=e48]: オブジェクトを選択して編集
        - generic [ref=e49]: "読み込み済み: 0 / 0"
        - generic [ref=e50]: 1目盛り = 1m
    - complementary "素材カタログ" [ref=e51]:
      - generic [ref=e52]:
        - heading "素材を追加" [level=2] [ref=e53]
        - generic [ref=e56]: 素材を選び、庭をクリックして配置
        - button "オブジェクトパネルを表示" [ref=e57] [cursor=pointer]: 開く
```

# Test source

```ts
  1  | import { mkdir, writeFile } from 'node:fs/promises';
  2  | import { resolve } from 'node:path';
  3  | import { expect, test } from '@playwright/test';
  4  | import type { GardenDocument } from '../frontend/src/types/garden.js';
  5  | 
  6  | const api = 'http://127.0.0.1:18080/api';
  7  | 
  8  | test('S. 作業面・独立開閉・ダイアログのフォーカス・未保存確認', async ({ page, request }) => {
  9  |   const created = await (await request.post(`${api}/gardens`, { data: { name: `E2E workspace ${Date.now()}` } })).json() as GardenDocument;
  10 |   try {
  11 |     await page.setViewportSize({ width: 1280, height: 800 });
  12 |     await page.goto(`/gardens/${created.id}`);
  13 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  14 |     const canvas = page.locator('[data-testid="garden-canvas"] canvas');
  15 |     const initialBox = (await canvas.boundingBox())!;
  16 |     await page.getByRole('button', { name: 'オブジェクトパネルを隠す', exact: true }).click();
  17 |     await expect(page.getByTestId('asset-tree_oak')).toBeHidden();
  18 |     await expect(page.locator('#properties-panel')).toBeVisible();
  19 |     expect((await canvas.boundingBox())!.height).toBeGreaterThan(initialBox.height);
  20 |     await page.getByRole('button', { name: '配置済み・プロパティパネルを隠す', exact: true }).click();
  21 |     await expect(page.locator('#properties-panel')).toHaveCount(0);
> 22 |     expect((await canvas.boundingBox())!.width).toBeGreaterThan(initialBox.width);
     |                                                 ^ Error: expect(received).toBeGreaterThan(expected)
  23 |     await page.getByRole('button', { name: 'オブジェクトパネルを表示', exact: true }).click();
  24 |     await expect(page.getByTestId('asset-tree_oak')).toBeVisible();
  25 |     await expect(page.locator('#properties-panel')).toHaveCount(0);
  26 |     await page.getByRole('button', { name: '配置済み・プロパティパネルを表示', exact: true }).click();
  27 |     await expect(page.locator('#properties-panel')).toBeVisible();
  28 |     expect((await canvas.boundingBox())!.width).toBe(initialBox.width);
  29 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  30 | 
  31 |     await page.getByRole('button', { name: '上から見る' }).click();
  32 |     await page.getByTestId('asset-tree_oak').click();
  33 |     const box = (await canvas.boundingBox())!;
  34 |     await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  35 |     await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  36 |     await page.keyboard.press('Escape');
  37 |     await expect(page.getByTestId('asset-tree_oak')).toHaveAttribute('aria-pressed', 'false');
  38 |     await page.getByTestId('save-garden').click();
  39 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  40 |     const saved = await (await request.get(`${api}/gardens/${created.id}`)).json() as GardenDocument;
  41 |     await page.reload();
  42 |     await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  43 |     expect(await (await request.get(`${api}/gardens/${created.id}`)).json()).toEqual(saved);
  44 |     await mkdir(resolve('artifacts/e2e'), { recursive: true });
  45 |     await writeFile(resolve('artifacts/e2e/workspace-reloaded.json'), JSON.stringify(saved, null, 2));
  46 |     await page.screenshot({ path: resolve('artifacts/e2e/workspace-reloaded.png'), fullPage: true });
  47 | 
  48 |     const dimensions = page.getByRole('button', { name: '土台設定', exact: true });
  49 |     await dimensions.click();
  50 |     await expect(page.getByLabel('幅 (m)', { exact: true })).toBeFocused();
  51 |     await page.getByLabel('幅 (m)', { exact: true }).fill('11');
  52 |     // The browser focus trap must contain keyboard navigation in the modal.
  53 |     for (let i = 0; i < 9; i++) {
  54 |       await page.keyboard.press('Tab');
  55 |       expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true);
  56 |     }
  57 |     await page.keyboard.press('Escape');
  58 |     await expect(page.getByRole('dialog')).toHaveCount(0);
  59 |     await expect(dimensions).toBeFocused();
  60 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  61 | 
  62 |     await page.getByTestId('position-x').fill('1.7');
  63 |     const back = page.getByRole('button', { name: 'Greenly 庭一覧へ', exact: true });
  64 |     await back.click();
  65 |     await expect(page.getByRole('dialog', { name: '変更を保存せずに戻りますか？' })).toBeVisible();
  66 |     await expect(page.getByRole('button', { name: '編集を続ける' })).toBeFocused();
  67 |     await page.keyboard.press('Delete');
  68 |     await page.keyboard.press('Escape');
  69 |     await expect(back).toBeFocused();
  70 |     await expect(page.getByTestId('object-row-0')).toBeVisible();
  71 |     await expect(page.getByTestId('position-x')).toHaveValue('1.7');
  72 |     let unexpectedDialogs = 0;
  73 |     page.on('dialog', async (dialog) => { unexpectedDialogs++; await dialog.dismiss(); });
  74 |     await back.click();
  75 |     await page.getByRole('button', { name: '変更を破棄して戻る' }).click();
  76 |     await page.waitForURL('/');
  77 |     expect(unexpectedDialogs).toBe(0);
  78 |     expect(await (await request.get(`${api}/gardens/${created.id}`)).json()).toEqual(saved);
  79 | 
  80 |     const deletion = page.getByRole('button', { name: `${created.name}を削除`, exact: true });
  81 |     await deletion.click();
  82 |     await expect(page.getByRole('button', { name: '取消', exact: true })).toBeFocused();
  83 |     await page.screenshot({ path: resolve('artifacts/e2e/workspace-delete-dialog.png'), fullPage: true });
  84 |     await page.keyboard.press('Escape');
  85 |     await expect(deletion).toBeFocused();
  86 |     expect((await request.get(`${api}/gardens/${created.id}`)).status()).toBe(200);
  87 |     await page.screenshot({ path: resolve('artifacts/e2e/workspace-projects.png'), fullPage: true });
  88 |   } finally { expect((await request.delete(`${api}/gardens/${created.id}`)).status()).toBe(204); }
  89 | });
  90 | 
```