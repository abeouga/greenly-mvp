# ブラウザー用3Dアセット

## Blenderで作成した樹木

既存の `tree_oak` を、コナラを想定した葉脈・葉の切り抜き・樹皮付きモデルへ差し替えました。外部の植物モデルや写真は使用していません。

| 項目 | 値 |
| --- | --- |
| 配信用モデル | `frontend/public/models/tree-oak.glb` |
| 編集元 | `assets/blender/tree-oak.blend`（画像を内包） |
| 配信容量 | 178,344 bytes、約174.2 KiB |
| 三角形 | 5,422 / 本、50本で271,100 |
| メッシュ・材質・画像 | 各2種類。50本で同じデータを共有 |
| 葉 | 644枚の折り目付きカードに、葉脈付きの枝葉画像を配置 |
| 葉の表示 | 両面・alpha MASK。半透明の並び替えを使用しない |
| 画像 | 葉512×512、樹皮256×512、GLB内のWebP |
| 座標 | 16bit。最大の位置誤差は約0.028mm |
| 寸法・原点 | 幅2m・高さ4m・奥行2m、幹の接地中心 |
| サムネイル | `frontend/public/icons/tree-oak.webp`、5,730 bytes |

Blender書き出し直後の560,360 bytesから、座標・法線・画像の圧縮で68.2%削減しました。`KHR_mesh_quantization` と `EXT_texture_webp` を使用します。現行Three.jsのGLTFLoaderで読み込め、Dracoなどの追加デコーダーを外部からダウンロードしません。

## Blenderの導入

このPCの実行ファイル：`C:/Tools/Blender/blender-4.5.14-windows-x64/blender.exe`

[Blender公式配布版](https://download.blender.org/release/Blender4.5/blender-4.5.14-windows-x64.zip)をCドライブへ展開し、公式のSHA256一覧と照合してから起動しました。ZIPは展開後に削除しています。

SHA256：`b9533d2397ac1984db4466fb23a7a4649391cca93f6e84209f9bcc60d071c8b9`

## 再生成

プロジェクトルートで実行します。Python処理は既存バックエンド環境のPillowを使用します。

```powershell
& 'C:/Tools/Blender/blender-4.5.14-windows-x64/blender.exe' --background --python scripts/blender/create_oak.py
& backend/.venv/Scripts/python.exe scripts/blender/optimize_oak.py
```

`create_oak.py` は決まった乱数から幹・枝・葉・樹皮画像と編集元を生成します。`optimize_oak.py` は直後のGLBに対し圧縮と葉のMASK設定を行います。圧縮済みファイルへ二重に適用するとエラーになります。容量の測定結果は `assets/blender/tree-oak-metrics.json` に記録します。

サムネイルの再生成：

```powershell
& 'C:/Tools/Blender/blender-4.5.14-windows-x64/blender.exe' --background --python scripts/blender/render_oak_preview.py
& backend/.venv/Scripts/python.exe -c "from PIL import Image; im=Image.open('artifacts/models/tree-oak-preview.png'); im.thumbnail((160,160)); im.save('frontend/public/icons/tree-oak.webp',quality=86,method=6)"
```

## 既存アセットとの関係

`npm run assets:generate` は従来の単純形状を使う低木・レンガ・ベンチの3個を再生成します。樹木GLBは保持し、単純な球と円柱で上書きしません。

| assetId | ファイル | 基準寸法：幅×高さ×奥行 (m) |
| --- | --- | --- |
| `tree_oak` | `tree-oak.glb` | 2 × 4 × 2 |
| `shrub_boxwood` | `shrub-boxwood.glb` | 1.2 × 1.2 × 1.2 |
| `brick_paver` | `brick-paver.glb` | 0.6 × 0.15 × 0.2 |
| `bench_wood` | `bench-wood.glb` | 1.6 × 0.85 × 0.65 |

### Context / Decision / Alternatives / Consequences

- **Context**：樹木の見た目を改善し、50本の表示と小さな配信容量を両立する必要があります。
- **Decision**：既存のassetId・基準寸法・接地原点を保持してGLBを差し替えます。ID、庭データ、API、DB構造、ECの商品対応付けは変更しません。
- **Alternatives**：全ての葉を立体化すると形状が増え、樹冠を球で表現すると葉の見た目が失われます。今回は折り目付きの枝葉カードと切り抜き画像を採用しました。
- **Consequences**：モデルは共有キャッシュを使い、各配置の座標・回転・倍率は独立します。WebPとメッシュ量子化に対応するブラウザー・ローダーを前提とします。性能値はこのPCでの測定結果で、他端末の保証ではありません。

## 実動作確認

2026-10-11、通常起動中のCanvasにUIから50本を配置し、保存・再読み込み・完成イメージ・スマートフォン表示を確認しました。検証用の庭「Blender コナラ50本・軽量モデル確認」を開発DBに残しています。

- GPU：AMD Radeon (TM) Graphics / ANGLE Direct3D11。
- 1600×1000px、視点を連続回転させた240フレームで約59.99fps、平均16.67ms、95パーセンタイル17.90ms。
- 木100メッシュに対して、形状・材質・画像は各2種類。GLBの読み込みは1回です。
- 初回の黒化を起こした不要な色変換を削除しました。
- 未選択オブジェクトのTransformControls生成を止めました。同じ50本の場面でGPUに保持された形状数が63から15へ減りました（地面・グリッド・選択枠などを含む）。
- 型確認、lint、API lint、APIコンパイル、フロントビルド成功。既存の大きなJavaScriptチャンクの警告は残っています。
- 実API・専用MySQLの関連E2Eは7件成功。50本の共有描画、個別変形、他の木の不変性、保存復元、4素材、モデル読み込み失敗からの復旧、回転リング、写真校正後の表示を確認しています。

証跡：

- [50本の実画面](../artifacts/e2e/blender-oak-50-final.png)
- [スマートフォン表示](../artifacts/e2e/blender-oak-50-mobile.png)
- [実GPUでの性能測定](../artifacts/e2e/blender-oak-50-performance-final.json)
- [50本の保存済み庭データ](../artifacts/e2e/blender-oak-50-garden.json)
- [専用MySQLでの回帰確認](../artifacts/e2e/tree-50-e2e.json)
