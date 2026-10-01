# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: greenly.spec.ts >> A. 庭作成からGLB配置・変形・保存・再読み込みまで
- Location: e2e\greenly.spec.ts:57:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.garden-card').filter({ hasText: 'E2E roundtrip 1790868092801' }).locator('.garden-card-open')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.garden-card').filter({ hasText: 'E2E roundtrip 1790868092801' }).locator('.garden-card-open') with timeout 10000ms
  - waiting for locator('.garden-card').filter({ hasText: 'E2E roundtrip 1790868092801' }).locator('.garden-card-open')

```

```yaml
- banner:
  - link "Greenly 庭一覧へ":
    - /url: /
    - text: Greenly
  - heading "庭の設計を始める" [level=1]
  - paragraph: 庭を作成するか、保存済みの庭を開きます。
  - text: 手動3Dエディタ
- main:
  - region "新しい庭":
    - text: NEW PROJECT
    - heading "新しい庭" [level=2]
    - paragraph: 庭の寸法は作成後に変更できません。
    - text: 庭の名前
    - textbox "庭の名前":
      - /placeholder: 例：南側の庭
    - text: 幅 (m)
    - spinbutton "幅 (m)": "10"
    - text: 奥行き (m)
    - spinbutton "奥行き (m)": "8"
    - paragraph: 各辺 1〜50m
    - button "庭を作成" [disabled]
  - region "保存した庭":
    - text: YOUR GARDENS
    - heading "保存した庭" [level=2]
    - alert: 庭一覧を取得できませんでした。APIとMySQLの起動状態を確認してください。
    - button "再読み込み"
- contentinfo: Greenly · ローカル開発用MVP
```

```
Error: apiRequestContext.delete: connect ECONNREFUSED 127.0.0.1:18080
Call log:
  - → DELETE http://127.0.0.1:18080/api/gardens/fe307327-59fa-42f7-a770-6dc0f25fd7e0
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```

# Test source

```ts
  1   | import { mkdir, writeFile } from 'node:fs/promises';
  2   | import { resolve } from 'node:path';
  3   | import { expect, test, type Page, type APIRequestContext } from '@playwright/test';
  4   | import type { GardenDocument } from '../frontend/src/types/garden.js';
  5   | 
  6   | const apiBase = 'http://127.0.0.1:18080/api';
  7   | const artifactDirectory = resolve('artifacts/e2e');
  8   | let createdGardenIds: string[] = [];
  9   | 
  10  | test.beforeEach(() => {
  11  |   createdGardenIds = [];
  12  | });
  13  | 
  14  | test.afterEach(async ({ request }) => {
  15  |   for (const id of createdGardenIds) {
> 16  |     const response = await request.delete(`${apiBase}/gardens/${id}`);
      |                                          ^ Error: apiRequestContext.delete: connect ECONNREFUSED 127.0.0.1:18080
  17  |     expect([204, 404]).toContain(response.status());
  18  |   }
  19  | });
  20  | 
  21  | async function createGarden(page: Page, name: string): Promise<string> {
  22  |   await page.goto('/');
  23  |   await page.getByLabel('庭の名前').fill(name);
  24  |   await page.getByRole('button', { name: '庭を作成' }).click();
  25  |   await page.waitForURL(/\/gardens\//);
  26  |   const id = new URL(page.url()).pathname.split('/').at(-1);
  27  |   if (!id) throw new Error('作成後に庭IDを取得できませんでした。');
  28  |   createdGardenIds.push(id);
  29  |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  30  |   return id;
  31  | }
  32  | 
  33  | async function placeTree(page: Page, x = 0.5, y = 0.5): Promise<void> {
  34  |   await page.getByRole('button', { name: '上から見る' }).click();
  35  |   await page.getByTestId('asset-tree_oak').click();
  36  |   const canvas = page.locator('[data-testid="garden-canvas"] canvas');
  37  |   const bounds = await canvas.boundingBox();
  38  |   if (!bounds) throw new Error('3Dキャンバスが表示されていません。');
  39  |   await page.mouse.click(bounds.x + bounds.width * x, bounds.y + bounds.height * y);
  40  |   await expect(page.getByTestId('object-row-0')).toBeVisible();
  41  |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  42  | }
  43  | 
  44  | async function gardenJson(request: APIRequestContext, id: string): Promise<GardenDocument> {
  45  |   const response = await request.get(`${apiBase}/gardens/${id}`);
  46  |   expect(response.ok()).toBeTruthy();
  47  |   return await response.json() as GardenDocument;
  48  | }
  49  | 
  50  | async function saveGardenArtifact(request: APIRequestContext, id: string, fileName: string): Promise<GardenDocument> {
  51  |   const document = await gardenJson(request, id);
  52  |   await mkdir(artifactDirectory, { recursive: true });
  53  |   await writeFile(resolve(artifactDirectory, fileName), `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  54  |   return document;
  55  | }
  56  | 
  57  | test('A. 庭作成からGLB配置・変形・保存・再読み込みまで', async ({ page, request }) => {
  58  |   const name = `E2E roundtrip ${Date.now()}`;
  59  |   const id = await createGarden(page, name);
  60  |   await placeTree(page);
  61  | 
  62  |   const canvas = page.locator('[data-testid="garden-canvas"] canvas');
  63  |   const bounds = await canvas.boundingBox();
  64  |   if (!bounds) throw new Error('3Dキャンバスが表示されていません。');
  65  |   const initialX = Number(await page.getByTestId('position-x').inputValue());
  66  |   const initialZ = Number(await page.getByTestId('position-z').inputValue());
  67  |   await page.mouse.move(bounds.x + bounds.width / 2 + 35, bounds.y + bounds.height / 2);
  68  |   await page.mouse.down();
  69  |   await page.mouse.move(bounds.x + bounds.width / 2 + 75, bounds.y + bounds.height / 2 + 8, { steps: 6 });
  70  |   await page.mouse.up();
  71  |   await expect.poll(async () => {
  72  |     const currentX = Number(await page.getByTestId('position-x').inputValue());
  73  |     const currentZ = Number(await page.getByTestId('position-z').inputValue());
  74  |     return Math.abs(currentX - initialX) + Math.abs(currentZ - initialZ);
  75  |   }).toBeGreaterThan(0.1);
  76  | 
  77  |   await page.getByTestId('rotation-y').fill('30');
  78  |   await page.getByTestId('uniform-scale').fill('1.25');
  79  |   await expect(page.getByTestId('rotation-y')).toHaveValue('30');
  80  |   await expect(page.getByTestId('uniform-scale')).toHaveValue('1.25');
  81  |   const savedX = Number(await page.getByTestId('position-x').inputValue());
  82  |   await page.getByRole('button', { name: '上から見る' }).click();
  83  |   await page.getByTestId('save-garden').click();
  84  |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  85  |   const stored = await saveGardenArtifact(request, id, 'garden-roundtrip.json');
  86  |   expect(stored.revision).toBe(1);
  87  |   expect(stored.objects).toHaveLength(1);
  88  |   expect(stored.objects[0].position.x).toBeCloseTo(savedX, 2);
  89  |   expect(stored.objects[0].rotation.y).toBeCloseTo(Math.PI / 6, 5);
  90  |   expect(stored.objects[0].scale).toEqual({ x: 1.25, y: 1.25, z: 1.25 });
  91  | 
  92  |   await page.reload();
  93  |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  94  |   await expect(page.getByTestId('position-x')).toHaveValue(String(Number(savedX.toFixed(2))));
  95  |   await expect(page.getByTestId('rotation-y')).toHaveValue('30');
  96  |   await expect(page.getByTestId('uniform-scale')).toHaveValue('1.25');
  97  |   await expect(page.getByTestId('object-row-0')).toHaveAttribute('aria-pressed', 'true');
  98  |   await page.getByRole('button', { name: '上から見る' }).click();
  99  |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-roundtrip.png'), fullPage: true });
  100 |   await test.info().attach('garden-roundtrip.json', {
  101 |     body: JSON.stringify(stored, null, 2),
  102 |     contentType: 'application/json',
  103 |   });
  104 | 
  105 |   await page.getByRole('button', { name: '← 庭一覧' }).click();
  106 |   await page.waitForURL('/');
  107 |   const card = page.locator('.garden-card').filter({ hasText: name });
  108 |   await expect(card.locator('.garden-card-open')).toBeVisible();
  109 |   await card.locator('.garden-card-open').click();
  110 |   await expect(page.locator('h1')).toHaveText(name);
  111 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  112 |   await expect(page.getByTestId('position-x')).toHaveValue(String(Number(savedX.toFixed(2))));
  113 | 
  114 |   await page.getByRole('button', { name: '← 庭一覧' }).click();
  115 |   await page.waitForURL('/');
  116 |   const deleteButton = card.getByRole('button', { name: `${name}を削除` });
```