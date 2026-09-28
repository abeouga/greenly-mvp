# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: greenly.spec.ts >> B. 同一GLBの配置、独立移動、複製、削除
- Location: e2e\greenly.spec.ts:105:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('object-row-1')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByTestId('object-row-1') with timeout 10000ms
  - waiting for getByTestId('object-row-1')

```

```yaml
- banner:
  - link "Greenly 庭一覧へ":
    - /url: /
    - text: Greenly
  - heading "E2E independent 1790411744480" [level=1]
  - paragraph: 10 × 8 m · 中心原点 · 1目盛り = 1m
  - text: 手動3Dエディタ
- button "← 庭一覧"
- text: 未保存の変更
- button "保存" [disabled]
- main:
  - complementary:
    - text: CATALOG
    - heading "オブジェクト" [level=2]
    - paragraph: 種類を選び、地面をクリックして配置します。
    - button "ベンチ 家具 1.6 × 0.85 × 0.65 m" [disabled]:
      - strong: ベンチ
      - text: 家具 1.6 × 0.85 × 0.65 m
    - button "レンガ 舗装 0.6 × 0.15 × 0.2 m" [disabled]:
      - strong: レンガ
      - text: 舗装 0.6 × 0.15 × 0.2 m
    - button "低木 植物 1.2 × 1.2 × 1.2 m" [disabled]:
      - strong: 低木
      - text: 植物 1.2 × 1.2 × 1.2 m
    - button "木 植物 2 × 4 × 2 m" [disabled] [pressed]:
      - strong: 木
      - text: 植物 2 × 4 × 2 m
    - paragraph: 開発用の簡易GLBモデルです。
  - region "庭の3D編集エリア":
    - text: 地面をクリックして配置
    - button "上から見る"
    - button "初期視点"
    - text: "1 Three.js unit = 1m 読み込み済み: 1 / 1 配置数 1 / 200"
  - complementary:
    - text: IN YOUR GARDEN
    - heading "配置済み" [level=2]
    - text: 1 / 200
    - list:
      - listitem:
        - button "01 木 X -1.4 · Z -0.0" [pressed]:
          - text: "01"
          - strong: 木
          - text: X -1.4 · Z -0.0
    - text: TRANSFORM
    - heading "プロパティ" [level=2]
    - strong: 木
    - group "変形ツール":
      - button "移動" [disabled] [pressed]
      - button "回転" [disabled]
      - button "拡縮" [disabled]
    - text: X座標 (m)
    - spinbutton "X座標 (m)" [disabled]: "-1.4"
    - text: Z座標 (m)
    - spinbutton "Z座標 (m)" [disabled]: "0"
    - text: Y回転 (度)
    - spinbutton "Y回転 (度)" [disabled]: "0"
    - text: 倍率 (一様)
    - spinbutton "倍率 (一様)" [disabled]: "1"
    - paragraph: 倍率 0.25〜3。Y座標とX/Z回転は固定です。
    - button "複製" [disabled]
    - button "削除" [disabled]
```

# Test source

```ts
  13  | 
  14  | test.afterEach(async ({ request }) => {
  15  |   for (const id of createdGardenIds) {
  16  |     const response = await request.delete(`${apiBase}/gardens/${id}`);
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
  58  |   const id = await createGarden(page, `E2E roundtrip ${Date.now()}`);
  59  |   await placeTree(page);
  60  | 
  61  |   const canvas = page.locator('[data-testid="garden-canvas"] canvas');
  62  |   const bounds = await canvas.boundingBox();
  63  |   if (!bounds) throw new Error('3Dキャンバスが表示されていません。');
  64  |   const initialX = Number(await page.getByTestId('position-x').inputValue());
  65  |   const initialZ = Number(await page.getByTestId('position-z').inputValue());
  66  |   await page.mouse.move(bounds.x + bounds.width / 2 + 35, bounds.y + bounds.height / 2);
  67  |   await page.mouse.down();
  68  |   await page.mouse.move(bounds.x + bounds.width / 2 + 75, bounds.y + bounds.height / 2 + 8, { steps: 6 });
  69  |   await page.mouse.up();
  70  |   await expect.poll(async () => {
  71  |     const currentX = Number(await page.getByTestId('position-x').inputValue());
  72  |     const currentZ = Number(await page.getByTestId('position-z').inputValue());
  73  |     return Math.abs(currentX - initialX) + Math.abs(currentZ - initialZ);
  74  |   }).toBeGreaterThan(0.1);
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
  112 |   await page.mouse.click(bounds.x + bounds.width * 0.58, bounds.y + bounds.height * 0.5);
> 113 |   await expect(page.getByTestId('object-row-1')).toBeVisible();
      |                                                  ^ Error: expect(locator).toBeVisible() failed
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
  175 |   await expect(page.getByRole('alert')).toContainText('サーバーへ接続できませんでした');
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