# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: photo-boundary.spec.ts >> I. 仮線追従・始点で6点輪郭確定・配置・保存復元・3D切替
- Location: e2e\photo-boundary.spec.ts:77:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:15174/
Call log:
  - navigating to "http://127.0.0.1:15174/", waiting until "load"

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
  8   | const corners = [[0.1, 0.85], [0.9, 0.85], [0.8, 0.2], [0.2, 0.2]];
  9   | const outline = [[0.15, 0.8], [0.8, 0.8], [0.75, 0.55], [0.65, 0.55], [0.6, 0.25], [0.25, 0.25]];
  10  | let createdGardenIds: string[] = [];
  11  | 
  12  | test.beforeEach(() => { createdGardenIds = []; });
  13  | test.afterEach(async ({ request }) => {
  14  |   for (const id of createdGardenIds) {
  15  |     expect([204, 404]).toContain((await request.delete(`${apiBase}/gardens/${id}`)).status());
  16  |   }
  17  | });
  18  | 
  19  | async function preparePhoto(page: Page) {
> 20  |   await page.goto('/');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:15174/
  21  |   await page.getByLabel('庭の名前').fill(`E2E photo boundary ${Date.now()}`);
  22  |   await page.getByRole('button', { name: '庭を作成' }).click();
  23  |   await page.waitForURL(/\/gardens\//);
  24  |   const id = new URL(page.url()).pathname.split('/').at(-1)!;
  25  |   createdGardenIds.push(id);
  26  |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  27  |   await page.getByRole('button', { name: '写真＋設計' }).click();
  28  |   const imageDataUrl = await page.evaluate(() => {
  29  |     const canvas = document.createElement('canvas');
  30  |     canvas.width = 800; canvas.height = 600;
  31  |     const context = canvas.getContext('2d')!;
  32  |     context.fillStyle = '#708e91'; context.fillRect(0, 0, 800, 600);
  33  |     context.fillStyle = '#647744';
  34  |     context.beginPath(); context.moveTo(80, 520); context.lineTo(720, 520); context.lineTo(640, 100); context.lineTo(160, 100); context.fill();
  35  |     return canvas.toDataURL('image/png');
  36  |   });
  37  |   await page.getByLabel('庭の写真を選択').setInputFiles({ name: 'garden.png', mimeType: 'image/png', buffer: Buffer.from(imageDataUrl.split(',')[1], 'base64') });
  38  |   await expect(page.locator('.photo-stage image')).toBeVisible();
  39  |   return { id, imageDataUrl };
  40  | }
  41  | 
  42  | async function screenPoint(page: Page, x: number, y: number) {
  43  |   return page.locator('.photo-stage').evaluate((element, coords) => {
  44  |     const screen = new DOMPoint(coords.x * 800, coords.y * 600).matrixTransform((element as SVGSVGElement).getScreenCTM()!);
  45  |     return { x: screen.x, y: screen.y };
  46  |   }, { x, y });
  47  | }
  48  | 
  49  | async function clickImage(page: Page, x: number, y: number) {
  50  |   const point = await screenPoint(page, x, y);
  51  |   await page.mouse.click(point.x, point.y);
  52  | }
  53  | 
  54  | async function moveImage(page: Page, x: number, y: number) {
  55  |   const point = await screenPoint(page, x, y);
  56  |   await page.mouse.move(point.x, point.y);
  57  |   await expect.poll(async () => page.getByTestId('photo-preview-edge').evaluate((element, target) => {
  58  |     const line = element as SVGLineElement;
  59  |     const end = new DOMPoint(line.x2.baseVal.value, line.y2.baseVal.value).matrixTransform(line.getScreenCTM()!);
  60  |     return Math.hypot(end.x - target.x, end.y - target.y);
  61  |   }, point)).toBeLessThan(2);
  62  | }
  63  | 
  64  | async function gardenJson(request: APIRequestContext, id: string): Promise<GardenDocument> {
  65  |   const response = await request.get(`${apiBase}/gardens/${id}`);
  66  |   expect(response.ok()).toBeTruthy();
  67  |   return await response.json() as GardenDocument;
  68  | }
  69  | 
  70  | async function saveArtifact(request: APIRequestContext, id: string, name: string) {
  71  |   const document = await gardenJson(request, id);
  72  |   await mkdir(artifactDirectory, { recursive: true });
  73  |   await writeFile(resolve(artifactDirectory, name), `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  74  |   return document;
  75  | }
  76  | 
  77  | test('I. 仮線追従・始点で6点輪郭確定・配置・保存復元・3D切替', async ({ page, request }) => {
  78  |   const { id, imageDataUrl } = await preparePhoto(page);
  79  |   await expect(page.getByTestId('photo-ground')).toHaveCount(0);
  80  |   await expect(page.getByTestId('save-garden')).toBeDisabled();
  81  |   await expect(page.getByRole('button', { name: '3D庭', exact: true })).toBeDisabled();
  82  |   await expect(page.getByTestId('save-status')).toHaveText('輪郭を描画中');
  83  |   await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(0);
  84  |   await clickImage(page, ...outline[0] as [number, number]);
  85  |   await moveImage(page, 0.5, 0.72);
  86  |   const previousEnd = await page.getByTestId('photo-preview-edge').getAttribute('x2');
  87  |   await moveImage(page, 0.7, 0.65);
  88  |   expect(await page.getByTestId('photo-preview-edge').getAttribute('x2')).not.toBe(previousEnd);
  89  |   await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(1);
  90  |   for (const [index, [x, y]] of outline.slice(1).entries()) {
  91  |     await clickImage(page, x, y);
  92  |     if (index === 2) {
  93  |       await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(4);
  94  |       await expect(page.getByTestId('photo-ground')).toHaveCount(0);
  95  |       await expect(page.getByTestId('save-garden')).toBeDisabled();
  96  |     }
  97  |   }
  98  |   await page.setViewportSize({ width: 1280, height: 900 });
  99  |   await moveImage(page, 0.45, 0.45);
  100 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-boundary-draft.png'), fullPage: true });
  101 |   expect((await gardenJson(request, id)).photo).toBeNull();
  102 |   const start = page.getByRole('button', { name: '始点につないで輪郭を確定' });
  103 |   await start.hover();
  104 |   const firstX = await start.getAttribute('cx');
  105 |   await expect(page.getByTestId('photo-preview-edge')).toHaveAttribute('x2', firstX!);
  106 |   await start.click();
  107 |   await expect(page.getByTestId('photo-ground')).toBeVisible();
  108 |   await expect(page.getByTestId('photo-preview-edge')).toHaveCount(0);
  109 |   await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(6);
  110 |   await expect(page.getByRole('button', { name: '輪郭を確定', exact: true })).toHaveCount(0);
  111 |   await page.getByTestId('asset-tree_oak').click();
  112 |   await clickImage(page, 0.5, 0.65);
  113 |   await expect(page.getByTestId('object-row-0')).toBeVisible();
  114 |   await page.getByTestId('save-garden').click();
  115 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  116 |   const stored = await saveArtifact(request, id, 'garden-photo-polygon.json');
  117 |   expect(stored.photo?.corners).toHaveLength(4);
  118 |   expect(stored.photo?.boundary).toHaveLength(6);
  119 |   expect(stored.photo?.dataUrl).toBe(imageDataUrl);
  120 |   expect(stored.objects).toHaveLength(1);
```