# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: greenly.spec.ts >> D. 保存失敗後の編集保持と再試行
- Location: e2e\greenly.spec.ts:166:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('alert')
Expected substring: "サーバーへ接続できませんでした"
Received string:    "Failed to fetch再試行"
Timeout: 10000ms

Call log:
  - Expect "toContainText" getByRole('alert') with timeout 10000ms
  - waiting for getByRole('alert')
    24 × locator resolved to <div role="alert" class="editor-alert notice-error">…</div>
       - unexpected value "Failed to fetch再試行"

```

```yaml
- alert:
  - text: Failed to fetch
  - button "再試行"
```

# Test source

```ts
  75  | 
  76  |   await page.getByTestId('rotation-y').fill('30');
  77  |   await page.getByTestId('uniform-scale').fill('1.25');
  78  |   await expect(page.getByTestId('rotation-y')).toHaveValue('30');
  79  |   await expect(page.getByTestId('uniform-scale')).toHaveValue('1.25');
  80  |   const savedX = Number(await page.getByTestId('position-x').inputValue());
  81  |   await page.getByRole('button', { name: '上から見る' }).click();
  82  |   await page.getByTestId('save-garden').click();
  83  |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  84  |   const stored = await saveGardenArtifact(request, id, 'garden-roundtrip.json');
  85  |   expect(stored.revision).toBe(1);
  86  |   expect(stored.objects).toHaveLength(1);
  87  |   expect(stored.objects[0].position.x).toBeCloseTo(savedX, 2);
  88  |   expect(stored.objects[0].rotation.y).toBeCloseTo(Math.PI / 6, 5);
  89  |   expect(stored.objects[0].scale).toEqual({ x: 1.25, y: 1.25, z: 1.25 });
  90  | 
  91  |   await page.reload();
  92  |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  93  |   await expect(page.getByTestId('position-x')).toHaveValue(String(Number(savedX.toFixed(2))));
  94  |   await expect(page.getByTestId('rotation-y')).toHaveValue('30');
  95  |   await expect(page.getByTestId('uniform-scale')).toHaveValue('1.25');
  96  |   await expect(page.getByTestId('object-row-0')).toHaveAttribute('aria-pressed', 'true');
  97  |   await page.getByRole('button', { name: '上から見る' }).click();
  98  |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-roundtrip.png'), fullPage: true });
  99  |   await test.info().attach('garden-roundtrip.json', {
  100 |     body: JSON.stringify(stored, null, 2),
  101 |     contentType: 'application/json',
  102 |   });
  103 | });
  104 | 
  105 | test('B. 同一GLBの配置、独立移動、複製、削除', async ({ page, request }) => {
  106 |   const id = await createGarden(page, `E2E independent ${Date.now()}`);
  107 |   await placeTree(page, 0.42, 0.5);
  108 |   await page.getByTestId('asset-tree_oak').click();
  109 |   const canvas = page.locator('[data-testid="garden-canvas"] canvas');
  110 |   const bounds = await canvas.boundingBox();
  111 |   if (!bounds) throw new Error('3Dキャンバスが表示されていません。');
  112 |   await page.mouse.click(bounds.x + bounds.width * 0.70, bounds.y + bounds.height * 0.5);
  113 |   await expect(page.getByTestId('object-row-1')).toBeVisible();
  114 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  115 |   await page.getByTestId('save-garden').click();
  116 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  117 | 
  118 |   const original = await gardenJson(request, id);
  119 |   const originalIds = original.objects.map((object) => object.id);
  120 |   const secondPositionBefore = structuredClone(original.objects[1].position);
  121 |   await page.getByTestId('object-row-0').click();
  122 |   await page.getByTestId('position-x').fill('-1.5');
  123 |   await expect(page.getByTestId('position-x')).toHaveValue('-1.5');
  124 | 
  125 |   await page.getByRole('button', { name: '複製' }).click();
  126 |   await expect(page.getByTestId('object-row-2')).toBeVisible();
  127 |   const duplicateId = await page.getByTestId('object-row-2').getAttribute('data-object-id');
  128 |   expect(duplicateId).toBeTruthy();
  129 |   expect(originalIds).not.toContain(duplicateId);
  130 |   await page.getByTestId('position-x').fill('2.5');
  131 |   await page.getByTestId('object-row-0').click();
  132 |   await expect(page.getByTestId('position-x')).toHaveValue('-1.5');
  133 |   await page.getByTestId('object-row-1').click();
  134 |   await expect(page.getByTestId('position-x')).toHaveValue(String(Number(secondPositionBefore.x.toFixed(2))));
  135 |   await page.getByTestId('object-row-2').click();
  136 |   await page.getByRole('button', { name: '削除' }).click();
  137 |   await expect(page.getByTestId('object-row-2')).toHaveCount(0);
  138 |   await page.getByTestId('save-garden').click();
  139 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  140 |   const stored = await saveGardenArtifact(request, id, 'garden-independent.json');
  141 |   expect(stored.objects).toHaveLength(2);
  142 |   expect(stored.objects.map((object) => object.id)).toEqual(originalIds);
  143 |   expect(stored.objects[0].position.x).toBe(-1.5);
  144 |   expect(stored.objects[1].position).toEqual(secondPositionBefore);
  145 |   expect(new Set(stored.objects.map((object) => object.id)).size).toBe(2);
  146 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  147 | });
  148 | 
  149 | test('C. 不正な寸法と配置位置を拒否し既存庭を維持', async ({ page, request }) => {
  150 |   await page.goto('/');
  151 |   const invalidCreate = await request.post(`${apiBase}/gardens`, { data: { name: 'invalid size', width: 51, depth: 8 } });
  152 |   expect(invalidCreate.status()).toBe(400);
  153 | 
  154 |   const id = await createGarden(page, `E2E validation ${Date.now()}`);
  155 |   await placeTree(page);
  156 |   await page.getByTestId('save-garden').click();
  157 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  158 |   const before = await gardenJson(request, id);
  159 |   const invalidDocument = structuredClone(before);
  160 |   invalidDocument.objects[0].position.x = invalidDocument.width / 2 + 1;
  161 |   const rejected = await request.put(`${apiBase}/gardens/${id}`, { data: invalidDocument });
  162 |   expect(rejected.status()).toBe(400);
  163 |   expect(await gardenJson(request, id)).toEqual(before);
  164 | });
  165 | 
  166 | test('D. 保存失敗後の編集保持と再試行', async ({ page, request }) => {
  167 |   const id = await createGarden(page, `E2E retry ${Date.now()}`);
  168 |   await placeTree(page);
  169 |   await page.getByTestId('position-x').fill('1.2');
  170 |   await page.route(`**/api/gardens/${id}`, async (route) => {
  171 |     if (route.request().method() === 'PUT') await route.abort('failed');
  172 |     else await route.continue();
  173 |   });
  174 |   await page.getByTestId('save-garden').click();
> 175 |   await expect(page.getByRole('alert')).toContainText('サーバーへ接続できませんでした');
      |                                         ^ Error: expect(locator).toContainText(expected) failed
  176 |   await expect(page.getByTestId('save-status')).toHaveText('未保存の変更');
  177 |   await expect(page.getByTestId('position-x')).toHaveValue('1.2');
  178 |   expect((await gardenJson(request, id)).revision).toBe(0);
  179 |   await page.unroute(`**/api/gardens/${id}`);
  180 |   await page.getByTestId('save-garden').click();
  181 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  182 |   expect((await gardenJson(request, id)).objects[0].position.x).toBe(1.2);
  183 | });
  184 | 
  185 | test('E. 古いrevisionの保存を競合として拒否しローカル編集を維持', async ({ page, request }) => {
  186 |   const id = await createGarden(page, `E2E conflict ${Date.now()}`);
  187 |   await placeTree(page);
  188 |   await page.getByTestId('save-garden').click();
  189 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  190 | 
  191 |   await page.getByTestId('position-x').fill('2');
  192 |   const serverDocument = await gardenJson(request, id);
  193 |   const competingDocument = structuredClone(serverDocument);
  194 |   competingDocument.objects[0].position.z = 1.25;
  195 |   const competingSave = await request.put(`${apiBase}/gardens/${id}`, { data: competingDocument });
  196 |   expect(competingSave.ok()).toBeTruthy();
  197 | 
  198 |   await page.getByTestId('save-garden').click();
  199 |   await expect(page.getByRole('alert')).toContainText('別の保存結果と競合しました');
  200 |   await expect(page.getByTestId('save-status')).toHaveText('未保存の変更');
  201 |   await expect(page.getByTestId('position-x')).toHaveValue('2');
  202 |   const serverAfterConflict = await gardenJson(request, id);
  203 |   expect(serverAfterConflict.revision).toBe(serverDocument.revision + 1);
  204 |   expect(serverAfterConflict.objects[0].position.z).toBe(1.25);
  205 |   await saveGardenArtifact(request, id, 'garden-conflict.json');
  206 | });
  207 | 
```