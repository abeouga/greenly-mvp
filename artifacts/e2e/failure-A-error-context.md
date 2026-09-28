# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: greenly.spec.ts >> A. 庭作成からGLB配置・変形・保存・再読み込みまで
- Location: e2e\greenly.spec.ts:57:1

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('.garden-card').filter({ hasText: 'E2E roundtrip 1790412337385' }).getByRole('button', { name: 'E2E roundtrip 1790412337385を削除' })

```

# Page snapshot

```yaml
- generic [ref=f4e3]:
  - banner [ref=f4e4]:
    - link "Greenly 庭一覧へ" [ref=f4e5] [cursor=pointer]:
      - /url: /
      - generic [aria-hidden] [ref=f4e6]: G
      - generic [ref=f4e7]: Greenly
    - generic [ref=f4e8]:
      - heading "E2E roundtrip 1790412337385" [level=1] [ref=f4e9]
      - paragraph [ref=f4e10]: 10 × 8 m · 中心原点 · 1目盛り = 1m
    - generic [ref=f4e11]: 手動3Dエディタ
  - generic [ref=f4e12]:
    - button "← 庭一覧" [ref=f4e13] [cursor=pointer]
    - generic [ref=f4e14]: 保存済み
    - button "保存" [disabled] [ref=f4e17]
  - main [ref=f4e18]:
    - complementary [ref=f4e19]:
      - generic [ref=f4e20]:
        - generic [ref=f4e21]: CATALOG
        - heading "オブジェクト" [level=2] [ref=f4e22]
        - paragraph [ref=f4e23]: 種類を選び、地面をクリックして配置します。
      - generic [ref=f4e24]:
        - button "ベンチ 家具 1.6 × 0.85 × 0.65 m" [ref=f4e25] [cursor=pointer]:
          - generic [ref=f4e27]:
            - strong [ref=f4e28]: ベンチ
            - generic [ref=f4e29]: 家具
            - generic [ref=f4e30]: 1.6 × 0.85 × 0.65 m
        - button "レンガ 舗装 0.6 × 0.15 × 0.2 m" [ref=f4e31] [cursor=pointer]:
          - generic [ref=f4e33]:
            - strong [ref=f4e34]: レンガ
            - generic [ref=f4e35]: 舗装
            - generic [ref=f4e36]: 0.6 × 0.15 × 0.2 m
        - button "低木 植物 1.2 × 1.2 × 1.2 m" [ref=f4e37] [cursor=pointer]:
          - generic [ref=f4e39]:
            - strong [ref=f4e40]: 低木
            - generic [ref=f4e41]: 植物
            - generic [ref=f4e42]: 1.2 × 1.2 × 1.2 m
        - button "木 植物 2 × 4 × 2 m" [ref=f4e43] [cursor=pointer]:
          - generic [ref=f4e45]:
            - strong [ref=f4e46]: 木
            - generic [ref=f4e47]: 植物
            - generic [ref=f4e48]: 2 × 4 × 2 m
      - paragraph [ref=f4e49]: 開発用の簡易GLBモデルです。
    - region "庭の3D編集エリア" [ref=f4e50]:
      - generic [ref=f4e51]:
        - generic [ref=f4e52]: オブジェクトを選択して編集
        - generic [ref=f4e53]:
          - button "上から見る" [ref=f4e54] [cursor=pointer]
          - button "初期視点" [ref=f4e55] [cursor=pointer]
      - generic [ref=f4e56]:
        - generic [aria-hidden]: "N"
      - generic [ref=f4e60]:
        - generic [ref=f4e61]: 1 Three.js unit = 1m
        - generic [ref=f4e62]: "読み込み済み: 1 / 1"
        - generic [ref=f4e63]: 配置数 1 / 200
    - complementary [ref=f4e64]:
      - generic [ref=f4e65]:
        - generic [ref=f4e66]:
          - generic [ref=f4e67]:
            - generic [ref=f4e68]: IN YOUR GARDEN
            - heading "配置済み" [level=2] [ref=f4e69]
          - generic [ref=f4e70]: 1 / 200
        - list [ref=f4e71]:
          - listitem [ref=f4e72]:
            - button "01 木 X 1.5 · Z 0.2" [pressed] [ref=f4e73] [cursor=pointer]:
              - generic [ref=f4e74]: "01"
              - generic [ref=f4e75]:
                - strong [ref=f4e76]: 木
                - generic [ref=f4e77]: X 1.5 · Z 0.2
      - generic [ref=f4e78]:
        - generic [ref=f4e79]:
          - generic [ref=f4e80]: TRANSFORM
          - heading "プロパティ" [level=2] [ref=f4e81]
        - strong [ref=f4e84]: 木
        - group "変形ツール" [ref=f4e85]:
          - button "移動" [pressed] [ref=f4e86] [cursor=pointer]
          - button "回転" [ref=f4e87] [cursor=pointer]
          - button "拡縮" [ref=f4e88] [cursor=pointer]
        - generic [ref=f4e89]:
          - generic [ref=f4e90]:
            - text: X座標 (m)
            - spinbutton "X座標 (m)" [ref=f4e91]: "1.53"
          - generic [ref=f4e92]:
            - text: Z座標 (m)
            - spinbutton "Z座標 (m)" [ref=f4e93]: "0.16"
          - generic [ref=f4e94]:
            - text: Y回転 (度)
            - spinbutton "Y回転 (度)" [ref=f4e95]: "30"
          - generic [ref=f4e96]:
            - text: 倍率 (一様)
            - spinbutton "倍率 (一様)" [ref=f4e97]: "1.25"
        - paragraph [ref=f4e98]: 倍率 0.25〜3。Y座標とX/Z回転は固定です。
        - generic [ref=f4e99]:
          - button "複製" [ref=f4e100] [cursor=pointer]
          - button "削除" [ref=f4e101] [cursor=pointer]
```

# Test source

```ts
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
  114 |   const deleteButton = card.getByRole('button', { name: `${name}を削除` });
  115 |   page.once('dialog', (dialog) => dialog.dismiss());
> 116 |   await deleteButton.click();
      |                      ^ Error: locator.click: Test timeout of 90000ms exceeded.
  117 |   await expect(card.locator('.garden-card-open')).toBeVisible();
  118 |   expect((await request.get(`${apiBase}/gardens/${id}`)).status()).toBe(200);
  119 | 
  120 |   page.once('dialog', (dialog) => dialog.accept());
  121 |   await deleteButton.click();
  122 |   await expect(card).toHaveCount(0);
  123 |   expect((await request.get(`${apiBase}/gardens/${id}`)).status()).toBe(404);
  124 | });
  125 | 
  126 | test('B. 同一GLBの配置、独立移動、複製、削除', async ({ page, request }) => {
  127 |   const id = await createGarden(page, `E2E independent ${Date.now()}`);
  128 |   await placeTree(page, 0.42, 0.5);
  129 |   await page.getByTestId('asset-tree_oak').click();
  130 |   const canvas = page.locator('[data-testid="garden-canvas"] canvas');
  131 |   const bounds = await canvas.boundingBox();
  132 |   if (!bounds) throw new Error('3Dキャンバスが表示されていません。');
  133 |   await page.mouse.click(bounds.x + bounds.width * 0.70, bounds.y + bounds.height * 0.5);
  134 |   await expect(page.getByTestId('object-row-1')).toBeVisible();
  135 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  136 |   await page.getByTestId('save-garden').click();
  137 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  138 | 
  139 |   const original = await gardenJson(request, id);
  140 |   const originalIds = original.objects.map((object) => object.id);
  141 |   const secondPositionBefore = structuredClone(original.objects[1].position);
  142 |   await page.getByTestId('object-row-0').click();
  143 |   await page.getByTestId('position-x').fill('-1.5');
  144 |   await expect(page.getByTestId('position-x')).toHaveValue('-1.5');
  145 | 
  146 |   await page.getByRole('button', { name: '複製' }).click();
  147 |   await expect(page.getByTestId('object-row-2')).toBeVisible();
  148 |   const duplicateId = await page.getByTestId('object-row-2').getAttribute('data-object-id');
  149 |   expect(duplicateId).toBeTruthy();
  150 |   expect(originalIds).not.toContain(duplicateId);
  151 |   await page.getByTestId('position-x').fill('2.5');
  152 |   await page.getByTestId('object-row-0').click();
  153 |   await expect(page.getByTestId('position-x')).toHaveValue('-1.5');
  154 |   await page.getByTestId('object-row-1').click();
  155 |   await expect(page.getByTestId('position-x')).toHaveValue(String(Number(secondPositionBefore.x.toFixed(2))));
  156 |   await page.getByTestId('object-row-2').click();
  157 |   await page.getByRole('button', { name: '削除' }).click();
  158 |   await expect(page.getByTestId('object-row-2')).toHaveCount(0);
  159 |   await page.getByTestId('save-garden').click();
  160 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  161 |   const stored = await saveGardenArtifact(request, id, 'garden-independent.json');
  162 |   expect(stored.objects).toHaveLength(2);
  163 |   expect(stored.objects.map((object) => object.id)).toEqual(originalIds);
  164 |   expect(stored.objects[0].position.x).toBe(-1.5);
  165 |   expect(stored.objects[1].position).toEqual(secondPositionBefore);
  166 |   expect(new Set(stored.objects.map((object) => object.id)).size).toBe(2);
  167 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  168 | });
  169 | 
  170 | test('C. 不正な寸法と配置位置を拒否し既存庭を維持', async ({ page, request }) => {
  171 |   await page.goto('/');
  172 |   const invalidCreate = await request.post(`${apiBase}/gardens`, { data: { name: 'invalid size', width: 51, depth: 8 } });
  173 |   expect(invalidCreate.status()).toBe(400);
  174 | 
  175 |   const id = await createGarden(page, `E2E validation ${Date.now()}`);
  176 |   await placeTree(page);
  177 |   await page.getByTestId('save-garden').click();
  178 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  179 |   const before = await gardenJson(request, id);
  180 |   const invalidDocument = structuredClone(before);
  181 |   invalidDocument.objects[0].position.x = invalidDocument.width / 2 + 1;
  182 |   const rejected = await request.put(`${apiBase}/gardens/${id}`, { data: invalidDocument });
  183 |   expect(rejected.status()).toBe(400);
  184 |   expect(await gardenJson(request, id)).toEqual(before);
  185 | });
  186 | 
  187 | test('D. 保存失敗後の編集保持と再試行', async ({ page, request }) => {
  188 |   const id = await createGarden(page, `E2E retry ${Date.now()}`);
  189 |   await placeTree(page);
  190 |   await page.getByTestId('position-x').fill('1.2');
  191 |   await page.route(`**/api/gardens/${id}`, async (route) => {
  192 |     if (route.request().method() === 'PUT') await route.abort('failed');
  193 |     else await route.continue();
  194 |   });
  195 |   await page.getByTestId('save-garden').click();
  196 |   await expect(page.getByRole('alert')).toContainText('サーバーへ接続できませんでした');
  197 |   await expect(page.getByTestId('save-status')).toHaveText('未保存の変更');
  198 |   await expect(page.getByTestId('position-x')).toHaveValue('1.2');
  199 |   expect((await gardenJson(request, id)).revision).toBe(0);
  200 |   await page.unroute(`**/api/gardens/${id}`);
  201 |   await page.getByTestId('save-garden').click();
  202 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  203 |   expect((await gardenJson(request, id)).objects[0].position.x).toBe(1.2);
  204 | });
  205 | 
  206 | test('E. 古いrevisionの保存を競合として拒否しローカル編集を維持', async ({ page, request }) => {
  207 |   const id = await createGarden(page, `E2E conflict ${Date.now()}`);
  208 |   await placeTree(page);
  209 |   await page.getByTestId('save-garden').click();
  210 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  211 | 
  212 |   await page.getByTestId('position-x').fill('2');
  213 |   const serverDocument = await gardenJson(request, id);
  214 |   const competingDocument = structuredClone(serverDocument);
  215 |   competingDocument.objects[0].position.z = 1.25;
  216 |   const competingSave = await request.put(`${apiBase}/gardens/${id}`, { data: competingDocument });
```