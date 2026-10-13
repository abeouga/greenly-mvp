# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: kusakari-canvas.spec.ts >> G. GLB読み込み失敗後に再試行して復旧
- Location: e2e\kusakari-canvas.spec.ts:281:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('alert')
Expected substring: "モデルを読み込めません"
Error: strict mode violation: getByRole('alert') resolved to 2 elements:
    1) <div role="alert" class="editor-alert notice-error">…</div> aka getByText('個のモデルを読み込めません。配置一覧から削除するか再試行してください。モデルを再試行')
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
        - heading "E2E model retry 1791856765360" [level=1] [ref=f1e50]
        - generic [ref=f1e51]: 10 × 8 m
    - group "庭の計画と購入" [ref=f1e52]:
      - button "数量・施工範囲" [ref=f1e53] [cursor=pointer]
      - button "植物候補を相談" [ref=f1e54] [cursor=pointer]
      - button "完成イメージを確認" [ref=f1e55] [cursor=pointer]
      - button "配置したものから商品を探す" [ref=f1e56] [cursor=pointer]
      - button "ECへ戻る" [ref=f1e57] [cursor=pointer]
    - generic [ref=f1e58]:
      - generic [ref=f1e59]: 未保存の変更
      - button "保存" [ref=f1e62] [cursor=pointer]
  - alert [ref=f1e63]:
    - generic [ref=f1e64]: 1個のモデルを読み込めません。配置一覧から削除するか再試行してください。
    - button "モデルを再試行" [ref=f1e65] [cursor=pointer]
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
        - generic [ref=f1e109]: "読み込み済み: 0 / 1"
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
                - button "01 木 X 0.0 · Z -0.0" [pressed] [ref=f1e135] [cursor=pointer]:
                  - generic [ref=f1e136]: "01"
                  - generic [ref=f1e137]:
                    - strong [ref=f1e138]: 木
                    - generic [ref=f1e139]: X 0.0 · Z -0.0
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
  213 |   await expect(page.locator('.editor-alert[role="alert"]')).toContainText('サーバーへ接続できませんでした');
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
> 291 |   await expect(page.locator('.editor-alert[role="alert"]')).toContainText('モデルを読み込めません');
      |                                         ^ Error: expect(locator).toContainText(expected) failed
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
  314 |   await page.mouse.click(centerX, centerY);
  315 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  316 |   await page.getByTestId('tool-rotate').click();
  317 | 
  318 |   // Top view: 1.4m ring projected from an 18m camera with a 42 degree field of view.
  319 |   const radius = 1.4 * bounds.height / (2 * 17.94 * Math.tan(21 * Math.PI / 180));
  320 |   await mkdir(artifactDirectory, { recursive: true });
  321 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-rotation-idle.png'), fullPage: true });
  322 |   await page.mouse.move(centerX + radius, centerY);
  323 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-rotation-hover.png'), fullPage: true });
  324 |   await page.mouse.click(centerX + radius, centerY);
  325 |   await expect(page.getByTestId('tool-rotate')).toBeEnabled();
  326 |   await expect(page.getByTestId('rotation-y')).toHaveValue('0');
  327 |   await page.mouse.move(centerX + radius, centerY);
  328 |   await page.mouse.down();
  329 |   await page.mouse.move(centerX, centerY + radius, { steps: 6 });
  330 |   await expect(page.getByTestId('tool-rotate')).toBeDisabled();
  331 |   await page.keyboard.press('Escape');
  332 |   await page.mouse.up();
  333 |   await expect(page.getByTestId('tool-rotate')).toBeEnabled();
  334 |   await expect(page.getByTestId('rotation-y')).toHaveValue('0');
  335 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-rotation-cancel.png'), fullPage: true });
  336 |   await page.mouse.move(centerX + radius, centerY);
  337 |   await page.mouse.down();
  338 |   // Cross 90, 180 and 360 degrees while holding the pointer, then stop at 450.
  339 |   for (let step = 1; step <= 100; step += 1) {
  340 |     const angle = step / 100 * Math.PI * 2.5;
  341 |     await page.mouse.move(centerX + radius * Math.cos(angle), centerY - radius * Math.sin(angle));
  342 |   }
  343 |   await page.mouse.up();
  344 | 
  345 |   await expect(page.getByTestId('tool-rotate')).toBeEnabled();
  346 |   const degrees = Number(await page.getByTestId('rotation-y').inputValue());
  347 |   expect(degrees).toBeCloseTo(450, 0);
  348 |   await expect(page.getByTestId('save-status')).toHaveText('未保存の変更');
  349 |   await expect(page.getByTestId('object-row-1')).toHaveCount(0);
  350 |   expect((await gardenJson(request, id)).objects).toHaveLength(0);
  351 |   await page.getByTestId('save-garden').click();
  352 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  353 |   const stored = await saveGardenArtifact(request, id, 'garden-rotation-handle.json');
  354 |   expect(stored.objects).toHaveLength(1);
  355 |   expect(stored.objects[0].rotation.y).toBeCloseTo(degrees * Math.PI / 180, 2);
  356 |   expect(stored.objects[0].rotation.x).toBe(0);
  357 |   expect(stored.objects[0].rotation.z).toBe(0);
  358 | 
  359 |   await page.reload();
  360 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  361 |   await expect(page.getByTestId('rotation-y')).toHaveValue(String(degrees));
  362 |   await page.getByRole('button', { name: '上から見る' }).click();
  363 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-rotation-handle.png'), fullPage: true });
  364 | });
  365 | 
```