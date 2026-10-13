# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: photo-scale.spec.ts >> 辺の実寸編集・輪郭固定・縮尺・保存復元 (fixed-projection)
- Location: e2e\photo-scale.spec.ts:21:3

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
  1   | import { mkdir, writeFile } from 'node:fs/promises';
  2   | import { resolve } from 'node:path';
  3   | import { randomUUID } from 'node:crypto';
  4   | import { expect, test } from '@playwright/test';
  5   | import { PerspectiveCamera, Vector3 } from 'three';
  6   | import { api } from './api-url.js';
  7   | import { createPhotoCamera } from '../frontend/src/three/photoCamera.js';
  8   | import type { GardenDocument, GardenPhoto } from '../frontend/src/types/garden.js';
  9   | 
  10  | const directory = resolve('artifacts/e2e');
  11  | const polygon = [{ x: .2, y: .8 }, { x: .8, y: .8 }, { x: .8, y: .5 }, { x: .55, y: .5 }, { x: .55, y: .2 }, { x: .2, y: .2 }];
  12  | const rectangle = [{ x: .2, y: .8 }, { x: .8, y: .8 }, { x: .8, y: .2 }, { x: .2, y: .2 }];
  13  | 
  14  | function imageAnchor(document: GardenDocument) {
  15  |   const camera = createPhotoCamera(document.photo!, document.width, document.depth)!;
  16  |   const position = document.objects[0].position;
  17  |   return new Vector3(position.x, 0, position.z).project(camera);
  18  | }
  19  | 
  20  | for (const mode of ['legacy', 'fixed-projection', 'calibrated']) {
  21  |   test(`辺の実寸編集・輪郭固定・縮尺・保存復元 (${mode})`, async ({ page, request }) => {
  22  |     const created = await request.post(`${api}/gardens`, { data: { name: `辺の実寸編集 ${mode} ${Date.now()}` } });
  23  |     expect(created.status()).toBe(201);
  24  |     const initial = await created.json() as GardenDocument;
  25  |     try {
  26  |       await page.goto(`/gardens/${initial.id}`);
  27  |       const dataUrl = await page.evaluate(() => {
  28  |         const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 750;
  29  |         const ctx = canvas.getContext('2d')!;
  30  |         ctx.fillStyle = '#b5c9d0'; ctx.fillRect(0, 0, 1000, 750);
  31  |         ctx.fillStyle = '#8b9c72'; ctx.fillRect(0, 250, 1000, 500);
  32  |         ctx.fillStyle = '#d9d2bd'; ctx.fillRect(180, 350, 670, 260);
  33  |         ctx.fillStyle = '#354638'; ctx.font = '26px sans-serif'; ctx.fillText('PHOTO SCALE / FIXED OUTLINE', 40, 70);
  34  |         return canvas.toDataURL('image/png');
  35  |       });
  36  |       const photo: GardenPhoto = { dataUrl, imageWidth: 1000, imageHeight: 750, boundary: polygon, corners: rectangle };
  37  |       if (mode === 'fixed-projection') photo.projectionSize = { width: 10, depth: 8 };
  38  |       if (mode === 'calibrated') {
  39  |         const camera = new PerspectiveCamera(50, 4 / 3, .01, 1000);
  40  |         camera.position.set(5, 8, 13); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(true);
  41  |         const points = [[-5, 4], [5, 4], [5, -4], [-5, -4]].map(([x, z]) => {
  42  |           const point = new Vector3(x, 0, z).project(camera);
  43  |           return { x: (point.x + 1) / 2, y: (1 - point.y) / 2 };
  44  |         });
  45  |         const response = await request.post(`${api}/photo-calibration`, { data: {
  46  |           imageWidth: 1000, imageHeight: 750, points, referenceWidth: 10, referenceDepth: 8,
  47  |         } });
  48  |         expect(response.status()).toBe(200);
  49  |         photo.calibration = await response.json();
  50  |         photo.boundary = points;
  51  |         photo.corners = points;
  52  |       }
  53  |       const seed = await request.put(`${api}/gardens/${initial.id}`, { data: {
  54  |         ...initial, width: mode === 'fixed-projection' ? 14 : 10,
  55  |         depth: mode === 'fixed-projection' ? 12 : 8, photo,
  56  |         objects: [{ id: randomUUID(), assetId: 'tree_oak', position: { x: -1, y: 0, z: 1 },
  57  |           rotation: { x: 0, y: .3, z: 0 }, scale: { x: .8, y: .8, z: .8 } }],
  58  |       } });
  59  |       expect(seed.status(), await seed.text()).toBe(200);
  60  |       const before = await seed.json() as GardenDocument;
  61  |       await page.reload();
  62  |       await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  63  |       const outline = await page.getByTestId('photo-ground').getAttribute('points');
  64  |       const vertices = await page.locator('[data-testid^="photo-vertex-"]').evaluateAll(nodes => nodes.map(node => [node.getAttribute('cx'), node.getAttribute('cy')]));
  65  |       const popup = page.getByRole('dialog', { name: '選択した辺の長さ' });
  66  |       const field = popup.getByLabel('辺の長さ（m）');
  67  |       await page.getByTestId('photo-edge-0').click();
  68  |       await expect(field).toBeFocused();
  69  |       expect(await field.evaluate(node => (node as HTMLInputElement).selectionEnd! - (node as HTMLInputElement).selectionStart!)).toBeGreaterThan(0);
  70  |       await field.fill('12.5');
  71  |       await page.keyboard.press('Escape');
  72  |       await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  73  |       await page.getByTestId('photo-edge-0').click();
  74  |       await field.fill('12.5');
  75  |       await popup.getByRole('button', { name: '取消', exact: true }).click();
  76  |       await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  77  |       await page.getByTestId('photo-edge-0').click();
  78  |       for (const invalid of ['', '0', '-1', 'abc', 'Infinity', '9999', '.000001']) {
  79  |         await field.fill(invalid);
  80  |         await popup.getByRole('button', { name: '長さを適用' }).click();
  81  |         await expect(popup.getByRole('alert')).toBeVisible();
  82  |         await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  83  |         await expect(page.getByTestId('photo-ground')).toHaveAttribute('points', outline!);
  84  |       }
  85  |       await field.fill('12.5');
  86  |       await field.press('Enter');
  87  |       await expect(page.getByTestId('edge-measurement')).toHaveText('12.50 m');
> 88  |       await expect(page.getByTestId('save-garden')).toBeEnabled();
      |                                                     ^ Error: expect(locator).toHaveText(expected) failed
  89  |       await expect(popup).toBeVisible();
  90  |       await page.keyboard.press('Escape');
  91  |       await page.getByTestId('photo-edge-1').click();
  92  |       const secondLength = mode === 'calibrated' ? 8 : 4;
  93  |       expect(parseFloat((await page.getByTestId('edge-measurement').textContent())!)).toBeCloseTo(secondLength * 1.25, 2);
  94  |       await field.fill(String(secondLength * 1.5));
  95  |       await field.press('Enter');
  96  |       await page.keyboard.press('Escape');
  97  |       await page.getByTestId('object-details-toggle').click();
  98  |       await page.locator('.construction-details > summary').click();
  99  |       const summary = page.locator('.construction-details');
  100 |       const expectedArea = mode === 'calibrated' ? 180 : 142.5;
  101 |       await expect(summary).toContainText(`面積：${expectedArea.toFixed(2)} m²`);
  102 |       await page.keyboard.press('Escape');
  103 |       await page.getByTestId('save-garden').click();
  104 |       await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  105 |       const after = await (await request.get(`${api}/gardens/${initial.id}`)).json() as GardenDocument;
  106 |       expect(after.width).toBeCloseTo(before.width * 1.5, 4);
  107 |       expect(after.depth).toBeCloseTo(before.depth * 1.5, 4);
  108 |       expect(after.photo!.boundary).toEqual(before.photo!.boundary);
  109 |       expect(after.photo!.corners).toEqual(before.photo!.corners);
  110 |       expect(after.photo!.dataUrl).toBe(before.photo!.dataUrl);
  111 |       const object = after.objects[0];
  112 |       expect(object.id).toBe(before.objects[0].id);
  113 |       expect(object.rotation).toEqual(before.objects[0].rotation);
  114 |       expect(object.scale).toEqual(before.objects[0].scale);
  115 |       expect(object.position.x).toBeCloseTo(-1.5, 4);
  116 |       expect(object.position.z).toBeCloseTo(1.5, 4);
  117 |       const oldAnchor = imageAnchor(before), newAnchor = imageAnchor(after);
  118 |       expect(Math.abs(oldAnchor.x - newAnchor.x) * 500).toBeLessThan(.1);
  119 |       expect(Math.abs(oldAnchor.y - newAnchor.y) * 375).toBeLessThan(.1);
  120 |       if (before.photo!.projectionSize) {
  121 |         expect(after.photo!.projectionSize!.width).toBeCloseTo(15, 4);
  122 |         expect(after.photo!.projectionSize!.depth).toBeCloseTo(12, 4);
  123 |       }
  124 |       if (before.photo!.calibration) {
  125 |         const first = before.photo!.calibration, last = after.photo!.calibration!;
  126 |         expect(last.points).toEqual(first.points);
  127 |         expect(last.referenceWidth).toBeCloseTo(15, 4);
  128 |         expect(last.referenceDepth).toBeCloseTo(12, 4);
  129 |         expect(last.focalLengthPx).toBeCloseTo(first.focalLengthPx, 2);
  130 |         for (let i = 0; i < 9; i++) expect(last.rotation[i]).toBeCloseTo(first.rotation[i], 4);
  131 |         for (let i = 0; i < 3; i++) expect(last.translation[i]).toBeCloseTo(first.translation[i] * 1.5, 3);
  132 |       }
  133 |       await page.reload();
  134 |       await page.getByTestId('photo-edge-0').click();
  135 |       await expect(page.getByTestId('edge-measurement')).toHaveText('15.00 m');
  136 |       await expect(page.getByTestId('photo-ground')).toHaveAttribute('points', outline!);
  137 |       expect(await page.locator('[data-testid^="photo-vertex-"]').evaluateAll(nodes => nodes.map(node => [node.getAttribute('cx'), node.getAttribute('cy')]))).toEqual(vertices);
  138 |       await mkdir(directory, { recursive: true });
  139 |       await page.screenshot({ path: resolve(directory, `photo-scale-${mode}.png`), fullPage: true });
  140 |       await writeFile(resolve(directory, `photo-scale-${mode}.json`), JSON.stringify({ before, after }, null, 2));
  141 |       await page.setViewportSize({ width: 390, height: 844 });
  142 |       await field.scrollIntoViewIfNeeded();
  143 |       await expect(field).toBeVisible();
  144 |       await field.fill('15');
  145 |       await popup.getByRole('button', { name: '長さを適用' }).click();
  146 |       await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  147 |       expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  148 |       await page.screenshot({ path: resolve(directory, `photo-scale-mobile-${mode}.png`), fullPage: true });
  149 |     } finally {
  150 |       expect((await request.delete(`${api}/gardens/${initial.id}`)).status()).toBe(204);
  151 |     }
  152 |   });
  153 | }
  154 | 
```