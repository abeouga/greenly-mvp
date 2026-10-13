# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: photo-calibration.spec.ts >> O. 既知カメラの写真で校正・高さ投影・写真配置・MySQL保存復元
- Location: e2e\photo-calibration.spec.ts:31:1

# Error details

```
Error: apiRequestContext.get: socket hang up
Call log:
  - → GET http://127.0.0.1:57889/api/gardens/9cbb350d-7893-4d6d-b8c0-d8629f0ce186
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```

```
Tearing down "context" exceeded the test timeout of 90000ms.
```

# Page snapshot

```yaml
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
          - /url: http://127.0.0.1:57890/
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
        - heading "E2E camera 1791857296492" [level=1] [ref=f2e50]
        - generic [ref=f2e51]: 4辺の庭
    - group "庭の計画と購入" [ref=f2e52]:
      - button "植物候補を相談" [ref=f2e53] [cursor=pointer]
      - button "完成イメージを確認" [ref=f2e54] [cursor=pointer]
      - button "配置したものから商品を探す" [ref=f2e55] [cursor=pointer]
    - generic [ref=f2e56]:
      - generic [ref=f2e57]: 保存済み
      - button "保存" [disabled] [ref=f2e60]
  - main [ref=f2e61]:
    - region "庭の3D編集エリア" [ref=f2e62]:
      - generic [ref=f2e63]:
        - group "表示モード" [ref=f2e64]:
          - button "写真＋設計" [pressed] [ref=f2e65] [cursor=pointer]
          - button "3D庭" [ref=f2e68] [cursor=pointer]
        - button "商品・カートパネルを隠す" [expanded] [ref=f2e72] [cursor=pointer]:
          - generic [ref=f2e75]: 商品・カート
      - generic [ref=f2e76]:
        - generic [ref=f2e77]:
          - button "写真のカメラを設定" [ref=f2e78]
          - button "庭の領域を書き直す" [ref=f2e81]
          - button "写真を外す" [ref=f2e84]
          - generic [ref=f2e85]:
            - generic [ref=f2e86] [cursor=pointer]:
              - checkbox "地面" [checked] [ref=f2e87]
              - text: 地面
            - generic [ref=f2e88] [cursor=pointer]:
              - checkbox "グリッド" [checked] [ref=f2e89]
              - text: グリッド
            - generic [ref=f2e90] [cursor=pointer]:
              - checkbox "配置" [checked] [ref=f2e91]
              - text: 配置
        - generic [ref=f2e92]:
          - generic "庭と配置物の編集" [ref=f2e93]:
            - group [ref=f2e94]:
              - generic "詳細" [ref=f2e95] [cursor=pointer]
          - img [ref=f2e96]:
            - generic [ref=f2e125]:
              - generic [ref=f2e126]:
                - button "辺1の長さを変更" [pressed] [ref=f2e127] [cursor=pointer]
                - generic: 7.98 m
              - generic [ref=f2e128]:
                - button "辺2の長さを変更" [ref=f2e129] [cursor=pointer]
                - generic: 6.41 m
              - generic [ref=f2e130]:
                - button "辺3の長さを変更" [ref=f2e131] [cursor=pointer]
                - generic: 8.01 m
              - generic [ref=f2e132]:
                - button "辺4の長さを変更" [ref=f2e133] [cursor=pointer]
                - generic: 6.40 m
          - dialog "選択した辺の長さ" [ref=f2e142]:
            - generic [ref=f2e143]:
              - generic [ref=f2e144]:
                - generic [ref=f2e145]: 実寸を入力
                - heading "辺1の長さ" [level=3] [ref=f2e148]
              - button "辺の計測を閉じる" [ref=f2e149] [cursor=pointer]
            - generic [ref=f2e152]:
              - generic [ref=f2e153]: 現在の実寸
              - status "辺の計測値" [ref=f2e154]: 7.98 m
            - generic [ref=f2e155]:
              - generic [ref=f2e156]:
                - text: 辺の長さ（m）
                - textbox "辺の長さ（m）" [active] [ref=f2e157]: "7.977462"
              - paragraph [ref=f2e158]: 写真上の輪郭を固定し、庭全体の縮尺を変更します。ほかの辺も同じ割合で変わります。
              - generic [ref=f2e159]:
                - button "取消" [ref=f2e160] [cursor=pointer]
                - button "長さを適用" [ref=f2e161] [cursor=pointer]
      - generic [ref=f2e162]:
        - generic [ref=f2e163]: 右上の詳細から位置・回転・倍率を調整
        - generic [ref=f2e164]: "読み込み済み: 3 / 3"
        - generic [ref=f2e165]: 1目盛り = 1m
    - complementary "商品候補とカート" [ref=f2e166]:
      - generic [ref=f2e167]:
        - heading "庭の商品とカート" [level=2] [ref=f2e168]
        - button "商品・カートパネルを閉じる" [ref=f2e169] [cursor=pointer]
      - tablist "商品候補とカートの切替" [ref=f2e172]:
        - tab "商品候補" [selected] [ref=f2e173]
        - tab "カート内容" [ref=f2e174]
      - generic [ref=f2e175]:
        - alert [ref=f2e176]:
          - paragraph [ref=f2e177]: ECへ接続できません。ECの起動と接続設定を確認してください。
          - button "カートを再取得" [ref=f2e178]
        - tabpanel "商品候補" [ref=f2e179]:
          - heading "木 配置 3点" [level=3] [ref=f2e181]:
            - text: 木
            - generic [ref=f2e182]: 配置 3点
          - generic [ref=f2e183]:
            - generic [ref=f2e184]:
              - heading "配置したもの" [level=3] [ref=f2e186]
              - generic [ref=f2e187]: 3 / 200
            - list [ref=f2e188]:
              - listitem [ref=f2e189]:
                - button "01 木 X -2.6 · Z 2.5" [pressed] [ref=f2e190] [cursor=pointer]:
                  - generic [ref=f2e191]: "01"
                  - generic [ref=f2e192]:
                    - strong [ref=f2e193]: 木
                    - generic [ref=f2e194]: X -2.6 · Z 2.5
              - listitem [ref=f2e195]:
                - button "02 木 X 2.6 · Z -2.5" [ref=f2e196] [cursor=pointer]:
                  - generic [ref=f2e197]: "02"
                  - generic [ref=f2e198]:
                    - strong [ref=f2e199]: 木
                    - generic [ref=f2e200]: X 2.6 · Z -2.5
              - listitem [ref=f2e201]:
                - button "03 木 X 0.0 · Z 0.0" [ref=f2e202] [cursor=pointer]:
                  - generic [ref=f2e203]: "03"
                  - generic [ref=f2e204]:
                    - strong [ref=f2e205]: 木
                    - generic [ref=f2e206]: X 0.0 · Z 0.0
    - complementary "素材カタログ" [ref=f2e207]:
      - generic [ref=f2e208]:
        - heading "素材を追加" [level=2] [ref=f2e209]
        - generic [ref=f2e212]: 素材を選び、庭をクリックして配置
        - button "オブジェクトパネルを隠す" [expanded] [ref=f2e213]: しまう
      - generic [ref=f2e218]:
        - button "ベンチ 家具 1.6 × 0.85 × 0.65 m" [ref=f2e219] [cursor=pointer]:
          - generic [ref=f2e227]:
            - strong [ref=f2e228]: ベンチ
            - generic [ref=f2e229]: 家具
            - generic [ref=f2e230]: 1.6 × 0.85 × 0.65 m
        - button "レンガ 舗装 0.6 × 0.15 × 0.2 m" [ref=f2e231] [cursor=pointer]:
          - generic [ref=f2e237]:
            - strong [ref=f2e238]: レンガ
            - generic [ref=f2e239]: 舗装
            - generic [ref=f2e240]: 0.6 × 0.15 × 0.2 m
        - button "低木 植物 1.2 × 1.2 × 1.2 m" [ref=f2e241] [cursor=pointer]:
          - generic [ref=f2e247]:
            - strong [ref=f2e248]: 低木
            - generic [ref=f2e249]: 植物
            - generic [ref=f2e250]: 1.2 × 1.2 × 1.2 m
        - button "木 植物 2 × 4 × 2 m" [ref=f2e251] [cursor=pointer]:
          - generic [ref=f2e253]:
            - strong [ref=f2e254]: 木
            - generic [ref=f2e255]: 植物
            - generic [ref=f2e256]: 2 × 4 × 2 m
```