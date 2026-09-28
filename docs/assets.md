# 開発用GLBアセット

`npm run assets:generate` が `frontend/public/models/` に4個のGLBを生成します。Three.jsの直方体、球、円柱に相当する単純なメッシュをGLB 2.0へ格納するローカルNodeスクリプトで生成し、外部モデル・画像・通信を使いません。モデルと材質はGreenly用に作成した開発用形状で、写実性はありません。

| assetId | ファイル | 基準寸法 (m) | 原点 |
| --- | --- | --- | --- |
| `tree_oak` | `tree-oak.glb` | 2 × 4 × 2 | 幹の接地中心 |
| `shrub_boxwood` | `shrub-boxwood.glb` | 1.2 × 1.2 × 1.2 | 底面中央 |
| `brick_paver` | `brick-paver.glb` | 0.6 × 0.15 × 0.2 | 底面中央 |
| `bench_wood` | `bench-wood.glb` | 1.6 × 0.85 × 0.65 | 脚の接地範囲中心 |

基準寸法はカタログの配置目安で、ユーザー編集倍率と分離します。既存庭の assetId の意味や基準寸法を変える場合は、保存データへの影響を扱うデータ移行を別途行ってください。
