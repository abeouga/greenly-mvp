# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tree-performance.spec.ts >> TREE50. Blender樹木50本の共有描画・独立編集・MySQL保存復元
- Location: e2e\tree-performance.spec.ts:9:1

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: apiRequestContext.delete: Target page, context or browser has been closed
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
          - /url: http://127.0.0.1:57890/
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
        - heading "Blender fifty 1791857632132" [level=1] [ref=f1e50]
        - generic [ref=f1e51]: 26 × 14 m
    - group "庭の計画と購入" [ref=f1e52]:
      - button "植物候補を相談" [ref=f1e53] [cursor=pointer]
      - button "完成イメージを確認" [ref=f1e54] [cursor=pointer]
      - button "配置したものから商品を探す" [ref=f1e55] [cursor=pointer]
    - button "保存済み" [disabled] [ref=f1e57]
  - main [ref=f1e58]:
    - region "庭の3D編集エリア" [ref=f1e59]:
      - generic [ref=f1e60]:
        - group "表示モード" [ref=f1e61]:
          - button "写真＋設計" [ref=f1e62] [cursor=pointer]
          - button "3D庭" [pressed] [ref=f1e65] [cursor=pointer]
        - generic [ref=f1e68]:
          - button "土台設定" [ref=f1e69] [cursor=pointer]
          - button "上から見る" [ref=f1e72] [cursor=pointer]
          - button "初期視点" [ref=f1e75] [cursor=pointer]
          - button "商品・カートパネルを隠す" [expanded] [ref=f1e78] [cursor=pointer]:
            - generic [ref=f1e81]: 商品・カート
      - generic [ref=f1e82]:
        - generic "庭と配置物の編集" [ref=f1e86]:
          - group "変形ツール" [ref=f1e87]:
            - button "移動" [pressed] [ref=f1e88] [cursor=pointer]
            - button "回転" [ref=f1e91] [cursor=pointer]
            - button "拡縮" [ref=f1e94] [cursor=pointer]
          - group [ref=f1e97]:
            - generic "詳細" [ref=f1e98] [cursor=pointer]
        - generic [aria-hidden]: "N"
      - generic [ref=f1e99]:
        - generic [ref=f1e100]: オブジェクトを選択して編集
        - generic [ref=f1e101]: "読み込み済み: 50 / 50"
        - generic [ref=f1e102]: 1目盛り = 1m
    - complementary "商品候補とカート" [ref=f1e103]:
      - generic [ref=f1e104]:
        - heading "庭の商品とカート" [level=2] [ref=f1e105]
        - button "商品・カートパネルを閉じる" [ref=f1e106] [cursor=pointer]
      - tablist "商品候補とカートの切替" [ref=f1e109]:
        - tab "商品候補" [selected] [ref=f1e110]
        - tab "カート内容" [ref=f1e111]
      - generic [ref=f1e112]:
        - alert [ref=f1e113]:
          - paragraph [ref=f1e114]: ECへ接続できません。ECの起動と接続設定を確認してください。
          - button "カートを再取得" [ref=f1e115]
        - tabpanel "商品候補" [ref=f1e116]:
          - heading "木 配置 50点" [level=3] [ref=f1e118]:
            - text: 木
            - generic [ref=f1e119]: 配置 50点
          - generic [ref=f1e120]:
            - generic [ref=f1e121]:
              - heading "配置したもの" [level=3] [ref=f1e123]
              - generic [ref=f1e124]: 50 / 200
            - list [ref=f1e125]:
              - listitem [ref=f1e126]:
                - button "01 木 X -10.0 · Z 4.8" [pressed] [ref=f1e127] [cursor=pointer]:
                  - generic [ref=f1e128]: "01"
                  - generic [ref=f1e129]:
                    - strong [ref=f1e130]: 木
                    - generic [ref=f1e131]: X -10.0 · Z 4.8
              - listitem [ref=f1e132]:
                - button "02 木 X -8.4 · Z -2.4" [ref=f1e133] [cursor=pointer]:
                  - generic [ref=f1e134]: "02"
                  - generic [ref=f1e135]:
                    - strong [ref=f1e136]: 木
                    - generic [ref=f1e137]: X -8.4 · Z -2.4
              - listitem [ref=f1e138]:
                - button "03 木 X -1.2 · Z 0.0" [ref=f1e139] [cursor=pointer]:
                  - generic [ref=f1e140]: "03"
                  - generic [ref=f1e141]:
                    - strong [ref=f1e142]: 木
                    - generic [ref=f1e143]: X -1.2 · Z 0.0
              - listitem [ref=f1e144]:
                - button "04 木 X 1.2 · Z -2.4" [ref=f1e145] [cursor=pointer]:
                  - generic [ref=f1e146]: "04"
                  - generic [ref=f1e147]:
                    - strong [ref=f1e148]: 木
                    - generic [ref=f1e149]: X 1.2 · Z -2.4
              - listitem [ref=f1e150]:
                - button "05 木 X -10.8 · Z -2.4" [ref=f1e151] [cursor=pointer]:
                  - generic [ref=f1e152]: "05"
                  - generic [ref=f1e153]:
                    - strong [ref=f1e154]: 木
                    - generic [ref=f1e155]: X -10.8 · Z -2.4
              - listitem [ref=f1e156]:
                - button "06 木 X 10.8 · Z 4.8" [ref=f1e157] [cursor=pointer]:
                  - generic [ref=f1e158]: "06"
                  - generic [ref=f1e159]:
                    - strong [ref=f1e160]: 木
                    - generic [ref=f1e161]: X 10.8 · Z 4.8
              - listitem [ref=f1e162]:
                - button "07 木 X -8.4 · Z -4.8" [ref=f1e163] [cursor=pointer]:
                  - generic [ref=f1e164]: "07"
                  - generic [ref=f1e165]:
                    - strong [ref=f1e166]: 木
                    - generic [ref=f1e167]: X -8.4 · Z -4.8
              - listitem [ref=f1e168]:
                - button "08 木 X -1.2 · Z -4.8" [ref=f1e169] [cursor=pointer]:
                  - generic [ref=f1e170]: "08"
                  - generic [ref=f1e171]:
                    - strong [ref=f1e172]: 木
                    - generic [ref=f1e173]: X -1.2 · Z -4.8
              - listitem [ref=f1e174]:
                - button "09 木 X -6.0 · Z 4.8" [ref=f1e175] [cursor=pointer]:
                  - generic [ref=f1e176]: "09"
                  - generic [ref=f1e177]:
                    - strong [ref=f1e178]: 木
                    - generic [ref=f1e179]: X -6.0 · Z 4.8
              - listitem [ref=f1e180]:
                - button "10 木 X -10.8 · Z 0.0" [ref=f1e181] [cursor=pointer]:
                  - generic [ref=f1e182]: "10"
                  - generic [ref=f1e183]:
                    - strong [ref=f1e184]: 木
                    - generic [ref=f1e185]: X -10.8 · Z 0.0
              - listitem [ref=f1e186]:
                - button "11 木 X -6.0 · Z 0.0" [ref=f1e187] [cursor=pointer]:
                  - generic [ref=f1e188]: "11"
                  - generic [ref=f1e189]:
                    - strong [ref=f1e190]: 木
                    - generic [ref=f1e191]: X -6.0 · Z 0.0
              - listitem [ref=f1e192]:
                - button "12 木 X 8.4 · Z 4.8" [ref=f1e193] [cursor=pointer]:
                  - generic [ref=f1e194]: "12"
                  - generic [ref=f1e195]:
                    - strong [ref=f1e196]: 木
                    - generic [ref=f1e197]: X 8.4 · Z 4.8
              - listitem [ref=f1e198]:
                - button "13 木 X -10.8 · Z -4.8" [ref=f1e199] [cursor=pointer]:
                  - generic [ref=f1e200]: "13"
                  - generic [ref=f1e201]:
                    - strong [ref=f1e202]: 木
                    - generic [ref=f1e203]: X -10.8 · Z -4.8
              - listitem [ref=f1e204]:
                - button "14 木 X -8.4 · Z 2.4" [ref=f1e205] [cursor=pointer]:
                  - generic [ref=f1e206]: "14"
                  - generic [ref=f1e207]:
                    - strong [ref=f1e208]: 木
                    - generic [ref=f1e209]: X -8.4 · Z 2.4
              - listitem [ref=f1e210]:
                - button "15 木 X 8.4 · Z 0.0" [ref=f1e211] [cursor=pointer]:
                  - generic [ref=f1e212]: "15"
                  - generic [ref=f1e213]:
                    - strong [ref=f1e214]: 木
                    - generic [ref=f1e215]: X 8.4 · Z 0.0
              - listitem [ref=f1e216]:
                - button "16 木 X -6.0 · Z -2.4" [ref=f1e217] [cursor=pointer]:
                  - generic [ref=f1e218]: "16"
                  - generic [ref=f1e219]:
                    - strong [ref=f1e220]: 木
                    - generic [ref=f1e221]: X -6.0 · Z -2.4
              - listitem [ref=f1e222]:
                - button "17 木 X -3.6 · Z -4.8" [ref=f1e223] [cursor=pointer]:
                  - generic [ref=f1e224]: "17"
                  - generic [ref=f1e225]:
                    - strong [ref=f1e226]: 木
                    - generic [ref=f1e227]: X -3.6 · Z -4.8
              - listitem [ref=f1e228]:
                - button "18 木 X -10.8 · Z 4.8" [ref=f1e229] [cursor=pointer]:
                  - generic [ref=f1e230]: "18"
                  - generic [ref=f1e231]:
                    - strong [ref=f1e232]: 木
                    - generic [ref=f1e233]: X -10.8 · Z 4.8
              - listitem [ref=f1e234]:
                - button "19 木 X -6.0 · Z -4.8" [ref=f1e235] [cursor=pointer]:
                  - generic [ref=f1e236]: "19"
                  - generic [ref=f1e237]:
                    - strong [ref=f1e238]: 木
                    - generic [ref=f1e239]: X -6.0 · Z -4.8
              - listitem [ref=f1e240]:
                - button "20 木 X -1.2 · Z 2.4" [ref=f1e241] [cursor=pointer]:
                  - generic [ref=f1e242]: "20"
                  - generic [ref=f1e243]:
                    - strong [ref=f1e244]: 木
                    - generic [ref=f1e245]: X -1.2 · Z 2.4
              - listitem [ref=f1e246]:
                - button "21 木 X 10.8 · Z 0.0" [ref=f1e247] [cursor=pointer]:
                  - generic [ref=f1e248]: "21"
                  - generic [ref=f1e249]:
                    - strong [ref=f1e250]: 木
                    - generic [ref=f1e251]: X 10.8 · Z 0.0
              - listitem [ref=f1e252]:
                - button "22 木 X 6.0 · Z 2.4" [ref=f1e253] [cursor=pointer]:
                  - generic [ref=f1e254]: "22"
                  - generic [ref=f1e255]:
                    - strong [ref=f1e256]: 木
                    - generic [ref=f1e257]: X 6.0 · Z 2.4
              - listitem [ref=f1e258]:
                - button "23 木 X -1.2 · Z -2.4" [ref=f1e259] [cursor=pointer]:
                  - generic [ref=f1e260]: "23"
                  - generic [ref=f1e261]:
                    - strong [ref=f1e262]: 木
                    - generic [ref=f1e263]: X -1.2 · Z -2.4
              - listitem [ref=f1e264]:
                - button "24 木 X -3.6 · Z 4.8" [ref=f1e265] [cursor=pointer]:
                  - generic [ref=f1e266]: "24"
                  - generic [ref=f1e267]:
                    - strong [ref=f1e268]: 木
                    - generic [ref=f1e269]: X -3.6 · Z 4.8
              - listitem [ref=f1e270]:
                - button "25 木 X -8.4 · Z 0.0" [ref=f1e271] [cursor=pointer]:
                  - generic [ref=f1e272]: "25"
                  - generic [ref=f1e273]:
                    - strong [ref=f1e274]: 木
                    - generic [ref=f1e275]: X -8.4 · Z 0.0
              - listitem [ref=f1e276]:
                - button "26 木 X -3.6 · Z -2.4" [ref=f1e277] [cursor=pointer]:
                  - generic [ref=f1e278]: "26"
                  - generic [ref=f1e279]:
                    - strong [ref=f1e280]: 木
                    - generic [ref=f1e281]: X -3.6 · Z -2.4
              - listitem [ref=f1e282]:
                - button "27 木 X 3.6 · Z 0.0" [ref=f1e283] [cursor=pointer]:
                  - generic [ref=f1e284]: "27"
                  - generic [ref=f1e285]:
                    - strong [ref=f1e286]: 木
                    - generic [ref=f1e287]: X 3.6 · Z 0.0
              - listitem [ref=f1e288]:
                - button "28 木 X 1.2 · Z -4.8" [ref=f1e289] [cursor=pointer]:
                  - generic [ref=f1e290]: "28"
                  - generic [ref=f1e291]:
                    - strong [ref=f1e292]: 木
                    - generic [ref=f1e293]: X 1.2 · Z -4.8
              - listitem [ref=f1e294]:
                - button "29 木 X 3.6 · Z -4.8" [ref=f1e295] [cursor=pointer]:
                  - generic [ref=f1e296]: "29"
                  - generic [ref=f1e297]:
                    - strong [ref=f1e298]: 木
                    - generic [ref=f1e299]: X 3.6 · Z -4.8
              - listitem [ref=f1e300]:
                - button "30 木 X 1.2 · Z 2.4" [ref=f1e301] [cursor=pointer]:
                  - generic [ref=f1e302]: "30"
                  - generic [ref=f1e303]:
                    - strong [ref=f1e304]: 木
                    - generic [ref=f1e305]: X 1.2 · Z 2.4
              - listitem [ref=f1e306]:
                - button "31 木 X 8.4 · Z 2.4" [ref=f1e307] [cursor=pointer]:
                  - generic [ref=f1e308]: "31"
                  - generic [ref=f1e309]:
                    - strong [ref=f1e310]: 木
                    - generic [ref=f1e311]: X 8.4 · Z 2.4
              - listitem [ref=f1e312]:
                - button "32 木 X 8.4 · Z -2.4" [ref=f1e313] [cursor=pointer]:
                  - generic [ref=f1e314]: "32"
                  - generic [ref=f1e315]:
                    - strong [ref=f1e316]: 木
                    - generic [ref=f1e317]: X 8.4 · Z -2.4
              - listitem [ref=f1e318]:
                - button "33 木 X -6.0 · Z 2.4" [ref=f1e319] [cursor=pointer]:
                  - generic [ref=f1e320]: "33"
                  - generic [ref=f1e321]:
                    - strong [ref=f1e322]: 木
                    - generic [ref=f1e323]: X -6.0 · Z 2.4
              - listitem [ref=f1e324]:
                - button "34 木 X 6.0 · Z 4.8" [ref=f1e325] [cursor=pointer]:
                  - generic [ref=f1e326]: "34"
                  - generic [ref=f1e327]:
                    - strong [ref=f1e328]: 木
                    - generic [ref=f1e329]: X 6.0 · Z 4.8
              - listitem [ref=f1e330]:
                - button "35 木 X 3.6 · Z -2.4" [ref=f1e331] [cursor=pointer]:
                  - generic [ref=f1e332]: "35"
                  - generic [ref=f1e333]:
                    - strong [ref=f1e334]: 木
                    - generic [ref=f1e335]: X 3.6 · Z -2.4
              - listitem [ref=f1e336]:
                - button "36 木 X 1.2 · Z 0.0" [ref=f1e337] [cursor=pointer]:
                  - generic [ref=f1e338]: "36"
                  - generic [ref=f1e339]:
                    - strong [ref=f1e340]: 木
                    - generic [ref=f1e341]: X 1.2 · Z 0.0
              - listitem [ref=f1e342]:
                - button "37 木 X 10.8 · Z 2.4" [ref=f1e343] [cursor=pointer]:
                  - generic [ref=f1e344]: "37"
                  - generic [ref=f1e345]:
                    - strong [ref=f1e346]: 木
                    - generic [ref=f1e347]: X 10.8 · Z 2.4
              - listitem [ref=f1e348]:
                - button "38 木 X -1.2 · Z 4.8" [ref=f1e349] [cursor=pointer]:
                  - generic [ref=f1e350]: "38"
                  - generic [ref=f1e351]:
                    - strong [ref=f1e352]: 木
                    - generic [ref=f1e353]: X -1.2 · Z 4.8
              - listitem [ref=f1e354]:
                - button "39 木 X 10.8 · Z -4.8" [ref=f1e355] [cursor=pointer]:
                  - generic [ref=f1e356]: "39"
                  - generic [ref=f1e357]:
                    - strong [ref=f1e358]: 木
                    - generic [ref=f1e359]: X 10.8 · Z -4.8
              - listitem [ref=f1e360]:
                - button "40 木 X 3.6 · Z 2.4" [ref=f1e361] [cursor=pointer]:
                  - generic [ref=f1e362]: "40"
                  - generic [ref=f1e363]:
                    - strong [ref=f1e364]: 木
                    - generic [ref=f1e365]: X 3.6 · Z 2.4
              - listitem [ref=f1e366]:
                - button "41 木 X 1.2 · Z 4.8" [ref=f1e367] [cursor=pointer]:
                  - generic [ref=f1e368]: "41"
                  - generic [ref=f1e369]:
                    - strong [ref=f1e370]: 木
                    - generic [ref=f1e371]: X 1.2 · Z 4.8
              - listitem [ref=f1e372]:
                - button "42 木 X 10.8 · Z -2.4" [ref=f1e373] [cursor=pointer]:
                  - generic [ref=f1e374]: "42"
                  - generic [ref=f1e375]:
                    - strong [ref=f1e376]: 木
                    - generic [ref=f1e377]: X 10.8 · Z -2.4
              - listitem [ref=f1e378]:
                - button "43 木 X 6.0 · Z 0.0" [ref=f1e379] [cursor=pointer]:
                  - generic [ref=f1e380]: "43"
                  - generic [ref=f1e381]:
                    - strong [ref=f1e382]: 木
                    - generic [ref=f1e383]: X 6.0 · Z 0.0
              - listitem [ref=f1e384]:
                - button "44 木 X 6.0 · Z -2.4" [ref=f1e385] [cursor=pointer]:
                  - generic [ref=f1e386]: "44"
                  - generic [ref=f1e387]:
                    - strong [ref=f1e388]: 木
                    - generic [ref=f1e389]: X 6.0 · Z -2.4
              - listitem [ref=f1e390]:
                - button "45 木 X 6.0 · Z -4.8" [ref=f1e391] [cursor=pointer]:
                  - generic [ref=f1e392]: "45"
                  - generic [ref=f1e393]:
                    - strong [ref=f1e394]: 木
                    - generic [ref=f1e395]: X 6.0 · Z -4.8
              - listitem [ref=f1e396]:
                - button "46 木 X -10.8 · Z 2.4" [ref=f1e397] [cursor=pointer]:
                  - generic [ref=f1e398]: "46"
                  - generic [ref=f1e399]:
                    - strong [ref=f1e400]: 木
                    - generic [ref=f1e401]: X -10.8 · Z 2.4
              - listitem [ref=f1e402]:
                - button "47 木 X -3.6 · Z 2.4" [ref=f1e403] [cursor=pointer]:
                  - generic [ref=f1e404]: "47"
                  - generic [ref=f1e405]:
                    - strong [ref=f1e406]: 木
                    - generic [ref=f1e407]: X -3.6 · Z 2.4
              - listitem [ref=f1e408]:
                - button "48 木 X -8.4 · Z 4.8" [ref=f1e409] [cursor=pointer]:
                  - generic [ref=f1e410]: "48"
                  - generic [ref=f1e411]:
                    - strong [ref=f1e412]: 木
                    - generic [ref=f1e413]: X -8.4 · Z 4.8
              - listitem [ref=f1e414]:
                - button "49 木 X 8.4 · Z -4.8" [ref=f1e415] [cursor=pointer]:
                  - generic [ref=f1e416]: "49"
                  - generic [ref=f1e417]:
                    - strong [ref=f1e418]: 木
                    - generic [ref=f1e419]: X 8.4 · Z -4.8
              - listitem [ref=f1e420]:
                - button "50 木 X -3.6 · Z 0.0" [ref=f1e421] [cursor=pointer]:
                  - generic [ref=f1e422]: "50"
                  - generic [ref=f1e423]:
                    - strong [ref=f1e424]: 木
                    - generic [ref=f1e425]: X -3.6 · Z 0.0
    - complementary "素材カタログ" [ref=f1e426]:
      - generic [ref=f1e427]:
        - heading "素材を追加" [level=2] [ref=f1e428]
        - generic [ref=f1e431]: 素材を選び、庭をクリックして配置
        - button "オブジェクトパネルを隠す" [expanded] [ref=f1e432]: しまう
      - generic [ref=f1e437]:
        - button "ベンチ 家具 1.6 × 0.85 × 0.65 m" [ref=f1e438] [cursor=pointer]:
          - generic [ref=f1e446]:
            - strong [ref=f1e447]: ベンチ
            - generic [ref=f1e448]: 家具
            - generic [ref=f1e449]: 1.6 × 0.85 × 0.65 m
        - button "レンガ 舗装 0.6 × 0.15 × 0.2 m" [ref=f1e450] [cursor=pointer]:
          - generic [ref=f1e456]:
            - strong [ref=f1e457]: レンガ
            - generic [ref=f1e458]: 舗装
            - generic [ref=f1e459]: 0.6 × 0.15 × 0.2 m
        - button "低木 植物 1.2 × 1.2 × 1.2 m" [ref=f1e460] [cursor=pointer]:
          - generic [ref=f1e466]:
            - strong [ref=f1e467]: 低木
            - generic [ref=f1e468]: 植物
            - generic [ref=f1e469]: 1.2 × 1.2 × 1.2 m
        - button "木 植物 2 × 4 × 2 m" [ref=f1e470] [cursor=pointer]:
          - generic [ref=f1e472]:
            - strong [ref=f1e473]: 木
            - generic [ref=f1e474]: 植物
            - generic [ref=f1e475]: 2 × 4 × 2 m
```

# Test source

```ts
  8   | // mutations of other trees. Timings are evidence, not a machine-dependent pass threshold.
  9   | test('TREE50. Blender樹木50本の共有描画・独立編集・MySQL保存復元', async ({ page, request }) => {
  10  |   const response = await request.post(`${api}/gardens`, {
  11  |     data: { name: `Blender fifty ${Date.now()}`, width: 26, depth: 14 },
  12  |   });
  13  |   expect(response.ok()).toBe(true);
  14  |   const garden = await response.json();
  15  |   const objects = Array.from({ length: 50 }, (_, index) => ({
  16  |     id: randomUUID(), assetId: 'tree_oak',
  17  |     position: { x: -10.8 + index % 10 * 2.4, y: 0, z: -4.8 + Math.floor(index / 10) * 2.4 },
  18  |     rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 },
  19  |   }));
  20  |   const errors: string[] = [];
  21  |   const downloads: string[] = [];
  22  |   page.on('pageerror', (error) => errors.push(error.message));
  23  |   page.on('request', (entry) => {
  24  |     if (new URL(entry.url()).pathname === '/models/tree-oak.glb') downloads.push(entry.url());
  25  |   });
  26  |   try {
  27  |     const stored = await request.put(`${api}/gardens/${garden.id}`, { data: { ...garden, objects } });
  28  |     expect(stored.ok()).toBe(true);
  29  |     await page.goto(`/gardens/${garden.id}`);
  30  |     await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
  31  |     expect(downloads).toHaveLength(1);
  32  |     const model = await page.request.get('/models/tree-oak.glb');
  33  |     expect((await model.body()).length).toBeLessThan(220 * 1024);
  34  | 
  35  |     const report = await page.evaluate(async () => {
  36  |       const moduleUrl = performance.getEntriesByType('resource').map((entry) => entry.name)
  37  |         .find((url) => url.includes('/@react-three_fiber.js'));
  38  |       const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="garden-canvas"] canvas');
  39  |       if (!moduleUrl || !canvas) throw new Error('3D renderer is missing.');
  40  |       const fiber = await import(moduleUrl) as typeof import('@react-three/fiber');
  41  |       const root = fiber._roots.get(canvas);
  42  |       if (!root) throw new Error('3D renderer root is missing.');
  43  |       const state = root.store.getState();
  44  |       const meshes: Mesh[] = [];
  45  |       state.scene.traverse((node) => {
  46  |         if (node.name.startsWith('Oak') && (node as Mesh).isMesh) meshes.push(node as Mesh);
  47  |       });
  48  |       const surfaces = meshes.map((mesh) => mesh.material as MeshStandardMaterial);
  49  |       const leaves = surfaces.find((surface) => surface.name === 'Oak foliage');
  50  |       const intervals: number[] = [];
  51  |       let previous = performance.now();
  52  |       for (let index = 0; index < 120; index += 1) {
  53  |         await new Promise(requestAnimationFrame);
  54  |         const now = performance.now();
  55  |         intervals.push(now - previous);
  56  |         previous = now;
  57  |       }
  58  |       const average = intervals.slice(10).reduce((sum, value) => sum + value, 0) / 110;
  59  |       return {
  60  |         meshes: meshes.length,
  61  |         geometries: new Set(meshes.map((mesh) => mesh.geometry)).size,
  62  |         materials: new Set(surfaces).size,
  63  |         textures: new Set(surfaces.map((surface) => surface.map)).size,
  64  |         alphaTest: leaves?.alphaTest, transparent: leaves?.transparent,
  65  |         calls: state.gl.info.render.calls, triangles: state.gl.info.render.triangles,
  66  |         estimatedFps: 1000 / average,
  67  |       };
  68  |     });
  69  |     expect(report.meshes).toBe(100);
  70  |     expect(report.geometries).toBe(2);
  71  |     expect(report.materials).toBe(2);
  72  |     expect(report.textures).toBe(2);
  73  |     expect(report.alphaTest).toBe(0.5);
  74  |     expect(report.transparent).toBe(false);
  75  |     expect(report.calls).toBeLessThan(130);
  76  |     expect(report.triangles).toBeLessThan(280_000);
  77  | 
  78  |     await page.getByTestId('object-row-0').click();
  79  |     const changedId = await page.getByTestId('object-row-0').getAttribute('data-object-id');
  80  |     if (!await page.locator('.object-details').evaluate((element) => (element as HTMLDetailsElement).open)) await page.getByTestId('object-details-toggle').click();
  81  |     await page.getByTestId('position-x').fill('-10');
  82  |     if (!await page.locator('.object-details').evaluate((element) => (element as HTMLDetailsElement).open)) await page.getByTestId('object-details-toggle').click();
  83  |     await page.getByTestId('rotation-y').fill('45');
  84  |     if (!await page.locator('.object-details').evaluate((element) => (element as HTMLDetailsElement).open)) await page.getByTestId('object-details-toggle').click();
  85  |     await page.getByTestId('uniform-scale').fill('1.1');
  86  |     await page.getByTestId('save-garden').click();
  87  |     await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  88  |     await page.reload();
  89  |     await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
  90  |     const restored = await (await request.get(`${api}/gardens/${garden.id}`)).json();
  91  |     expect(restored.objects).toHaveLength(50);
  92  |     for (const original of objects) {
  93  |       const actual = restored.objects.find((object: { id: string }) => object.id === original.id);
  94  |       if (original.id === changedId) {
  95  |         expect(actual.position.x).toBe(-10);
  96  |         expect(actual.rotation.y).toBeCloseTo(Math.PI / 4, 5);
  97  |         expect(actual.scale).toEqual({ x: 1.1, y: 1.1, z: 1.1 });
  98  |       } else {
  99  |         expect(actual).toEqual(original);
  100 |       }
  101 |     }
  102 |     await page.getByRole('button', { name: '初期視点', exact: true }).click();
  103 |     await mkdir('artifacts/e2e', { recursive: true });
  104 |     await page.screenshot({ path: 'artifacts/e2e/tree-50-e2e.png', fullPage: true });
  105 |     await writeFile('artifacts/e2e/tree-50-e2e.json', JSON.stringify({ report, restored, errors }, null, 2));
  106 |     expect(errors).toEqual([]);
  107 |   } finally {
> 108 |     await request.delete(`${api}/gardens/${garden.id}`);
      |                         ^ Error: apiRequestContext.delete: Target page, context or browser has been closed
  109 |   }
  110 | });
  111 | 
```