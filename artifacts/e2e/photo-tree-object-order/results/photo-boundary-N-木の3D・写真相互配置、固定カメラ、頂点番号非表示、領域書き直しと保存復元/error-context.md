# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: photo-boundary.spec.ts >> N. 木の3D・写真相互配置、固定カメラ、頂点番号非表示、領域書き直しと保存復元
- Location: e2e\photo-boundary.spec.ts:295:1

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 0
Received: -2.6756009114284804

Expected precision:    1
Expected difference: < 0.05
Received difference:   2.6756009114284804
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - link "Greenly 庭一覧へ" [ref=f1e5] [cursor=pointer]:
      - /url: /
      - generic [aria-hidden] [ref=f1e6]: G
      - generic [ref=f1e7]: Greenly
    - generic [ref=f1e8]:
      - heading "E2E photo boundary 1790868998405" [level=1] [ref=f1e9]
      - paragraph [ref=f1e10]: 10 × 8 m · 中心原点 · 1目盛り = 1m
    - generic [ref=f1e11]: 手動3Dエディタ
  - generic [ref=f1e12]:
    - button "← 庭一覧" [ref=f1e13] [cursor=pointer]
    - generic [ref=f1e14]: 保存済み
    - button "保存" [disabled] [ref=f1e17]
  - main [ref=f1e18]:
    - complementary [ref=f1e19]:
      - button "オブジェクトパネルを隠す" [expanded] [ref=f1e21] [cursor=pointer]:
        - generic [aria-hidden] [ref=f1e22]: ‹
      - generic [ref=f1e23]:
        - heading "カタログ" [level=2] [ref=f1e25]
        - generic [ref=f1e26]:
          - button "ベンチ 家具 1.6 × 0.85 × 0.65 m" [ref=f1e27] [cursor=pointer]:
            - generic [ref=f1e29]:
              - strong [ref=f1e30]: ベンチ
              - generic [ref=f1e31]: 家具
              - generic [ref=f1e32]: 1.6 × 0.85 × 0.65 m
          - button "レンガ 舗装 0.6 × 0.15 × 0.2 m" [ref=f1e33] [cursor=pointer]:
            - generic [ref=f1e35]:
              - strong [ref=f1e36]: レンガ
              - generic [ref=f1e37]: 舗装
              - generic [ref=f1e38]: 0.6 × 0.15 × 0.2 m
          - button "低木 植物 1.2 × 1.2 × 1.2 m" [ref=f1e39] [cursor=pointer]:
            - generic [ref=f1e41]:
              - strong [ref=f1e42]: 低木
              - generic [ref=f1e43]: 植物
              - generic [ref=f1e44]: 1.2 × 1.2 × 1.2 m
          - button "木 植物 2 × 4 × 2 m" [pressed] [ref=f1e45] [cursor=pointer]:
            - generic [ref=f1e47]:
              - strong [ref=f1e48]: 木
              - generic [ref=f1e49]: 植物
              - generic [ref=f1e50]: 2 × 4 × 2 m
        - paragraph [ref=f1e51]: 開発用の簡易GLBモデルです。
    - region "庭の3D編集エリア" [ref=f1e52]:
      - generic [ref=f1e53]:
        - generic [ref=f1e54]: 地面をクリックして配置
        - generic [ref=f1e55]:
          - button "写真＋設計" [pressed] [ref=f1e56] [cursor=pointer]
          - button "3D庭" [ref=f1e57] [cursor=pointer]
      - generic [ref=f1e58]:
        - generic [ref=f1e59]:
          - button "写真を外す" [ref=f1e60] [cursor=pointer]
          - button "庭の領域を書き直す" [ref=f1e61] [cursor=pointer]
          - generic [ref=f1e62] [cursor=pointer]:
            - checkbox "地面" [checked] [ref=f1e63]
            - text: 地面
          - generic [ref=f1e64] [cursor=pointer]:
            - checkbox "グリッド" [checked] [ref=f1e65]
            - text: グリッド
          - generic [ref=f1e66] [cursor=pointer]:
            - checkbox "配置" [checked] [ref=f1e67]
            - text: 配置
        - paragraph [ref=f1e68]: カタログで木などを選び、庭の領域内をクリックして配置します。木をクリックすると選択できます。輪郭の点はドラッグで調整できます。
      - generic [ref=f1e90]:
        - generic [ref=f1e91]: 1 Three.js unit = 1m
        - generic [ref=f1e92]: "読み込み済み: 2 / 2"
        - generic [ref=f1e93]: 配置数 2 / 200
    - complementary [ref=f1e94]:
      - button "配置済み・プロパティパネルを隠す" [expanded] [ref=f1e96] [cursor=pointer]:
        - generic [aria-hidden] [ref=f1e97]: ›
      - generic [ref=f1e98]:
        - generic [ref=f1e99]:
          - generic [ref=f1e100]:
            - generic [ref=f1e101]:
              - generic [ref=f1e102]: IN YOUR GARDEN
              - heading "配置済み" [level=2] [ref=f1e103]
            - generic [ref=f1e104]: 2 / 200
          - list [ref=f1e105]:
            - listitem [ref=f1e106]:
              - button "01 木 X 0.0 · Z -0.0" [ref=f1e107] [cursor=pointer]:
                - generic [ref=f1e108]: "01"
                - generic [ref=f1e109]:
                  - strong [ref=f1e110]: 木
                  - generic [ref=f1e111]: X 0.0 · Z -0.0
            - listitem [ref=f1e112]:
              - button "02 木 X -2.7 · Z 1.8" [pressed] [ref=f1e113] [cursor=pointer]:
                - generic [ref=f1e114]: "02"
                - generic [ref=f1e115]:
                  - strong [ref=f1e116]: 木
                  - generic [ref=f1e117]: X -2.7 · Z 1.8
        - generic [ref=f1e118]:
          - generic [ref=f1e119]:
            - generic [ref=f1e120]: TRANSFORM
            - heading "プロパティ" [level=2] [ref=f1e121]
          - strong [ref=f1e124]: 木
          - group "変形ツール" [ref=f1e125]:
            - button "移動" [pressed] [ref=f1e126] [cursor=pointer]
            - button "回転" [ref=f1e127] [cursor=pointer]
            - button "拡縮" [ref=f1e128] [cursor=pointer]
          - generic [ref=f1e129]:
            - generic [ref=f1e130]:
              - text: X座標 (m)
              - spinbutton "X座標 (m)" [ref=f1e131]: "-2.68"
            - generic [ref=f1e132]:
              - text: Z座標 (m)
              - spinbutton "Z座標 (m)" [ref=f1e133]: "1.83"
            - generic [ref=f1e134]:
              - generic [ref=f1e135]:
                - text: Y回転 (度)
                - spinbutton "Y回転 (度)" [ref=f1e136]: "0"
              - button "角度を0度に戻す" [disabled] [ref=f1e137]: 0°へ戻す
            - generic [ref=f1e138]:
              - text: 倍率 (一様)
              - spinbutton "倍率 (一様)" [ref=f1e139]: "1"
          - paragraph [ref=f1e140]: 円形ハンドルをドラッグして回転できます。倍率 0.25〜3。Y座標とX/Z回転は固定です。
          - generic [ref=f1e141]:
            - button "複製" [ref=f1e142] [cursor=pointer]
            - button "削除" [ref=f1e143] [cursor=pointer]
```

# Test source

```ts
  244 |     await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(vertices.length);
  245 |     await expect(page.getByTestId('photo-ground')).toBeVisible();
  246 |     await page.screenshot({ path: resolve(artifactDirectory, `garden-photo-${name}.png`), fullPage: true });
  247 |   });
  248 | }
  249 | 
  250 | test('L. 旧投影データを復元し、元の四隅を越える輪郭へ描き直して保存できる', async ({ page, request }) => {
  251 |   const { id, imageDataUrl } = await preparePhoto(page);
  252 |   const legacy = await gardenJson(request, id);
  253 |   legacy.photo = { dataUrl: imageDataUrl, imageWidth: 800, imageHeight: 600,
  254 |     corners: corners.map(([x, y]) => ({ x, y })), boundary: outline.map(([x, y]) => ({ x, y })) };
  255 |   const response = await request.put(`${apiBase}/gardens/${id}`, { data: legacy });
  256 |   expect(response.ok()).toBeTruthy();
  257 |   page.once('dialog', (dialog) => dialog.accept());
  258 |   await page.reload();
  259 |   await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(6);
  260 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  261 |   expect((await gardenJson(request, id)).photo).toEqual(legacy.photo);
  262 |   await page.getByRole('button', { name: '庭の領域を書き直す' }).click();
  263 |   for (const [x, y] of [[0.03, 0.95], [0.97, 0.95], [0.97, 0.05], [0.03, 0.05]]) await clickImage(page, x, y);
  264 |   await page.getByTestId('photo-vertex-1').click();
  265 |   await expect(page.getByTestId('photo-ground')).toBeVisible();
  266 |   await page.getByTestId('save-garden').click();
  267 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  268 |   const saved = await saveArtifact(request, id, 'garden-photo-legacy-redraw.json');
  269 |   expect(saved.revision).toBe(2);
  270 |   expect(saved.photo!.boundary).toHaveLength(4);
  271 |   expect(saved.photo!.corners[0].x).toBeCloseTo(0.03, 2);
  272 |   await page.reload();
  273 |   await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(4);
  274 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-legacy-redraw.png'), fullPage: true });
  275 | });
  276 | 
  277 | test('M. 始点近くでも別の頂点のクリックでは自動確定しない', async ({ page, request }) => {
  278 |   await page.setViewportSize({ width: 1120, height: 900 });
  279 |   const { id } = await preparePhoto(page);
  280 |   for (const [x, y] of [[0.3, 0.8], [0.7, 0.8], [0.7, 0.3], [0.32125, 0.797]]) await clickImage(page, x, y);
  281 |   await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(4);
  282 |   await expect(page.getByTestId('save-status')).toHaveText('輪郭を描画中');
  283 |   await expect(page.getByTestId('photo-ground')).toHaveCount(0);
  284 |   await page.getByTestId('photo-vertex-1').click();
  285 |   await expect(page.getByTestId('photo-ground')).toBeVisible();
  286 |   await page.getByTestId('save-garden').click();
  287 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  288 |   expect((await saveArtifact(request, id, 'garden-photo-close-vertices.json')).photo!.boundary).toHaveLength(4);
  289 |   await page.reload();
  290 |   await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(4);
  291 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-close-vertices.png'), fullPage: true });
  292 | });
  293 | 
  294 | 
  295 | test('N. 木の3D・写真相互配置、固定カメラ、頂点番号非表示、領域書き直しと保存復元', async ({ page, request }) => {
  296 |   const { id, imageDataUrl } = await preparePhoto(page);
  297 |   for (const [x, y] of outline) await clickImage(page, x, y);
  298 |   await expect(page.getByTestId('photo-vertex-number')).toHaveCount(6);
  299 |   await page.getByTestId('photo-vertex-1').click();
  300 |   await expect(page.getByTestId('photo-vertex-number')).toHaveCount(0);
  301 |   await expect(page.getByRole('button', { name: '庭の領域を書き直す' })).toBeVisible();
  302 | 
  303 |   await page.getByRole('button', { name: '3D庭', exact: true }).click();
  304 |   await page.getByRole('button', { name: '上から見る' }).click();
  305 |   await page.getByTestId('asset-tree_oak').click();
  306 |   const bounds = await page.locator('[data-testid="garden-canvas"] canvas').boundingBox();
  307 |   if (!bounds) throw new Error('3D庭が表示されていません。');
  308 |   await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  309 |   await expect(page.getByTestId('object-row-0')).toBeVisible();
  310 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  311 |   await page.getByRole('button', { name: '写真＋設計' }).click();
  312 |   await expect(page.getByTestId('photo-model-canvas')).toHaveAttribute('data-object-count', '1');
  313 |   await expect(page.locator('[data-testid="photo-model-canvas"] canvas')).toBeVisible();
  314 |   const withTree = await page.locator('.photo-stage').screenshot();
  315 |   await page.getByLabel('配置', { exact: true }).uncheck();
  316 |   const withoutTree = await page.locator('.photo-stage').screenshot();
  317 |   expect(withTree.equals(withoutTree)).toBe(false);
  318 |   await page.getByLabel('配置', { exact: true }).check();
  319 | 
  320 |   await page.setViewportSize({ width: 1280, height: 900 });
  321 |   await clickImage(page, 0.3, 0.65);
  322 |   await expect(page.getByTestId('object-row-1')).toBeVisible();
  323 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  324 |   await expect(page.getByTestId('photo-model-canvas')).toHaveAttribute('data-object-count', '2');
  325 |   await clickImage(page, 0.95, 0.1);
  326 |   await expect(page.getByTestId('object-row-2')).toHaveCount(0);
  327 |   await page.getByTestId('object-row-0').click();
  328 |   await clickImage(page, 0.3, 0.63);
  329 |   await expect(page.getByTestId('object-row-1')).toHaveAttribute('aria-pressed', 'true');
  330 |   await expect(page.getByTestId('object-row-2')).toHaveCount(0);
  331 |   const beforeDrag = await page.locator('.photo-stage').screenshot();
  332 |   const a = await screenPoint(page, 0.72, 0.72), b = await screenPoint(page, 0.6, 0.72);
  333 |   await page.mouse.move(a.x, a.y);
  334 |   await page.mouse.down();
  335 |   await page.mouse.move(b.x, b.y, { steps: 8 });
  336 |   await page.mouse.up();
  337 |   expect((await page.locator('.photo-stage').screenshot()).equals(beforeDrag)).toBe(true);
  338 |   await page.getByTestId('save-garden').click();
  339 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  340 |   const saved = await saveArtifact(request, id, 'garden-photo-trees.json');
  341 |   expect(saved.photo?.dataUrl).toBe(imageDataUrl);
  342 |   expect(saved.objects).toHaveLength(2);
  343 |   expect(saved.objects.every((object) => object.assetId === 'tree_oak')).toBe(true);
> 344 |   expect(saved.objects[0].position.x).toBeCloseTo(0, 1);
      |                                       ^ Error: expect(received).toBeCloseTo(expected, precision)
  345 |   expect(saved.objects[0].position.z).toBeCloseTo(0, 1);
  346 |   expect(saved.objects[1].position.x).toBeCloseTo((0.3 - 0.15) / 0.65 * saved.width - saved.width / 2, 1);
  347 |   expect(saved.objects[1].position.z).toBeCloseTo((0.65 - 0.25) / 0.55 * saved.depth - saved.depth / 2, 1);
  348 |   await page.reload();
  349 |   await expect(page.getByTestId('photo-vertex-number')).toHaveCount(0);
  350 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  351 |   await expect(page.getByTestId('photo-model-canvas')).toHaveAttribute('data-object-count', '2');
  352 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-trees.png'), fullPage: true });
  353 |   await page.getByRole('button', { name: '3D庭', exact: true }).click();
  354 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  355 |   await expect(page.getByTestId('object-row-1')).toBeVisible();
  356 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-trees-3d.png'), fullPage: true });
  357 |   await page.getByRole('button', { name: '写真＋設計' }).click();
  358 |   await page.getByRole('button', { name: '庭の領域を書き直す' }).click();
  359 |   await clickImage(page, 0.1, 0.9);
  360 |   await expect(page.getByTestId('photo-vertex-number')).toHaveCount(1);
  361 |   await expect(page.getByTestId('save-garden')).toBeDisabled();
  362 |   expect(await gardenJson(request, id)).toEqual(saved);
  363 |   await page.getByRole('button', { name: '輪郭の描画を取消' }).click();
  364 |   await expect(page.getByTestId('photo-vertex-number')).toHaveCount(0);
  365 |   await expect(page.getByTestId('photo-model-canvas')).toHaveAttribute('data-object-count', '2');
  366 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  367 |   await page.getByRole('button', { name: '庭の領域を書き直す' }).click();
  368 |   for (const [x, y] of [[0.1, 0.9], [0.9, 0.9], [0.9, 0.15], [0.1, 0.15]]) await clickImage(page, x, y);
  369 |   await page.getByTestId('photo-vertex-1').click();
  370 |   await expect(page.getByTestId('photo-vertex-number')).toHaveCount(0);
  371 |   await page.getByTestId('save-garden').click();
  372 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  373 |   const redrawn = await saveArtifact(request, id, 'garden-photo-trees-redrawn.json');
  374 |   expect(redrawn.photo?.boundary).toHaveLength(4);
  375 |   expect(redrawn.objects).toEqual(saved.objects);
  376 |   await page.reload();
  377 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  378 |   await expect(page.getByTestId('photo-vertex-number')).toHaveCount(0);
  379 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-trees-redrawn.png'), fullPage: true });
  380 | });
  381 | 
```