# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: photo-boundary.spec.ts >> L. 旧投影データを復元し、元の四隅を越える輪郭へ描き直して保存できる
- Location: e2e\photo-boundary.spec.ts:250:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 2

@@ -23,10 +23,11 @@
      Object {
        "x": 0.25,
        "y": 0.25,
      },
    ],
+   "calibration": null,
    "corners": Array [
      Object {
        "x": 0.1,
        "y": 0.85,
      },
@@ -44,6 +45,7 @@
      },
    ],
    "dataUrl": "data:image/png;base64,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",
    "imageHeight": 600,
    "imageWidth": 800,
+   "projectionSize": null,
  }
```

# Page snapshot

```yaml
- generic [ref=f2e3]:
  - banner [ref=f2e4]:
    - button "Greenly 庭一覧へ" [ref=f2e5] [cursor=pointer]:
      - generic [ref=f2e8]: Greenly
    - button "← 庭一覧" [ref=f2e9] [cursor=pointer]
    - generic [ref=f2e12]:
      - heading "E2E photo boundary 1790943937804" [level=1] [ref=f2e13]
      - generic [ref=f2e14]: 6辺の庭
    - generic [ref=f2e15]: 保存済み
    - button "保存" [disabled] [ref=f2e18]
  - main [ref=f2e19]:
    - region "庭の3D編集エリア" [ref=f2e20]:
      - generic [ref=f2e21]:
        - group "表示モード" [ref=f2e22]:
          - button "写真＋設計" [pressed] [ref=f2e23] [cursor=pointer]
          - button "3D庭" [ref=f2e26] [cursor=pointer]
        - button "配置済み・プロパティパネルを隠す" [expanded] [ref=f2e30] [cursor=pointer]:
          - generic [ref=f2e33]: 配置・編集
      - generic [ref=f2e34]:
        - generic [ref=f2e35]:
          - button "写真のカメラを設定" [ref=f2e36] [cursor=pointer]
          - button "庭の領域を書き直す" [ref=f2e39] [cursor=pointer]
          - button "写真を外す" [ref=f2e42] [cursor=pointer]
          - generic [ref=f2e43]:
            - generic [ref=f2e44]:
              - checkbox "地面" [checked] [ref=f2e45]
              - text: 地面
            - generic [ref=f2e46]:
              - checkbox "グリッド" [checked] [ref=f2e47]
              - text: グリッド
            - generic [ref=f2e48]:
              - checkbox "配置" [checked] [ref=f2e49]
              - text: 配置
        - generic [ref=f2e50]:
          - generic [ref=f2e51]: カメラ未設定・概算
          - generic [ref=f2e52]: 辺をクリックして長さを編集 · 頂点をドラッグして輪郭を調整
        - img [ref=f2e54]:
          - generic [ref=f2e73]:
            - generic [ref=f2e74]:
              - button "辺1の長さを編集" [ref=f2e75] [cursor=pointer]
              - generic: 8.28 m
            - generic [ref=f2e76]:
              - button "辺2の長さを編集" [ref=f2e77] [cursor=pointer]
              - generic: 2.68 m
            - generic [ref=f2e78]:
              - button "辺3の長さを編集" [ref=f2e79] [cursor=pointer]
              - generic: 1.41 m
            - generic [ref=f2e80]:
              - button "辺4の長さを編集" [ref=f2e81] [cursor=pointer]
              - generic: 4.10 m
            - generic [ref=f2e82]:
              - button "辺5の長さを編集" [ref=f2e83] [cursor=pointer]
              - generic: 5.69 m
            - generic [ref=f2e84]:
              - button "辺6の長さを編集" [ref=f2e85] [cursor=pointer]
              - generic: 6.74 m
      - generic [ref=f2e98]:
        - generic [ref=f2e99]: オブジェクトを選択して編集
        - generic [ref=f2e100]: "読み込み済み: 0 / 0"
        - generic [ref=f2e101]: 1目盛り = 1m
    - complementary [ref=f2e102]:
      - generic [ref=f2e103]:
        - heading "配置と編集" [level=2] [ref=f2e104]
        - button "編集パネルを閉じる" [expanded] [ref=f2e105] [cursor=pointer]
      - generic [ref=f2e109]:
        - generic [ref=f2e110]:
          - heading "配置したもの" [level=3] [ref=f2e112]
          - generic [ref=f2e113]: 0 / 200
        - generic [ref=f2e114]:
          - strong [ref=f2e117]: 最初の素材を置く
          - paragraph [ref=f2e118]: 下のカタログで素材を選び、庭の好きな場所をクリックします。
    - complementary "素材カタログ" [ref=f2e119]:
      - generic [ref=f2e120]:
        - heading "素材を追加" [level=2] [ref=f2e121]
        - generic [ref=f2e124]: 素材を選び、庭をクリックして配置
        - button "オブジェクトパネルを隠す" [expanded] [ref=f2e125] [cursor=pointer]: しまう
      - generic [ref=f2e130]:
        - button "ベンチ 家具 1.6 × 0.85 × 0.65 m" [ref=f2e131] [cursor=pointer]:
          - generic [ref=f2e139]:
            - strong [ref=f2e140]: ベンチ
            - generic [ref=f2e141]: 家具
            - generic [ref=f2e142]: 1.6 × 0.85 × 0.65 m
        - button "レンガ 舗装 0.6 × 0.15 × 0.2 m" [ref=f2e143] [cursor=pointer]:
          - generic [ref=f2e149]:
            - strong [ref=f2e150]: レンガ
            - generic [ref=f2e151]: 舗装
            - generic [ref=f2e152]: 0.6 × 0.15 × 0.2 m
        - button "低木 植物 1.2 × 1.2 × 1.2 m" [ref=f2e153] [cursor=pointer]:
          - generic [ref=f2e159]:
            - strong [ref=f2e160]: 低木
            - generic [ref=f2e161]: 植物
            - generic [ref=f2e162]: 1.2 × 1.2 × 1.2 m
        - button "木 植物 2 × 4 × 2 m" [ref=f2e163] [cursor=pointer]:
          - generic [ref=f2e170]:
            - strong [ref=f2e171]: 木
            - generic [ref=f2e172]: 植物
            - generic [ref=f2e173]: 2 × 4 × 2 m
```

# Test source

```ts
  161 |   await clickImage(page, 0.25, 0.3);
  162 |   await clickImage(page, 0.65, 0.7);
  163 |   await expect(finish).toHaveCount(0);
  164 |   await start.click();
  165 |   await expect(page.getByRole('alert')).toContainText('線の交差');
  166 |   await expect(page.getByTestId('photo-ground')).toHaveCount(0);
  167 |   await expect(page.getByTestId('save-garden')).toBeDisabled();
  168 |   await page.getByRole('button', { name: '最後の点を戻す' }).click();
  169 |   await expect(page.getByRole('alert')).toHaveCount(0);
  170 |   await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(3);
  171 |   await start.click();
  172 |   await expect(page.getByTestId('photo-ground')).toBeVisible();
  173 |   await page.getByTestId('save-garden').click();
  174 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  175 |   const saved = await saveArtifact(request, id, 'garden-photo-triangle.json');
  176 |   expect(saved.photo?.boundary).toHaveLength(3);
  177 |   await page.reload();
  178 |   await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(3);
  179 |   await page.getByRole('button', { name: '庭の領域を書き直す' }).click();
  180 |   for (const [x, y] of outline.slice(0, 4)) await clickImage(page, x, y);
  181 |   await expect(finish).toHaveCount(0);
  182 |   await expect(page.getByTestId('save-garden')).toBeDisabled();
  183 |   await expect(page.getByRole('button', { name: '3D庭', exact: true })).toBeDisabled();
  184 |   await expect(page.getByTestId('photo-ground')).toHaveCount(0);
  185 |   expect(await gardenJson(request, id)).toEqual(saved);
  186 |   await page.getByRole('button', { name: '輪郭の描画を取消' }).click();
  187 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  188 |   await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(3);
  189 |   await expect(page.getByTestId('photo-ground')).toBeVisible();
  190 |   await expect(page.getByTestId('photo-preview-edge')).toHaveCount(0);
  191 |   expect(await gardenJson(request, id)).toEqual(saved);
  192 |   await page.getByRole('button', { name: '庭の領域を書き直す' }).click();
  193 |   for (const [x, y] of outline.slice(0, 4)) await clickImage(page, x, y);
  194 |   let unloadDialog = false;
  195 |   page.once('dialog', async (dialog) => { unloadDialog = dialog.type() === 'beforeunload'; await dialog.accept(); });
  196 |   await page.reload();
  197 |   expect(unloadDialog).toBe(true);
  198 |   await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(3);
  199 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  200 |   expect(await gardenJson(request, id)).toEqual(saved);
  201 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-triangle.png'), fullPage: true });
  202 |   await page.getByRole('button', { name: '庭の領域を書き直す' }).click();
  203 |   await clickImage(page, ...outline[0] as [number, number]);
  204 |   await page.getByLabel('庭の写真を選択').setInputFiles({ name: 'garden.png', mimeType: 'image/png', buffer: Buffer.from(imageDataUrl.split(',')[1], 'base64') });
  205 |   await expect(page.locator('.photo-stage circle[fill="#fff"]')).toHaveCount(0);
  206 |   await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(0);
  207 |   await expect(finish).toHaveCount(0);
  208 |   await expect(page.locator('.photo-hint')).toContainText('0/64点');
  209 |   await clickImage(page, ...outline[0] as [number, number]);
  210 |   await expect(page.getByTestId('photo-vertex-1')).toBeVisible();
  211 |   expect(await gardenJson(request, id)).toEqual(saved);
  212 | });
  213 | 
  214 | for (const [name, vertices] of [
  215 |   ['quad', corners],
  216 |   ['pentagon', [[0.1, 0.85], [0.9, 0.85], [0.85, 0.4], [0.6, 0.2], [0.2, 0.2]]],
  217 | ] as const) {
  218 |   test(`K. 写真直後の${vertices.length}クリックを同じ輪郭として保持し始点1で閉じる (${name})`, async ({ page, request }) => {
  219 |     const { id } = await preparePhoto(page);
  220 |     for (const [index, [x, y]] of vertices.entries()) {
  221 |       await clickImage(page, x, y);
  222 |       await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(index + 1);
  223 |       await expect(page.getByTestId('save-status')).toHaveText('輪郭を描画中');
  224 |       await expect(page.getByTestId('photo-ground')).toHaveCount(0);
  225 |       await expect(page.getByTestId('save-garden')).toBeDisabled();
  226 |     }
  227 |     await expect(page.locator('.photo-stage circle[fill="#fff"]')).toHaveCount(0);
  228 |     await moveImage(page, 0.45, 0.5);
  229 |     await page.screenshot({ path: resolve(artifactDirectory, `garden-photo-${name}-draft.png`), fullPage: true });
  230 |     expect((await gardenJson(request, id)).photo).toBeNull();
  231 |     await page.getByTestId('photo-vertex-1').click();
  232 |     await expect(page.getByTestId('photo-ground')).toBeVisible();
  233 |     await expect(page.getByTestId('photo-preview-edge')).toHaveCount(0);
  234 |     await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(vertices.length);
  235 |     await page.getByTestId('save-garden').click();
  236 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  237 |     const saved = await saveArtifact(request, id, `garden-photo-${name}.json`);
  238 |     expect(saved.photo!.boundary).toHaveLength(vertices.length);
  239 |     for (const [index, [x, y]] of vertices.entries()) {
  240 |       expect(saved.photo!.boundary[index].x).toBeCloseTo(x, 2);
  241 |       expect(saved.photo!.boundary[index].y).toBeCloseTo(y, 2);
  242 |     }
  243 |     await page.reload();
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
> 261 |   expect((await gardenJson(request, id)).photo).toEqual(legacy.photo);
      |                                                 ^ Error: expect(received).toEqual(expected) // deep equality
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
  310 |   const treeFrom3dId = await page.getByTestId('object-row-0').getAttribute('data-object-id');
  311 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  312 |   await page.getByRole('button', { name: '写真＋設計' }).click();
  313 |   await expect(page.getByTestId('photo-model-canvas')).toHaveAttribute('data-object-count', '1');
  314 |   await expect(page.locator('[data-testid="photo-model-canvas"] canvas')).toBeVisible();
  315 |   const withTree = await page.locator('.photo-stage').screenshot();
  316 |   await page.getByLabel('配置', { exact: true }).uncheck();
  317 |   const withoutTree = await page.locator('.photo-stage').screenshot();
  318 |   expect(withTree.equals(withoutTree)).toBe(false);
  319 |   await page.getByLabel('配置', { exact: true }).check();
  320 | 
  321 |   await page.setViewportSize({ width: 1280, height: 900 });
  322 |   await clickImage(page, 0.3, 0.65);
  323 |   await expect(page.getByTestId('object-row-1')).toBeVisible();
  324 |   const treeFromPhotoId = await page.getByTestId('object-row-1').getAttribute('data-object-id');
  325 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  326 |   await expect(page.getByTestId('photo-model-canvas')).toHaveAttribute('data-object-count', '2');
  327 |   await clickImage(page, 0.95, 0.1);
  328 |   await expect(page.getByTestId('object-row-2')).toHaveCount(0);
  329 |   await page.getByTestId('object-row-0').click();
  330 |   await clickImage(page, 0.3, 0.63);
  331 |   await expect(page.getByTestId('object-row-1')).toHaveAttribute('aria-pressed', 'true');
  332 |   await expect(page.getByTestId('object-row-2')).toHaveCount(0);
  333 |   const beforeDrag = await page.locator('.photo-stage').screenshot();
  334 |   const a = await screenPoint(page, 0.72, 0.72), b = await screenPoint(page, 0.6, 0.72);
  335 |   await page.mouse.move(a.x, a.y);
  336 |   await page.mouse.down();
  337 |   await page.mouse.move(b.x, b.y, { steps: 8 });
  338 |   await page.mouse.up();
  339 |   expect((await page.locator('.photo-stage').screenshot()).equals(beforeDrag)).toBe(true);
  340 |   await page.getByTestId('save-garden').click();
  341 |   await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  342 |   const saved = await saveArtifact(request, id, 'garden-photo-trees.json');
  343 |   expect(saved.photo?.dataUrl).toBe(imageDataUrl);
  344 |   expect(saved.objects).toHaveLength(2);
  345 |   expect(saved.objects.every((object) => object.assetId === 'tree_oak')).toBe(true);
  346 |   // API results are ordered by object ID; identify the placed trees by identity.
  347 |   const treeFrom3d = saved.objects.find((object) => object.id === treeFrom3dId)!;
  348 |   const treeFromPhoto = saved.objects.find((object) => object.id === treeFromPhotoId)!;
  349 |   expect(treeFrom3d.position.x).toBeCloseTo(0, 1);
  350 |   expect(treeFrom3d.position.z).toBeCloseTo(0, 1);
  351 |   expect(treeFromPhoto.position.x).toBeCloseTo((0.3 - 0.15) / 0.65 * saved.width - saved.width / 2, 1);
  352 |   expect(treeFromPhoto.position.z).toBeCloseTo((0.65 - 0.25) / 0.55 * saved.depth - saved.depth / 2, 1);
  353 |   await page.reload();
  354 |   await expect(page.getByTestId('photo-vertex-number')).toHaveCount(0);
  355 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  356 |   await expect(page.getByTestId('photo-model-canvas')).toHaveAttribute('data-object-count', '2');
  357 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-trees.png'), fullPage: true });
  358 |   await page.getByRole('button', { name: '3D庭', exact: true }).click();
  359 |   await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 2 / 2');
  360 |   await expect(page.getByTestId('object-row-1')).toBeVisible();
  361 |   await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-trees-3d.png'), fullPage: true });
```