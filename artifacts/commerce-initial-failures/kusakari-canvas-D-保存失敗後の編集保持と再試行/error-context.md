# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kusakari-canvas.spec.ts >> D. 保存失敗後の編集保持と再試行
- Location: e2e\kusakari-canvas.spec.ts:203:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('alert')
Expected substring: "サーバーへ接続できませんでした"
Error: strict mode violation: getByRole('alert') resolved to 2 elements:
    1) <div role="alert" class="editor-alert notice-error">…</div> aka getByText('サーバーへ接続できませんでした。編集内容は保持されています。確認後に再試行してください。再試行')
    2) <div role="alert" class="notice-error">…</div> aka getByText('ECへ接続できません。ECの起動と接続設定を確認してください。カートを再取得')

Call log:
  - Expect "toContainText" getByRole('alert') with timeout 10000ms
  - waiting for getByRole('alert')

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - generic [ref=f1e4]:
    - generic [ref=f1e5]:
      - generic [ref=f1e6]: GREEN FOR YOUR EVERYDAY
      - generic [ref=f1e7]: ひと鉢からはじまる、緑のある暮らし。
      - generic [ref=f1e8]: 植物のオンラインストア
    - banner [ref=f1e9]:
      - link "Kusakari トップへ" [ref=f1e10] [cursor=pointer]:
        - /url: http://127.0.0.1:15186/
        - generic [ref=f1e12]: kusakari.
      - navigation "メインナビゲーション" [ref=f1e13]:
        - link "植物を探す" [ref=f1e14] [cursor=pointer]:
          - /url: http://127.0.0.1:15186/#plants
        - link "店舗を探す" [ref=f1e15] [cursor=pointer]:
          - /url: http://127.0.0.1:15186/?panel=stores
        - link "Canvas" [ref=f1e16] [cursor=pointer]:
          - /url: http://127.0.0.1:54393/
        - link "Kusakariについて" [ref=f1e17] [cursor=pointer]:
          - /url: http://127.0.0.1:15186/?panel=guide
        - link "出店者" [ref=f1e18] [cursor=pointer]:
          - /url: http://127.0.0.1:15186/seller
      - generic [ref=f1e19]:
        - link "ログイン" [ref=f1e20] [cursor=pointer]:
          - /url: http://127.0.0.1:15186/?panel=login
        - link "アカウント" [ref=f1e24] [cursor=pointer]:
          - /url: http://127.0.0.1:15186/account
        - link "管理者画面" [ref=f1e30] [cursor=pointer]:
          - /url: http://127.0.0.1:15186/operator
      - generic [ref=f1e31]:
        - link "注文履歴" [ref=f1e32] [cursor=pointer]:
          - /url: http://127.0.0.1:15186/?panel=orders
        - link "ECでカートを確認" [ref=f1e37] [cursor=pointer]:
          - /url: http://127.0.0.1:15186/cart
          - generic "カートの商品数はECで確認できます" [ref=f1e43]: —
  - banner [ref=f1e44]:
    - generic [ref=f1e45]:
      - button "← 庭一覧" [ref=f1e46] [cursor=pointer]: 庭一覧
      - generic [ref=f1e49]:
        - heading "E2E retry 1791856712067" [level=1] [ref=f1e50]
        - generic [ref=f1e51]: 10 × 8 m
    - group "庭の計画と購入" [ref=f1e52]:
      - button "数量・施工範囲" [ref=f1e53] [cursor=pointer]
      - button "植物候補を相談" [ref=f1e54] [cursor=pointer]
      - button "完成イメージを確認" [ref=f1e55] [cursor=pointer]
      - button "配置したものから商品を探す" [ref=f1e56] [cursor=pointer]
      - button "ECへ戻る" [ref=f1e57] [cursor=pointer]
    - generic [ref=f1e58]:
      - generic [ref=f1e59]: 未保存の変更
      - button "再試行して保存" [ref=f1e62] [cursor=pointer]
  - alert [ref=f1e63]:
    - generic [ref=f1e64]: サーバーへ接続できませんでした。編集内容は保持されています。確認後に再試行してください。
    - button "再試行" [ref=f1e65] [cursor=pointer]
  - main [ref=f1e66]:
    - region "庭の3D編集エリア" [ref=f1e67]:
      - generic [ref=f1e68]:
        - group "表示モード" [ref=f1e69]:
          - button "写真＋設計" [ref=f1e70] [cursor=pointer]
          - button "3D庭" [pressed] [ref=f1e73] [cursor=pointer]
        - generic [ref=f1e76]:
          - button "土台設定" [ref=f1e77] [cursor=pointer]
          - button "上から見る" [ref=f1e80] [cursor=pointer]
          - button "初期視点" [ref=f1e83] [cursor=pointer]
          - button "商品・カートパネルを隠す" [expanded] [ref=f1e86] [cursor=pointer]:
            - generic [ref=f1e89]: 商品・カート
      - generic [ref=f1e90]:
        - generic "配置物の編集" [ref=f1e94]:
          - group "変形ツール" [ref=f1e95]:
            - button "移動" [pressed] [ref=f1e96] [cursor=pointer]
            - button "回転" [ref=f1e99] [cursor=pointer]
            - button "拡縮" [ref=f1e102] [cursor=pointer]
          - group [ref=f1e105]:
            - generic "詳細" [ref=f1e106] [cursor=pointer]
        - generic [aria-hidden]: "N"
      - generic [ref=f1e107]:
        - generic [ref=f1e108]: 木を配置中 · 地面をクリック / Escで終了
        - generic [ref=f1e109]: "読み込み済み: 1 / 1"
        - generic [ref=f1e110]: 1目盛り = 1m
    - complementary "商品候補とカート" [ref=f1e111]:
      - generic [ref=f1e112]:
        - heading "庭の商品とカート" [level=2] [ref=f1e113]
        - button "商品・カートパネルを閉じる" [ref=f1e114] [cursor=pointer]
      - tablist "商品候補とカートの切替" [ref=f1e117]:
        - tab "商品候補" [selected] [ref=f1e118]
        - tab "カート内容" [ref=f1e119]
      - generic [ref=f1e120]:
        - alert [ref=f1e121]:
          - paragraph [ref=f1e122]: ECへ接続できません。ECの起動と接続設定を確認してください。
          - button "カートを再取得" [ref=f1e123]
        - tabpanel "商品候補" [ref=f1e124]:
          - heading "木 配置 1点" [level=3] [ref=f1e126]:
            - text: 木
            - generic [ref=f1e127]: 配置 1点
          - generic [ref=f1e128]:
            - generic [ref=f1e129]:
              - heading "配置したもの" [level=3] [ref=f1e131]
              - generic [ref=f1e132]: 1 / 200
            - list [ref=f1e133]:
              - listitem [ref=f1e134]:
                - button "01 木 X 1.2 · Z -0.0" [pressed] [ref=f1e135] [cursor=pointer]:
                  - generic [ref=f1e136]: "01"
                  - generic [ref=f1e137]:
                    - strong [ref=f1e138]: 木
                    - generic [ref=f1e139]: X 1.2 · Z -0.0
    - complementary "素材カタログ" [ref=f1e140]:
      - generic [ref=f1e141]:
        - heading "素材を追加" [level=2] [ref=f1e142]
        - generic [ref=f1e145]: 同じ素材を続けて配置できます
        - button "オブジェクトパネルを隠す" [expanded] [ref=f1e146]: しまう
      - generic [ref=f1e151]:
        - button "ベンチ 家具 1.6 × 0.85 × 0.65 m" [ref=f1e152] [cursor=pointer]:
          - generic [ref=f1e160]:
            - strong [ref=f1e161]: ベンチ
            - generic [ref=f1e162]: 家具
            - generic [ref=f1e163]: 1.6 × 0.85 × 0.65 m
        - button "レンガ 舗装 0.6 × 0.15 × 0.2 m" [ref=f1e164] [cursor=pointer]:
          - generic [ref=f1e170]:
            - strong [ref=f1e171]: レンガ
            - generic [ref=f1e172]: 舗装
            - generic [ref=f1e173]: 0.6 × 0.15 × 0.2 m
        - button "低木 植物 1.2 × 1.2 × 1.2 m" [ref=f1e174] [cursor=pointer]:
          - generic [ref=f1e180]:
            - strong [ref=f1e181]: 低木
            - generic [ref=f1e182]: 植物
            - generic [ref=f1e183]: 1.2 × 1.2 × 1.2 m
        - button "木 植物 · 配置中 2 × 4 × 2 m" [pressed] [ref=f1e184] [cursor=pointer]:
          - generic [ref=f1e186]:
            - strong [ref=f1e187]: 木
            - generic [ref=f1e188]: 植物 · 配置中
            - generic [ref=f1e189]: 2 × 4 × 2 m
```

# Test source

```ts
  113 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  114 |   await expect(page.getByTestId('position-x')).toHaveValue(String(Number(savedX.toFixed(2))));
  115 | 
  116 |   await page.getByRole('button', { name: '← 庭一覧' }).click();
  117 |   await page.waitForURL('/');
  118 |   const deleteButton = card.getByRole('button', { name: `${name}のオプション` });
  119 |   await deleteButton.click();
  120 |   await card.getByRole('button', { name: '削除', exact: true }).click();
  121 |   await expect(page.getByRole('dialog', { name: 'この庭を削除しますか？' })).toContainText(name);
  122 |   await page.getByRole('button', { name: '取消', exact: true }).click();
  123 |   await expect(card.locator('.garden-card-open')).toBeVisible();
  124 |   expect((await request.get(`${apiBase}/gardens/${id}`)).status()).toBe(200);
  125 | 
  126 |   await deleteButton.click();
  127 |   await card.getByRole('button', { name: '削除', exact: true }).click();
  128 |   await page.getByRole('button', { name: '庭を削除', exact: true }).click();
  129 |   await expect(card).toHaveCount(0);
  130 |   expect((await request.get(`${apiBase}/gardens/${id}`)).status()).toBe(404);
  131 | });
  132 | 
  133 | test('B. 同一GLBの配置、独立移動、複製、削除', async ({ page, request }) => {
  134 |   const id = await createGarden(page, `E2E independent ${Date.now()}`);
  135 |   await placeTree(page, 0.42, 0.5);
  136 |   await page.getByTestId('asset-tree_oak').click();
  137 |   const canvas = page.locator('[data-testid="garden-canvas"] canvas');
  138 |   const bounds = await canvas.boundingBox();
  139 |   if (!bounds) throw new Error('3Dキャンバスが表示されていません。');
  140 |   await page.mouse.click(bounds.x + bounds.width * 0.65, bounds.y + bounds.height * 0.5);
  141 |   await expect(page.getByTestId('object-row-1')).toBeVisible();
  142 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  143 |   await page.getByTestId('save-garden').click();
  144 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  145 | 
  146 |   const original = await gardenJson(request, id);
  147 |   const firstId = await page.getByTestId('object-row-0').getAttribute('data-object-id');
  148 |   const secondId = await page.getByTestId('object-row-1').getAttribute('data-object-id');
  149 |   if (!firstId || !secondId) throw new Error('配置一覧からオブジェクトIDを取得できませんでした。');
  150 |   const originalIds = [firstId, secondId];
  151 |   const secondPositionBefore = structuredClone(original.objects.find((object) => object.id === secondId)?.position);
  152 |   if (!secondPositionBefore) throw new Error('2個目の保存位置を取得できませんでした。');
  153 |   await page.getByTestId('object-row-0').click();
  154 |   if (!await page.locator('.object-details').evaluate((element) => (element as HTMLDetailsElement).open)) await page.getByTestId('object-details-toggle').click();
  155 |   await page.getByTestId('position-x').fill('-1.5');
  156 |   await expect(page.getByTestId('position-x')).toHaveValue('-1.5');
  157 | 
  158 |   if (!await page.locator('.object-details').evaluate((element) => (element as HTMLDetailsElement).open)) await page.getByTestId('object-details-toggle').click();
  159 |   await page.getByRole('button', { name: '複製' }).click();
  160 |   await expect(page.getByTestId('object-row-2')).toBeVisible();
  161 |   const duplicateId = await page.getByTestId('object-row-2').getAttribute('data-object-id');
  162 |   expect(duplicateId).toBeTruthy();
  163 |   expect(originalIds).not.toContain(duplicateId);
  164 |   if (!await page.locator('.object-details').evaluate((element) => (element as HTMLDetailsElement).open)) await page.getByTestId('object-details-toggle').click();
  165 |   await page.getByTestId('position-x').fill('2.5');
  166 |   await page.getByTestId('object-row-0').click();
  167 |   await expect(page.getByTestId('position-x')).toHaveValue('-1.5');
  168 |   await page.getByTestId('object-row-1').click();
  169 |   await expect(page.getByTestId('position-x')).toHaveValue(String(Number(secondPositionBefore.x.toFixed(2))));
  170 |   await page.getByTestId('object-row-2').click();
  171 |   if (!await page.locator('.object-details').evaluate((element) => (element as HTMLDetailsElement).open)) await page.getByTestId('object-details-toggle').click();
  172 |   await page.getByRole('button', { name: '削除' }).click();
  173 |   await expect(page.getByTestId('object-row-2')).toHaveCount(0);
  174 |   await page.getByTestId('save-garden').click();
  175 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  176 |   const stored = await saveGardenArtifact(request, id, 'garden-independent.json');
  177 |   expect(stored.objects).toHaveLength(2);
  178 |   const firstStored = stored.objects.find((object) => object.id === firstId);
  179 |   const secondStored = stored.objects.find((object) => object.id === secondId);
  180 |   expect(firstStored?.position.x).toBe(-1.5);
  181 |   expect(secondStored?.position).toEqual(secondPositionBefore);
  182 |   expect(new Set(stored.objects.map((object) => object.id)).size).toBe(2);
  183 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  184 | });
  185 | 
  186 | test('C. 不正な寸法と配置位置を拒否し既存庭を維持', async ({ page, request }) => {
  187 |   await page.goto('/');
  188 |   const invalidCreate = await request.post(`${apiBase}/gardens`, { data: { name: 'invalid size', width: 51, depth: 8 } });
  189 |   expect(invalidCreate.status()).toBe(400);
  190 | 
  191 |   const id = await createGarden(page, `E2E validation ${Date.now()}`);
  192 |   await placeTree(page);
  193 |   await page.getByTestId('save-garden').click();
  194 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  195 |   const before = await gardenJson(request, id);
  196 |   const invalidDocument = structuredClone(before);
  197 |   invalidDocument.objects[0].position.x = invalidDocument.width / 2 + 1;
  198 |   const rejected = await request.put(`${apiBase}/gardens/${id}`, { data: invalidDocument });
  199 |   expect(rejected.status()).toBe(400);
  200 |   expect(await gardenJson(request, id)).toEqual(before);
  201 | });
  202 | 
  203 | test('D. 保存失敗後の編集保持と再試行', async ({ page, request }) => {
  204 |   const id = await createGarden(page, `E2E retry ${Date.now()}`);
  205 |   await placeTree(page);
  206 |   if (!await page.locator('.object-details').evaluate((element) => (element as HTMLDetailsElement).open)) await page.getByTestId('object-details-toggle').click();
  207 |   await page.getByTestId('position-x').fill('1.2');
  208 |   await page.route(`**/api/gardens/${id}`, async (route) => {
  209 |     if (route.request().method() === 'PUT') await route.abort('failed');
  210 |     else await route.continue();
  211 |   });
  212 |   await page.getByTestId('save-garden').click();
> 213 |   await expect(page.locator('.editor-alert[role="alert"]')).toContainText('サーバーへ接続できませんでした');
      |                                         ^ Error: expect(locator).toContainText(expected) failed
  214 |   await expect(page.getByTestId('save-status')).toHaveText('未保存の変更');
  215 |   await expect(page.getByTestId('position-x')).toHaveValue('1.2');
  216 |   expect((await gardenJson(request, id)).revision).toBe(0);
  217 |   await page.unroute(`**/api/gardens/${id}`);
  218 |   await page.getByTestId('save-garden').click();
  219 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  220 |   expect((await gardenJson(request, id)).objects[0].position.x).toBe(1.2);
  221 | });
  222 | 
  223 | test('E. 古いrevisionの保存を競合として拒否しローカル編集を維持', async ({ page, request }) => {
  224 |   const id = await createGarden(page, `E2E conflict ${Date.now()}`);
  225 |   await placeTree(page);
  226 |   await page.getByTestId('save-garden').click();
  227 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  228 | 
  229 |   if (!await page.locator('.object-details').evaluate((element) => (element as HTMLDetailsElement).open)) await page.getByTestId('object-details-toggle').click();
  230 |   await page.getByTestId('position-x').fill('2');
  231 |   const serverDocument = await gardenJson(request, id);
  232 |   const competingDocument = structuredClone(serverDocument);
  233 |   competingDocument.objects[0].position.z = 1.25;
  234 |   const competingSave = await request.put(`${apiBase}/gardens/${id}`, { data: competingDocument });
  235 |   expect(competingSave.ok()).toBeTruthy();
  236 | 
  237 |   await page.getByTestId('save-garden').click();
  238 |   await expect(page.locator('.editor-alert[role="alert"]')).toContainText('別の保存結果と競合しました');
  239 |   await expect(page.getByTestId('save-status')).toHaveText('未保存の変更');
  240 |   await expect(page.getByTestId('position-x')).toHaveValue('2');
  241 |   const serverAfterConflict = await gardenJson(request, id);
  242 |   expect(serverAfterConflict.revision).toBe(serverDocument.revision + 1);
  243 |   expect(serverAfterConflict.objects[0].position.z).toBe(1.25);
  244 |   await saveGardenArtifact(request, id, 'garden-conflict.json');
  245 | });
  246 | 
  247 | test('F. 4種類のGLBを配置して保存・再読み込み', async ({ page, request }) => {
  248 |   const id = await createGarden(page, `E2E catalog ${Date.now()}`);
  249 |   await page.getByRole('button', { name: '上から見る' }).click();
  250 |   const canvas = page.locator('[data-testid="garden-canvas"] canvas');
  251 |   const bounds = await canvas.boundingBox();
  252 |   if (!bounds) throw new Error('3Dキャンバスが表示されていません。');
  253 | 
  254 |   // 庭はCanvas全体より小さく投影されるため、中央の庭面内をクリックします。
  255 |   const placements = [
  256 |     { assetId: 'tree_oak', x: 0.44, y: 0.45 },
  257 |     { assetId: 'shrub_boxwood', x: 0.56, y: 0.45 },
  258 |     { assetId: 'brick_paver', x: 0.5, y: 0.60 },
  259 |     { assetId: 'bench_wood', x: 0.44, y: 0.65 },
  260 |   ];
  261 |   for (const [index, placement] of placements.entries()) {
  262 |     await page.getByTestId(`asset-${placement.assetId}`).click();
  263 |     await page.mouse.click(bounds.x + bounds.width * placement.x, bounds.y + bounds.height * placement.y);
  264 |     await expect(page.getByTestId(`object-row-${index}`)).toBeVisible();
  265 |     await expect(page.getByTestId('model-loaded')).toHaveText(`読み込み済み: ${index + 1} / ${index + 1}`);
  266 |   }
  267 | 
  268 |   await page.getByTestId('save-garden').click();
  269 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  270 |   const stored = await saveGardenArtifact(request, id, 'garden-catalog.json');
  271 |   expect(stored.objects).toHaveLength(4);
  272 |   expect([...new Set(stored.objects.map((object) => object.assetId))].sort())
  273 |     .toEqual(placements.map((placement) => placement.assetId).sort());
  274 | 
  275 |   await page.reload();
  276 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 4 / 4');
  277 |   await page.getByRole('button', { name: '上から見る' }).click();
  278 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-catalog.png'), fullPage: true });
  279 | });
  280 | 
  281 | test('G. GLB読み込み失敗後に再試行して復旧', async ({ page, request }) => {
  282 |   const id = await createGarden(page, `E2E model retry ${Date.now()}`);
  283 |   await page.getByRole('button', { name: '上から見る' }).click();
  284 |   await page.route('**/models/tree-oak.glb', (route) => route.abort('failed'));
  285 |   await page.getByTestId('asset-tree_oak').click();
  286 |   const canvas = page.locator('[data-testid="garden-canvas"] canvas');
  287 |   const bounds = await canvas.boundingBox();
  288 |   if (!bounds) throw new Error('3Dキャンバスが表示されていません。');
  289 |   await page.mouse.click(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5);
  290 |   await expect(page.getByTestId('object-row-0')).toBeVisible();
  291 |   await expect(page.locator('.editor-alert[role="alert"]')).toContainText('モデルを読み込めません');
  292 |   await expect(page.getByRole('button', { name: 'モデルを再試行' })).toBeVisible();
  293 | 
  294 |   await page.unroute('**/models/tree-oak.glb');
  295 |   await page.getByRole('button', { name: 'モデルを再試行' }).click();
  296 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  297 |   await expect(page.locator('.editor-alert[role="alert"]')).toHaveCount(0);
  298 |   await page.getByTestId('save-garden').click();
  299 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  300 |   const stored = await saveGardenArtifact(request, id, 'garden-model-retry.json');
  301 |   expect(stored.objects).toHaveLength(1);
  302 |   expect(stored.objects[0].assetId).toBe('tree_oak');
  303 | });
  304 | 
  305 | test('H. 回転リングのドラッグを保存して再読み込みできる', async ({ page, request }) => {
  306 |   const id = await createGarden(page, `E2E rotation handle ${Date.now()}`);
  307 |   await page.getByRole('button', { name: '上から見る' }).click();
  308 |   await page.getByTestId('asset-bench_wood').click();
  309 |   const canvas = page.locator('[data-testid="garden-canvas"] canvas');
  310 |   const bounds = await canvas.boundingBox();
  311 |   if (!bounds) throw new Error('3Dキャンバスが表示されていません。');
  312 |   const centerX = bounds.x + bounds.width / 2;
  313 |   const centerY = bounds.y + bounds.height / 2;
```