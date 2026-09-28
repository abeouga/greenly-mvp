# 実装契約

## Context

このリポジトリは空の新規構成です。初期MVPでは人が編集するGardenDocumentを中心にし、AI、認証基盤、クラウド、物理エンジンは導入しません。

## Decision

- Frontend: React 19 + TypeScript + Vite、R3F 9 + Drei 10、Zustand、TanStack Query。Viteの `/api` proxyで同一オリジン通信します。
- Backend: Java 21向けSpring Boot、Web、Validation、Data JPA、MySQL、Flyway。`dev`/`e2e` profileのデモ利用者はサーバー側固定値で、`server.address=127.0.0.1` に制限します。
- 保存形式: `{schemaVersion:1,id,revision,name,width,depth,objects}`。`revision`は同時更新制御、`schemaVersion`は形式識別です。
- 単位: Three.js 1 unit = 1m。X/Zだけ庭の中心からの座標、配置Y=0、回転はY軸ラジアン、scaleはxyz同値の0.25..3です。
- 配置アセットIDは `tree_oak`, `shrub_boxwood`, `brick_paver`, `bench_wood` とし、GLBはリポジトリへ同梱します。生成元はこのリポジトリの基本形状スクリプトです。

## API契約

- `GET /api/assets` → `{id,name,category,modelUrl,baseDimensions:{width,height,depth}}[]`
- `GET /api/gardens` → `{id,name,width,depth,revision,updatedAt}[]`
- `POST /api/gardens` `{name,width,depth}` → 新規GardenDocument
- `GET /api/gardens/{id}` → GardenDocument
- `PUT /api/gardens/{id}` → revisionを含むGardenDocument全体。要求revision一致時だけトランザクション保存し、成功revisionを1増やします。
- `DELETE /api/gardens/{id}` → 204
- 不正入力400、所有者スコープ内の不存在404、revision競合409。エラー形式は `{status,code,message}`。

## Alternatives / Consequences

GardenDocumentとThree.jsのランタイムを分離するため、表示実装を替えても保存形式を維持できます。シングルユーザー開発を簡単にするため認証は省きますが、ownerは必ずサーバーが決定し、デモprofile以外で起動できない構成にします。実利用には認証・認可の実装が別途必要です。

## データフローと失敗処理

操作 → 検証済み編集操作 → ZustandのGardenDocument → R3F表示。保存ボタン時だけスナップショットをPUTし、成功時に応答revisionで確定します。保存中は編集を抑止し、失敗時は編集内容とdirty状態を保持して再試行を表示します。ロード失敗は再試行を提示します。GLB失敗は他のモデル表示を止めず、対象削除または再試行へ誘導します。サーバーも庭寸法・配置数・座標・倍率・固定軸・assetId・ID重複を検証します。

## Rollback

初期DBはFlyway V1で作成します。既存スキーマを破壊するマイグレーションや起動時のテーブル再作成は行いません。GardenDocumentはschemaVersion 1で保存し、将来形式変更時は読み書き互換を別途決定します。
