# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: garden-dimensions.spec.ts >> Q. 名前だけで作成・土台寸法を編集・縮小検証・MySQL保存復元
- Location: e2e\garden-dimensions.spec.ts:7:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('alert')
Expected substring: "配置済みの物体が土台の外"
Error: strict mode violation: getByRole('alert') resolved to 2 elements:
    1) <div role="alert" class="notice-error">…</div> aka getByText('ECへ接続できません。ECの起動と接続設定を確認してください。カートを再取得')
    2) <p role="alert" class="notice notice-error">配置済みの物体が土台の外に出るため変更できません。物体を内側へ移動するか、辺の長さを大きくしてくだ…</p> aka getByText('配置済みの物体が土台の外に出るため変更できません。物体を内側へ移動するか、辺の長さを大きくしてください。')

Call log:
  - Expect "toContainText" getByRole('alert') with timeout 10000ms
  - waiting for getByRole('alert')

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
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
          - heading "E2E dimensions 1791856634543" [level=1] [ref=f1e50]
          - generic [ref=f1e51]: 14 × 12 m
      - group "庭の計画と購入" [ref=f1e52]:
        - button "数量・施工範囲" [ref=f1e53] [cursor=pointer]
        - button "植物候補を相談" [ref=f1e54] [cursor=pointer]
        - button "完成イメージを確認" [ref=f1e55] [cursor=pointer]
        - button "配置したものから商品を探す" [ref=f1e56] [cursor=pointer]
        - button "ECへ戻る" [ref=f1e57] [cursor=pointer]
      - generic [ref=f1e58]:
        - generic [ref=f1e59]: 未保存の変更
        - button "保存" [ref=f1e62] [cursor=pointer]
    - main [ref=f1e63]:
      - region "庭の3D編集エリア" [ref=f1e64]:
        - generic [ref=f1e65]:
          - group "表示モード" [ref=f1e66]:
            - button "写真＋設計" [ref=f1e67] [cursor=pointer]
            - button "3D庭" [pressed] [ref=f1e70] [cursor=pointer]
          - generic [ref=f1e73]:
            - button "土台設定" [ref=f1e74] [cursor=pointer]
            - button "上から見る" [ref=f1e77] [cursor=pointer]
            - button "初期視点" [ref=f1e80] [cursor=pointer]
            - button "商品・カートパネルを隠す" [expanded] [ref=f1e83] [cursor=pointer]:
              - generic [ref=f1e86]: 商品・カート
        - generic [ref=f1e87]:
          - generic "配置物の編集" [ref=f1e91]:
            - group "変形ツール" [ref=f1e92]:
              - button "移動" [pressed] [ref=f1e93] [cursor=pointer]
              - button "回転" [ref=f1e96] [cursor=pointer]
              - button "拡縮" [ref=f1e99] [cursor=pointer]
            - group [ref=f1e102]:
              - generic "詳細" [ref=f1e103] [cursor=pointer]
          - generic [aria-hidden]: "N"
        - generic [ref=f1e104]:
          - generic [ref=f1e105]: 木を配置中 · 地面をクリック / Escで終了
          - generic [ref=f1e106]: "読み込み済み: 1 / 1"
          - generic [ref=f1e107]: 1目盛り = 1m
      - complementary "商品候補とカート" [ref=f1e108]:
        - generic [ref=f1e109]:
          - heading "庭の商品とカート" [level=2] [ref=f1e110]
          - button "商品・カートパネルを閉じる" [ref=f1e111] [cursor=pointer]
        - tablist "商品候補とカートの切替" [ref=f1e114]:
          - tab "商品候補" [selected] [ref=f1e115]
          - tab "カート内容" [ref=f1e116]
        - generic [ref=f1e117]:
          - alert [ref=f1e118]:
            - paragraph [ref=f1e119]: ECへ接続できません。ECの起動と接続設定を確認してください。
            - button "カートを再取得" [ref=f1e120]
          - tabpanel "商品候補" [ref=f1e121]:
            - heading "木 配置 1点" [level=3] [ref=f1e123]:
              - text: 木
              - generic [ref=f1e124]: 配置 1点
            - generic [ref=f1e125]:
              - generic [ref=f1e126]:
                - heading "配置したもの" [level=3] [ref=f1e128]
                - generic [ref=f1e129]: 1 / 200
              - list [ref=f1e130]:
                - listitem [ref=f1e131]:
                  - button "01 木 X 6.0 · Z -0.0" [pressed] [ref=f1e132] [cursor=pointer]:
                    - generic [ref=f1e133]: "01"
                    - generic [ref=f1e134]:
                      - strong [ref=f1e135]: 木
                      - generic [ref=f1e136]: X 6.0 · Z -0.0
      - complementary "素材カタログ" [ref=f1e137]:
        - generic [ref=f1e138]:
          - heading "素材を追加" [level=2] [ref=f1e139]
          - generic [ref=f1e142]: 同じ素材を続けて配置できます
          - button "オブジェクトパネルを隠す" [expanded] [ref=f1e143]: しまう
        - generic [ref=f1e148]:
          - button "ベンチ 家具 1.6 × 0.85 × 0.65 m" [ref=f1e149] [cursor=pointer]:
            - generic [ref=f1e157]:
              - strong [ref=f1e158]: ベンチ
              - generic [ref=f1e159]: 家具
              - generic [ref=f1e160]: 1.6 × 0.85 × 0.65 m
          - button "レンガ 舗装 0.6 × 0.15 × 0.2 m" [ref=f1e161] [cursor=pointer]:
            - generic [ref=f1e167]:
              - strong [ref=f1e168]: レンガ
              - generic [ref=f1e169]: 舗装
              - generic [ref=f1e170]: 0.6 × 0.15 × 0.2 m
          - button "低木 植物 1.2 × 1.2 × 1.2 m" [ref=f1e171] [cursor=pointer]:
            - generic [ref=f1e177]:
              - strong [ref=f1e178]: 低木
              - generic [ref=f1e179]: 植物
              - generic [ref=f1e180]: 1.2 × 1.2 × 1.2 m
          - button "木 植物 · 配置中 2 × 4 × 2 m" [pressed] [ref=f1e181] [cursor=pointer]:
            - generic [ref=f1e183]:
              - strong [ref=f1e184]: 木
              - generic [ref=f1e185]: 植物 · 配置中
              - generic [ref=f1e186]: 2 × 4 × 2 m
  - dialog [ref=f1e187]:
    - banner [ref=f1e188]:
      - generic [ref=f1e189]:
        - heading "土台のサイズ" [level=2] [ref=f1e190]
        - paragraph [ref=f1e191]: 庭の中心を基準に、幅と奥行きを変更します。
      - button "土台設定を閉じる" [ref=f1e192] [cursor=pointer]
    - region "土台の辺の長さ" [ref=f1e196]:
      - img "現在の土台：幅14m、奥行き12m" [ref=f1e197]:
        - generic [ref=f1e200]: 幅 14 m
        - generic [ref=f1e201]: 奥行き
        - generic [ref=f1e202]: 12 m
      - generic [ref=f1e203]:
        - generic [ref=f1e204]:
          - generic [ref=f1e205]:
            - text: 幅 (m)
            - spinbutton "幅 (m)" [ref=f1e206]: "10"
          - generic [ref=f1e207]:
            - text: 奥行き (m)
            - spinbutton "奥行き (m)" [ref=f1e208]: "12"
        - paragraph [ref=f1e209]: 各辺1〜50m。中心を基準に変更します。木の位置・大きさは維持します。
        - alert [ref=f1e210]: 配置済みの物体が土台の外に出るため変更できません。物体を内側へ移動するか、辺の長さを大きくしてください。
        - generic [ref=f1e211]:
          - button "土台に適用" [active] [ref=f1e212] [cursor=pointer]
          - button "入力を戻す" [ref=f1e213] [cursor=pointer]
        - status [ref=f1e214]: 辺の長さを入力中です。「土台に適用」の後、画面上部の「保存」で確定します。
```

# Test source

```ts
  1  | import { mkdir, writeFile } from 'node:fs/promises';
  2  | import { resolve } from 'node:path';
  3  | import { expect, test } from '@playwright/test';
  4  | import { api } from './api-url.js';
  5  | import type { GardenDocument } from '../frontend/src/types/garden.js';
  6  | 
  7  | test('Q. 名前だけで作成・土台寸法を編集・縮小検証・MySQL保存復元', async ({ page, request }) => {
  8  |   const directory = resolve('artifacts/e2e');
  9  |   await mkdir(directory, { recursive: true });
  10 |   await page.goto('/');
  11 |   await expect(page.locator('.create-form input')).toHaveCount(1);
  12 |   await expect(page.getByRole('button', { name: '庭を作成' })).toBeDisabled();
  13 |   await page.getByLabel('庭の名前').fill(`E2E dimensions ${Date.now()}`);
  14 |   const creation = page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/api/gardens'));
  15 |   await page.getByRole('button', { name: '庭を作成' }).click();
  16 |   expect(Object.keys((await creation).postDataJSON())).toEqual(['name']);
  17 |   await page.waitForURL(/\/gardens\//);
  18 |   const id = new URL(page.url()).pathname.split('/').at(-1)!;
  19 |   try {
  20 |     await page.getByRole('button', { name: '土台設定', exact: true }).click();
  21 |     await expect(page.getByLabel('幅 (m)', { exact: true })).toHaveValue('10');
  22 |     await expect(page.getByLabel('奥行き (m)', { exact: true })).toHaveValue('8');
  23 |     await page.getByLabel('幅 (m)', { exact: true }).fill('14');
  24 |     await page.getByLabel('奥行き (m)', { exact: true }).fill('12');
  25 |     await page.getByRole('button', { name: '土台に適用' }).click();
  26 |     await expect(page.getByRole('img', { name: '現在の土台：幅14m、奥行き12m' })).toBeVisible();
  27 |     await expect(page.getByTestId('save-status')).toHaveText('未保存の変更');
  28 |     const initial = await (await request.get(`${api}/gardens/${id}`)).json() as GardenDocument;
  29 |     expect([initial.width, initial.depth]).toEqual([10, 8]);
  30 |     await page.getByRole('button', { name: '土台設定を閉じる' }).click();
  31 |     await page.getByRole('button', { name: '上から見る' }).click();
  32 |     await page.getByTestId('asset-tree_oak').click();
  33 |     const box = await page.locator('[data-testid="garden-canvas"] canvas').boundingBox();
  34 |     if (!box) throw new Error('3D庭が表示されていません。');
  35 |     await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  36 |     await expect(page.getByTestId('object-row-0')).toBeVisible();
  37 |     if (!await page.locator('.object-details').evaluate((element) => (element as HTMLDetailsElement).open)) await page.getByTestId('object-details-toggle').click();
  38 |     await page.getByTestId('position-x').fill('6');
  39 |     await page.getByRole('button', { name: '土台設定', exact: true }).click();
  40 |     await page.getByLabel('幅 (m)', { exact: true }).fill('10');
  41 |     await page.getByRole('button', { name: '土台に適用' }).click();
> 42 |     await expect(page.getByRole('alert')).toContainText('配置済みの物体が土台の外');
     |                                           ^ Error: expect(locator).toContainText(expected) failed
  43 |     await expect(page.getByRole('img', { name: '現在の土台：幅14m、奥行き12m' })).toBeVisible();
  44 |     await page.getByRole('button', { name: '入力を戻す' }).click();
  45 |     await page.getByRole('button', { name: '土台設定を閉じる' }).click();
  46 |     await page.getByTestId('save-garden').click();
  47 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  48 |     const saved = await (await request.get(`${api}/gardens/${id}`)).json() as GardenDocument;
  49 |     expect([saved.width, saved.depth]).toEqual([14, 12]);
  50 |     expect(saved.objects[0].position.x).toBe(6);
  51 |     const rejected = await request.put(`${api}/gardens/${id}`, { data: { ...saved, width: 10 } });
  52 |     expect(rejected.status()).toBe(400);
  53 |     expect((await rejected.json()).code).toBe('OBJECT_POSITION_OUT_OF_BOUNDS');
  54 |     const stale = await request.put(`${api}/gardens/${id}`, { data: { ...saved, revision: 0, width: 16 } });
  55 |     expect(stale.status()).toBe(409);
  56 |     await page.reload();
  57 |     await page.getByRole('button', { name: '土台設定', exact: true }).click();
  58 |     await expect(page.getByLabel('幅 (m)', { exact: true })).toHaveValue('14');
  59 |     await expect(page.getByLabel('奥行き (m)', { exact: true })).toHaveValue('12');
  60 |     await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  61 |     expect(await (await request.get(`${api}/gardens/${id}`)).json()).toEqual(saved);
  62 |     await writeFile(resolve(directory, 'garden-dimensions.json'), JSON.stringify(saved, null, 2));
  63 |     await page.screenshot({ path: resolve(directory, 'garden-dimensions-reloaded.png'), fullPage: true });
  64 |     // A valid shrink changes only the bounds, keeping the existing object.
  65 |     await page.getByLabel('幅 (m)', { exact: true }).fill('12.5');
  66 |     await page.getByRole('button', { name: '土台に適用' }).click();
  67 |     await page.getByRole('button', { name: '土台設定を閉じる' }).click();
  68 |     await page.getByTestId('save-garden').click();
  69 |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  70 |     const shrunk = await (await request.get(`${api}/gardens/${id}`)).json() as GardenDocument;
  71 |     expect(shrunk.width).toBe(12.5); expect(shrunk.objects).toEqual(saved.objects);
  72 |     await page.getByRole('button', { name: '← 庭一覧', exact: true }).click();
  73 |     await expect(page.locator('.garden-card').filter({ hasText: saved.name })).toContainText('12.5 × 12 m');
  74 |   } finally {
  75 |     expect((await request.delete(`${api}/gardens/${id}`)).status()).toBe(204);
  76 |   }
  77 | });
  78 | 
```