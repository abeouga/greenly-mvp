# 写真直後から始点1で閉じる庭輪郭描画

検証開始日: 2026-10-01（JST）。最終E2Eは2026-10-02の00:00に終了。

## 修正した操作

前回の「投影基準4点を指定した後、別の輪郭を描く」設計は、要求された操作と一致していなかった。写真上の最初のクリックから庭輪郭を描く操作へ修正した。

- 写真選択後の最初のクリックが輪郭の頂点1になる。2、3、4、5…と同じ輪郭に追加でき、4点目では終了しない。
- 最新の頂点からマウス位置へ仮線が追従する。
- 3〜64点を配置し、始点1の円またはその接続リングをクリックすると確定する。始点は重複追加しない。独立した確定ボタンは設けていない。
- 始点の近くに別の頂点を追加しても自動確定しない。自己交差や面積不足の輪郭は確定を拒否する。
- 頂点番号、「最後の点を戻す」、描画取消、確定後の頂点ドラッグを提供する。取消では以前の確定済み輪郭を復元する。
- 描画途中の点は一時状態に保持し、面・グリッド・保存・3D切替・写真上での新規配置を確定まで制限する。同じ写真の再選択でも頂点0個から描き直す。

## 写真と3Dの対応

確定した輪郭の画像上の外接矩形を、庭の幅・奥行きに対応させる内部変換用4点として自動生成する。地面の形状には実際の多角形を使用する。

この対応付けは写真の遠近歪みを自動補正しない。既存写真の保存済み変換は輪郭の描き直し・頂点編集まで保持する。編集時は変換が更新されるため、オブジェクトの3D座標を変更しなくても写真上のマーカー位置が変わる場合がある。

DB、API DTO、schemaVersionの変更はない。操作と制約をREADME、docs/geometry-photo.md、docs/architecture.mdへ記録した。

## 実行結果

| 確認 | 結果 |
| --- | --- |
| `npm run precheck` | 通過。フロント・E2Eの型チェック、JS/Python lint、Python compileを含む |
| `npm run build:web` | 通過。既存の500kB超のバンドル警告あり |
| 初回の写真操作対象E2E | 5件通過、26.0秒 |
| 始点付近への別頂点追加の対象E2E | 1件通過、9.5秒 |
| 最終Chromium E2E | 全14件通過、1.3分 |

「テストは最小限」の追加指示は最終E2Eの終了後に受領した。以後、追加のテスト実行は行っていない。

Chromium、実FastAPI（127.0.0.1:18080）、実Vite（127.0.0.1:15174）、専用MySQL DBを使用した。正常系APIはモックしていない。写真は800×600pxの合成PNGを使用した。

## 確認したユーザーフロー

- 写真上の最初のクリックから輪郭を開始し、4点・5点の時点でも描画中を維持する。始点1のクリックでのみ閉じ、保存・再読み込み後も順序と形状を保持する。
- 仮線の追従、表示サイズ変更、6点の凹多角形、配置・保存・再読み込み・3D表示・視点操作を確認した。
- 2点や自己交差する輪郭の拒否、点を戻した後の三角形確定、取消、描画中の離脱警告、同じ画像の再選択を確認した。
- 下書きではサーバーのJSON・revisionを変更しない。APIへの交差輪郭・不正な変換用4点順序はHTTP 400で拒否し、revisionを保持した。
- 旧形式の変換を保持して復元し、その範囲外へ輪郭を描き直して保存・再読み込みできる。
- 始点に近い別の4点目を追加しても描画を継続し、始点クリック後に確定できる。

## 保存した成果物

- [4点で描画を継続](garden-photo-quad-draft.png)、[再読み込み後](garden-photo-quad.png)、[実API JSON](garden-photo-quad.json): revision=1、boundary=4、objects=0
- [5点で描画を継続](garden-photo-pentagon-draft.png)、[再読み込み後](garden-photo-pentagon.png)、[実API JSON](garden-photo-pentagon.json): revision=1、boundary=5、objects=0
- [仮線](garden-photo-boundary-draft.png)、[6点の再読み込み後](garden-photo-polygon.png)、[凹多角形の3D表示](garden-photo-polygon-3d.png)、[実API JSON](garden-photo-polygon.json): revision=1、boundary=6、objects=1
- [三角形](garden-photo-triangle.png)、[実API JSON](garden-photo-triangle.json): revision=1、boundary=3、objects=0
- [旧形式からの描き直し](garden-photo-legacy-redraw.png)、[実API JSON](garden-photo-legacy-redraw.json): revision=2、boundary=4、objects=0
- [始点付近への別頂点追加](garden-photo-close-vertices.png)、[実API JSON](garden-photo-close-vertices.json): revision=1、boundary=4、objects=0
- [最終14件のHTMLレポート](../playwright-report/index.html)

試験用の庭だけを各ケース終了時にAPIで削除した。終了後、専用E2Eポート18080/15174の待受は0件だった。開発サーバー5173から取得したソースでは、HTTP 200、新しい輪郭案内、旧4点入力案内の除去を確認した。これは取得時点の確認であり、現在の稼働継続を示すものではない。

実写真の測量精度、遠近補正、高さのある物体の写真合成、実寸の自動推定は評価していない。