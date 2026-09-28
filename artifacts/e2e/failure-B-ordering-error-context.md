# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: greenly.spec.ts >> B. 同一GLBの配置、独立移動、複製、削除
- Location: e2e\greenly.spec.ts:128:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByTestId('position-x')
Expected: "-1.4"
Received: "3.49"
Timeout:  10000ms

Call log:
  - Expect "toHaveValue" getByTestId('position-x') with timeout 10000ms
  - waiting for getByTestId('position-x')
    24 × locator resolved to <input max="5" min="-5" step="0.1" value="3.49" type="number" id="position-x" data-testid="position-x"/>
       - unexpected value "3.49"

```

```yaml
- spinbutton "X座標 (m)": "3.49"
```

# Test source

```ts
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
  117 |   page.once('dialog', (dialog) => dialog.dismiss());
  118 |   await deleteButton.click();
  119 |   await expect(card.locator('.garden-card-open')).toBeVisible();
  120 |   expect((await request.get(`${apiBase}/gardens/${id}`)).status()).toBe(200);
  121 | 
  122 |   page.once('dialog', (dialog) => dialog.accept());
  123 |   await deleteButton.click();
  124 |   await expect(card).toHaveCount(0);
  125 |   expect((await request.get(`${apiBase}/gardens/${id}`)).status()).toBe(404);
  126 | });
  127 | 
  128 | test('B. 同一GLBの配置、独立移動、複製、削除', async ({ page, request }) => {
  129 |   const id = await createGarden(page, `E2E independent ${Date.now()}`);
  130 |   await placeTree(page, 0.42, 0.5);
  131 |   await page.getByTestId('asset-tree_oak').click();
  132 |   const canvas = page.locator('[data-testid="garden-canvas"] canvas');
  133 |   const bounds = await canvas.boundingBox();
  134 |   if (!bounds) throw new Error('3Dキャンバスが表示されていません。');
  135 |   await page.mouse.click(bounds.x + bounds.width * 0.70, bounds.y + bounds.height * 0.5);
  136 |   await expect(page.getByTestId('object-row-1')).toBeVisible();
  137 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  138 |   await page.getByTestId('save-garden').click();
  139 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  140 | 
  141 |   const original = await gardenJson(request, id);
  142 |   const originalIds = original.objects.map((object) => object.id);
  143 |   const secondPositionBefore = structuredClone(original.objects[1].position);
  144 |   await page.getByTestId('object-row-0').click();
  145 |   await page.getByTestId('position-x').fill('-1.5');
  146 |   await expect(page.getByTestId('position-x')).toHaveValue('-1.5');
  147 | 
  148 |   await page.getByRole('button', { name: '複製' }).click();
  149 |   await expect(page.getByTestId('object-row-2')).toBeVisible();
  150 |   const duplicateId = await page.getByTestId('object-row-2').getAttribute('data-object-id');
  151 |   expect(duplicateId).toBeTruthy();
  152 |   expect(originalIds).not.toContain(duplicateId);
  153 |   await page.getByTestId('position-x').fill('2.5');
  154 |   await page.getByTestId('object-row-0').click();
  155 |   await expect(page.getByTestId('position-x')).toHaveValue('-1.5');
  156 |   await page.getByTestId('object-row-1').click();
> 157 |   await expect(page.getByTestId('position-x')).toHaveValue(String(Number(secondPositionBefore.x.toFixed(2))));
      |                                                ^ Error: expect(locator).toHaveValue(expected) failed
  158 |   await page.getByTestId('object-row-2').click();
  159 |   await page.getByRole('button', { name: '削除' }).click();
  160 |   await expect(page.getByTestId('object-row-2')).toHaveCount(0);
  161 |   await page.getByTestId('save-garden').click();
  162 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  163 |   const stored = await saveGardenArtifact(request, id, 'garden-independent.json');
  164 |   expect(stored.objects).toHaveLength(2);
  165 |   expect(stored.objects.map((object) => object.id)).toEqual(originalIds);
  166 |   expect(stored.objects[0].position.x).toBe(-1.5);
  167 |   expect(stored.objects[1].position).toEqual(secondPositionBefore);
  168 |   expect(new Set(stored.objects.map((object) => object.id)).size).toBe(2);
  169 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  170 | });
  171 | 
  172 | test('C. 不正な寸法と配置位置を拒否し既存庭を維持', async ({ page, request }) => {
  173 |   await page.goto('/');
  174 |   const invalidCreate = await request.post(`${apiBase}/gardens`, { data: { name: 'invalid size', width: 51, depth: 8 } });
  175 |   expect(invalidCreate.status()).toBe(400);
  176 | 
  177 |   const id = await createGarden(page, `E2E validation ${Date.now()}`);
  178 |   await placeTree(page);
  179 |   await page.getByTestId('save-garden').click();
  180 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  181 |   const before = await gardenJson(request, id);
  182 |   const invalidDocument = structuredClone(before);
  183 |   invalidDocument.objects[0].position.x = invalidDocument.width / 2 + 1;
  184 |   const rejected = await request.put(`${apiBase}/gardens/${id}`, { data: invalidDocument });
  185 |   expect(rejected.status()).toBe(400);
  186 |   expect(await gardenJson(request, id)).toEqual(before);
  187 | });
  188 | 
  189 | test('D. 保存失敗後の編集保持と再試行', async ({ page, request }) => {
  190 |   const id = await createGarden(page, `E2E retry ${Date.now()}`);
  191 |   await placeTree(page);
  192 |   await page.getByTestId('position-x').fill('1.2');
  193 |   await page.route(`**/api/gardens/${id}`, async (route) => {
  194 |     if (route.request().method() === 'PUT') await route.abort('failed');
  195 |     else await route.continue();
  196 |   });
  197 |   await page.getByTestId('save-garden').click();
  198 |   await expect(page.getByRole('alert')).toContainText('サーバーへ接続できませんでした');
  199 |   await expect(page.getByTestId('save-status')).toHaveText('未保存の変更');
  200 |   await expect(page.getByTestId('position-x')).toHaveValue('1.2');
  201 |   expect((await gardenJson(request, id)).revision).toBe(0);
  202 |   await page.unroute(`**/api/gardens/${id}`);
  203 |   await page.getByTestId('save-garden').click();
  204 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  205 |   expect((await gardenJson(request, id)).objects[0].position.x).toBe(1.2);
  206 | });
  207 | 
  208 | test('E. 古いrevisionの保存を競合として拒否しローカル編集を維持', async ({ page, request }) => {
  209 |   const id = await createGarden(page, `E2E conflict ${Date.now()}`);
  210 |   await placeTree(page);
  211 |   await page.getByTestId('save-garden').click();
  212 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  213 | 
  214 |   await page.getByTestId('position-x').fill('2');
  215 |   const serverDocument = await gardenJson(request, id);
  216 |   const competingDocument = structuredClone(serverDocument);
  217 |   competingDocument.objects[0].position.z = 1.25;
  218 |   const competingSave = await request.put(`${apiBase}/gardens/${id}`, { data: competingDocument });
  219 |   expect(competingSave.ok()).toBeTruthy();
  220 | 
  221 |   await page.getByTestId('save-garden').click();
  222 |   await expect(page.getByRole('alert')).toContainText('別の保存結果と競合しました');
  223 |   await expect(page.getByTestId('save-status')).toHaveText('未保存の変更');
  224 |   await expect(page.getByTestId('position-x')).toHaveValue('2');
  225 |   const serverAfterConflict = await gardenJson(request, id);
  226 |   expect(serverAfterConflict.revision).toBe(serverDocument.revision + 1);
  227 |   expect(serverAfterConflict.objects[0].position.z).toBe(1.25);
  228 |   await saveGardenArtifact(request, id, 'garden-conflict.json');
  229 | });
  230 | 
```