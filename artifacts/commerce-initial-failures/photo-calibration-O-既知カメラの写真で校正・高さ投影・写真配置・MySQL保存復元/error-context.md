# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: photo-calibration.spec.ts >> O. 既知カメラの写真で校正・高さ投影・写真配置・MySQL保存復元
- Location: e2e\photo-calibration.spec.ts:31:1

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: apiRequestContext.delete: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - generic [ref=f2e3]:
    - generic [ref=f2e4]:
      - generic [ref=f2e5]:
        - generic [ref=f2e6]: GREEN FOR YOUR EVERYDAY
        - generic [ref=f2e7]: ひと鉢からはじまる、緑のある暮らし。
        - generic [ref=f2e8]: 植物のオンラインストア
      - banner [ref=f2e9]:
        - link "Kusakari トップへ" [ref=f2e10] [cursor=pointer]:
          - /url: http://127.0.0.1:15186/
          - generic [ref=f2e12]: kusakari.
        - navigation "メインナビゲーション" [ref=f2e13]:
          - link "植物を探す" [ref=f2e14] [cursor=pointer]:
            - /url: http://127.0.0.1:15186/#plants
          - link "店舗を探す" [ref=f2e15] [cursor=pointer]:
            - /url: http://127.0.0.1:15186/?panel=stores
          - link "Canvas" [ref=f2e16] [cursor=pointer]:
            - /url: http://127.0.0.1:54393/
          - link "Kusakariについて" [ref=f2e17] [cursor=pointer]:
            - /url: http://127.0.0.1:15186/?panel=guide
          - link "出店者" [ref=f2e18] [cursor=pointer]:
            - /url: http://127.0.0.1:15186/seller
        - generic [ref=f2e19]:
          - link "ログイン" [ref=f2e20] [cursor=pointer]:
            - /url: http://127.0.0.1:15186/?panel=login
          - link "アカウント" [ref=f2e24] [cursor=pointer]:
            - /url: http://127.0.0.1:15186/account
          - link "管理者画面" [ref=f2e30] [cursor=pointer]:
            - /url: http://127.0.0.1:15186/operator
        - generic [ref=f2e31]:
          - link "注文履歴" [ref=f2e32] [cursor=pointer]:
            - /url: http://127.0.0.1:15186/?panel=orders
          - link "ECでカートを確認" [ref=f2e37] [cursor=pointer]:
            - /url: http://127.0.0.1:15186/cart
            - generic "カートの商品数はECで確認できます" [ref=f2e43]: —
    - banner [ref=f2e44]:
      - generic [ref=f2e45]:
        - button "← 庭一覧" [ref=f2e46] [cursor=pointer]: 庭一覧
        - generic [ref=f2e49]:
          - heading "E2E camera 1791856871388" [level=1] [ref=f2e50]
          - generic [ref=f2e51]: 4辺の庭
      - group "庭の計画と購入" [ref=f2e52]:
        - button "数量・施工範囲" [ref=f2e53] [cursor=pointer]
        - button "植物候補を相談" [ref=f2e54] [cursor=pointer]
        - button "完成イメージを確認" [ref=f2e55] [cursor=pointer]
        - button "配置したものから商品を探す" [ref=f2e56] [cursor=pointer]
        - button "ECへ戻る" [ref=f2e57] [cursor=pointer]
      - generic [ref=f2e58]:
        - generic [ref=f2e59]: 保存済み
        - button "保存" [disabled] [ref=f2e62]
    - main [ref=f2e63]:
      - region "庭の3D編集エリア" [ref=f2e64]:
        - generic [ref=f2e65]:
          - group "表示モード" [ref=f2e66]:
            - button "写真＋設計" [pressed] [ref=f2e67] [cursor=pointer]
            - button "3D庭" [ref=f2e70] [cursor=pointer]
          - button "商品・カートパネルを隠す" [expanded] [ref=f2e74] [cursor=pointer]:
            - generic [ref=f2e77]: 商品・カート
        - generic [ref=f2e78]:
          - generic [ref=f2e79]:
            - button "写真のカメラを設定" [ref=f2e80]
            - button "庭の領域を書き直す" [ref=f2e83]
            - button "写真を外す" [ref=f2e86]
            - generic [ref=f2e87]:
              - generic [ref=f2e88] [cursor=pointer]:
                - checkbox "地面" [checked] [ref=f2e89]
                - text: 地面
              - generic [ref=f2e90] [cursor=pointer]:
                - checkbox "グリッド" [checked] [ref=f2e91]
                - text: グリッド
              - generic [ref=f2e92] [cursor=pointer]:
                - checkbox "配置" [checked] [ref=f2e93]
                - text: 配置
          - generic [ref=f2e94]:
            - generic [ref=f2e95]: カメラ設定済み
            - generic [ref=f2e96]: 辺をクリックして長さを入力 · 頂点をドラッグして輪郭を調整
          - generic [ref=f2e97]:
            - generic "配置物の編集" [ref=f2e98]:
              - group [ref=f2e99]:
                - generic "詳細" [ref=f2e100] [cursor=pointer]
            - img [ref=f2e101]:
              - generic [ref=f2e130]:
                - generic [ref=f2e131]:
                  - button "辺1の長さを変更" [ref=f2e132] [cursor=pointer]
                  - generic: 7.98 m
                - generic [ref=f2e133]:
                  - button "辺2の長さを変更" [ref=f2e134] [cursor=pointer]
                  - generic: 6.41 m
                - generic [ref=f2e135]:
                  - button "辺3の長さを変更" [ref=f2e136] [cursor=pointer]
                  - generic: 8.01 m
                - generic [ref=f2e137]:
                  - button "辺4の長さを変更" [ref=f2e138] [cursor=pointer]
                  - generic: 6.40 m
        - generic [ref=f2e147]:
          - generic [ref=f2e148]: 右上の詳細から位置・回転・倍率を調整
          - generic [ref=f2e149]: "読み込み済み: 3 / 3"
          - generic [ref=f2e150]: 1目盛り = 1m
      - complementary "商品候補とカート" [ref=f2e151]:
        - generic [ref=f2e152]:
          - heading "庭の商品とカート" [level=2] [ref=f2e153]
          - button "商品・カートパネルを閉じる" [ref=f2e154] [cursor=pointer]
        - tablist "商品候補とカートの切替" [ref=f2e157]:
          - tab "商品候補" [selected] [ref=f2e158]
          - tab "カート内容" [ref=f2e159]
        - generic [ref=f2e160]:
          - alert [ref=f2e161]:
            - paragraph [ref=f2e162]: ECへ接続できません。ECの起動と接続設定を確認してください。
            - button "カートを再取得" [ref=f2e163]
          - tabpanel "商品候補" [ref=f2e164]:
            - heading "木 配置 3点" [level=3] [ref=f2e166]:
              - text: 木
              - generic [ref=f2e167]: 配置 3点
            - generic [ref=f2e168]:
              - generic [ref=f2e169]:
                - heading "配置したもの" [level=3] [ref=f2e171]
                - generic [ref=f2e172]: 3 / 200
              - list [ref=f2e173]:
                - listitem [ref=f2e174]:
                  - button "01 木 X 2.6 · Z -2.5" [pressed] [ref=f2e175] [cursor=pointer]:
                    - generic [ref=f2e176]: "01"
                    - generic [ref=f2e177]:
                      - strong [ref=f2e178]: 木
                      - generic [ref=f2e179]: X 2.6 · Z -2.5
                - listitem [ref=f2e180]:
                  - button "02 木 X -2.6 · Z 2.5" [ref=f2e181] [cursor=pointer]:
                    - generic [ref=f2e182]: "02"
                    - generic [ref=f2e183]:
                      - strong [ref=f2e184]: 木
                      - generic [ref=f2e185]: X -2.6 · Z 2.5
                - listitem [ref=f2e186]:
                  - button "03 木 X 0.0 · Z 0.0" [ref=f2e187] [cursor=pointer]:
                    - generic [ref=f2e188]: "03"
                    - generic [ref=f2e189]:
                      - strong [ref=f2e190]: 木
                      - generic [ref=f2e191]: X 0.0 · Z 0.0
      - complementary "素材カタログ" [ref=f2e192]:
        - generic [ref=f2e193]:
          - heading "素材を追加" [level=2] [ref=f2e194]
          - generic [ref=f2e197]: 素材を選び、庭をクリックして配置
          - button "オブジェクトパネルを隠す" [expanded] [ref=f2e198]: しまう
        - generic [ref=f2e203]:
          - button "ベンチ 家具 1.6 × 0.85 × 0.65 m" [ref=f2e204] [cursor=pointer]:
            - generic [ref=f2e212]:
              - strong [ref=f2e213]: ベンチ
              - generic [ref=f2e214]: 家具
              - generic [ref=f2e215]: 1.6 × 0.85 × 0.65 m
          - button "レンガ 舗装 0.6 × 0.15 × 0.2 m" [ref=f2e216] [cursor=pointer]:
            - generic [ref=f2e222]:
              - strong [ref=f2e223]: レンガ
              - generic [ref=f2e224]: 舗装
              - generic [ref=f2e225]: 0.6 × 0.15 × 0.2 m
          - button "低木 植物 1.2 × 1.2 × 1.2 m" [ref=f2e226] [cursor=pointer]:
            - generic [ref=f2e232]:
              - strong [ref=f2e233]: 低木
              - generic [ref=f2e234]: 植物
              - generic [ref=f2e235]: 1.2 × 1.2 × 1.2 m
          - button "木 植物 2 × 4 × 2 m" [ref=f2e236] [cursor=pointer]:
            - generic [ref=f2e238]:
              - strong [ref=f2e239]: 木
              - generic [ref=f2e240]: 植物
              - generic [ref=f2e241]: 2 × 4 × 2 m
  - dialog [ref=f2e242]:
    - banner [ref=f2e243]:
      - heading "庭の完成イメージ" [level=2] [ref=f2e245]
      - button "閉じる" [active] [ref=f2e246] [cursor=pointer]
    - generic [ref=f2e249]:
      - paragraph [ref=f2e250]: 現在の写真・3D配置から作成した画像です。植物の成長予測・AI画像生成ではありません。
      - img "現在の庭の完成イメージ" [ref=f2e251]
      - link "PNGで保存" [ref=f2e252] [cursor=pointer]:
        - /url: data:image/png;base64,…
```

# Test source

```ts
  71  |     await page.setViewportSize({ width: 1280, height: 960 });
  72  |     await page.getByTestId('asset-tree_oak').click();
  73  |     const ids: string[] = [];
  74  |     for (const [i, location] of locations.entries()) {
  75  |       await clickPoint(page, '.photo-stage', project(location));
  76  |       await expect(page.getByTestId(`object-row-${i}`)).toBeVisible();
  77  |       ids.push((await page.getByTestId(`object-row-${i}`).getAttribute('data-object-id'))!);
  78  |     }
  79  |     await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 3 / 3');
  80  |     await page.getByTestId('save-garden').click();
  81  |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  82  |     let saved = await (await request.get(`${api}/gardens/${initial.id}`)).json() as GardenDocument;
  83  |     const calibration = saved.photo!.calibration!;
  84  |     expect(calibration.focalSource).toBe('estimated');
  85  |     expect(calibration.reprojectionErrorPx).toBeLessThan(2);
  86  |     const camera = createPhotoCamera(saved.photo!, saved.width, saved.depth);
  87  |     expect(camera).toBeInstanceOf(PerspectiveCamera);
  88  |     const sizes: number[] = [];
  89  |     for (const [i, location] of locations.entries()) {
  90  |       const object = saved.objects.find((o) => o.id === ids[i])!;
  91  |       expect(Math.abs(object.position.x - location[0])).toBeLessThan(0.08);
  92  |       expect(Math.abs(object.position.z - location[2])).toBeLessThan(0.08);
  93  |       const tip = [location[0], 2, location[2]];
  94  |       const actual = project(tip, camera as PerspectiveCamera), expected = project(tip);
  95  |       expect(Math.hypot((actual.x - expected.x) * 1000, (actual.y - expected.y) * 750)).toBeLessThan(4);
  96  |       const bottom = project(location, camera as PerspectiveCamera);
  97  |       sizes.push(Math.hypot((actual.x - bottom.x) * 1000, (actual.y - bottom.y) * 750));
  98  |     }
  99  |     expect(sizes[0]).toBeGreaterThan(sizes[1]); expect(sizes[1]).toBeGreaterThan(sizes[2]);
  100 |     const forged = structuredClone(saved);
  101 |     forged.photo!.calibration!.rotation.fill(0);
  102 |     forged.photo!.calibration!.translation.fill(99999);
  103 |     const canonical = await request.put(`${api}/gardens/${initial.id}`, { data: forged });
  104 |     expect(canonical.status()).toBe(200);
  105 |     saved = await canonical.json() as GardenDocument;
  106 |     expect(saved.photo!.calibration).toEqual(calibration);
  107 |     await page.reload();
  108 |     await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 3 / 3');
  109 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  110 |     expect(await (await request.get(`${api}/gardens/${initial.id}`)).json()).toEqual(saved);
  111 |     await page.screenshot({ path: resolve(artifacts, 'camera-calibrated-reloaded.png'), fullPage: true });
  112 |     await writeFile(resolve(artifacts, 'camera-calibrated.json'), JSON.stringify(saved, null, 2));
  113 |     await writeFile(resolve(artifacts, 'camera-metrics.json'), JSON.stringify({ sourcePosition: source.position, sourceFov: 50, sizes, calibration }, null, 2));
  114 |     await page.getByRole('button', { name: '3D庭', exact: true }).click();
  115 |     await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 3 / 3');
  116 |     await page.screenshot({ path: resolve(artifacts, 'camera-calibrated-3d.png'), fullPage: true });
  117 |     await page.getByRole('button', { name: '写真＋設計', exact: true }).click();
  118 |     await page.getByRole('button', { name: '写真のカメラを設定' }).click();
  119 |     await page.getByRole('button', { name: '基準点を選び直す' }).click();
  120 |     await page.getByRole('button', { name: 'カメラ設定を取消' }).click();
  121 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  122 |     expect(await (await request.get(`${api}/gardens/${initial.id}`)).json()).toEqual(saved);
  123 |     const outline = await page.getByTestId('photo-ground').getAttribute('points');
  124 |     await page.getByTestId('photo-edge-0').click();
  125 |     await expect(page.getByRole('dialog', { name: '選択した辺の長さ' })).toContainText('現在の実寸');
  126 |     expect(parseFloat((await page.getByTestId('edge-measurement').textContent())!)).toBeCloseTo(10, 1);
  127 |     await expect(page.getByLabel('辺の長さ（m）', { exact: true })).toBeFocused();
  128 |     await page.keyboard.press('Escape');
  129 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  130 |     // Change the metric scale in the calibration UI; the photographed outline must stay fixed.
  131 |     await page.getByRole('button', { name: '写真のカメラを設定' }).click();
  132 |     await page.getByLabel('基準の幅（m）').fill('8');
  133 |     await page.getByLabel('基準の奥行き（m）').fill('6.4');
  134 |     await expect(page.getByRole('button', { name: 'カメラを適用', exact: true })).toBeDisabled();
  135 |     await page.getByRole('button', { name: 'カメラを計算', exact: true }).click();
  136 |     await expect(page.getByTestId('calibration-quality')).toBeVisible();
  137 |     await page.getByRole('button', { name: 'カメラを適用', exact: true }).click();
  138 |     await expect(page.getByTestId('photo-ground')).toHaveAttribute('points', outline!);
  139 |     await page.getByTestId('photo-edge-0').click();
  140 |     expect(parseFloat((await page.getByTestId('edge-measurement').textContent())!)).toBeCloseTo(8, 1);
  141 |     await page.keyboard.press('Escape');
  142 |     await page.getByTestId('save-garden').click();
  143 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  144 |     const edited = await (await request.get(`${api}/gardens/${initial.id}`)).json() as GardenDocument;
  145 |     expect(edited.photo!.calibration!.referenceWidth).toBe(8);
  146 |     expect(edited.photo!.calibration!.referenceDepth).toBe(6.4);
  147 |     expect(edited.photo!.calibration!.points).toEqual(saved.photo!.calibration!.points);
  148 |     expect(edited.objects).toEqual(saved.objects);
  149 |     expect(edited.photo!.boundary).toEqual(saved.photo!.boundary);
  150 |     expect(edited.photo!.corners).toEqual(saved.photo!.corners);
  151 |     expect(edited.photo!.projectionSize).toEqual(saved.photo!.projectionSize);
  152 |     expect(edited.width).toBe(saved.width);
  153 |     expect(edited.depth).toBe(saved.depth);
  154 |     await page.reload();
  155 |     await page.getByTestId('photo-edge-0').click();
  156 |     expect(parseFloat((await page.getByTestId('edge-measurement').textContent())!)).toBeCloseTo(8, 1);
  157 |     await expect(page.getByTestId('photo-ground')).toHaveAttribute('points', outline!);
  158 |     expect(await (await request.get(`${api}/gardens/${initial.id}`)).json()).toEqual(edited);
  159 |     await page.screenshot({ path: resolve(artifacts, 'camera-calibrated-measurement.png'), fullPage: true });
  160 |     await writeFile(resolve(artifacts, 'camera-calibrated-measurement.json'), JSON.stringify(edited, null, 2));
  161 |     await page.keyboard.press('Escape');
  162 |     await page.getByRole('button', { name: '数量・施工範囲', exact: true }).click();
  163 |     await expect(page.getByRole('dialog', { name: '配置数量・施工範囲' })).toContainText('m²');
  164 |     await page.getByRole('dialog').getByRole('button', { name: '閉じる', exact: true }).click();
  165 |     await page.getByRole('button', { name: '完成イメージを確認', exact: true }).click();
  166 |     const completionImage = page.getByAltText('現在の庭の完成イメージ');
  167 |     await expect(completionImage).toBeVisible();
  168 |     expect(await completionImage.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBe(edited.photo!.imageWidth);
  169 |     await page.screenshot({ path: resolve(artifacts, 'camera-calibrated-completion.png'), fullPage: true });
  170 | 
> 171 |   } finally { expect((await request.delete(`${api}/gardens/${initial.id}`)).status()).toBe(204); }
      |                                           ^ Error: apiRequestContext.delete: Target page, context or browser has been closed
  172 | });
  173 | 
  174 | test('P. 不正な基準点と画角の不定性を拒否し、手動画角で復帰', async ({ request }) => {
  175 |   const crossed = await request.post(`${api}/photo-calibration`, { data: { ...requestBody, points: [corners[0], corners[2], corners[1], corners[3]] } });
  176 |   expect(crossed.status()).toBe(400);
  177 |   const overhead = new PerspectiveCamera(50, 4 / 3, 0.01, 1000);
  178 |   overhead.position.set(0, 14, 0); overhead.up.set(0, 0, -1); overhead.lookAt(0, 0, 0); overhead.updateMatrixWorld(true);
  179 |   const points = [[-5, 0, 4], [5, 0, 4], [5, 0, -4], [-5, 0, -4]].map((p) => project(p, overhead));
  180 |   const ambiguous = await request.post(`${api}/photo-calibration`, { data: { ...requestBody, points } });
  181 |   expect(ambiguous.status()).toBe(400);
  182 |   const manual = await request.post(`${api}/photo-calibration`, { data: { ...requestBody, points, focalLengthPx: 750 / (2 * Math.tan(50 * Math.PI / 360)) } });
  183 |   expect(manual.status()).toBe(200);
  184 |   const result = await manual.json() as PhotoCalibration;
  185 |   expect(result.focalSource).toBe('manual'); expect(result.reprojectionErrorPx).toBeLessThan(0.01);
  186 | });
  187 | 
```