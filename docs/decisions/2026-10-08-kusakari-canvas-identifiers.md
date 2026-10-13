# Kusakari Canvas 技術識別子と保存先の統一

## Context

サービス内の3D庭づくり機能を Kusakari Canvas として扱う方針が決まり、実装の一部には以前の Greenly / Kusakari Garden 識別子が残っていました。環境変数、Python/npm パッケージ、API ヘッダー、MySQL データベースとユーザー、デモ所有者ID、ローカル保存先が一致しないと、起動・保存・検証で異なる設定を参照します。

## Decision

- 現行の技術識別子は `kusakari_canvas` / `kusakari-canvas` / `KUSAKARI_CANVAS_*` / `KusakariCanvas` に統一します。
- Python import/package、npm package、APIヘッダー、MySQL DB名と専用ユーザー名、デモ所有者ID、SysOverRay設定・ログ保存先を同じ識別子へ移行します。
- ユーザー領域のアプリデータは `%LOCALAPPDATA%\KusakariCanvas`、オーバーレイの状態は `%LOCALAPPDATA%\KusakariCanvasOverlay` を使用します。
- 旧名称の環境変数、DB、ユーザー領域を実行時の別名として読み込む互換処理は設けません。
- 既存DBの内容は新DBへバックアップ・複製し、`owner_id` を新しいデモ所有者IDに変換してから、新しい設定でスキーマ検証します。元DBは複製と検証が完了するまで変更・削除しません。

## Alternatives

- 古いDB名・ユーザー名を保存先として維持する: 技術識別子がサービス名と食い違い、設定・運用資料が二重になります。
- 旧名と新名の両方を現行コードで読む: 移行後も設定分岐が残り、どちらが正本か不明確になります。
- 元DBを上書きして名称だけ変える: 失敗時に復旧できず、MySQLのスキーマ名変更にも依存します。

## Consequences

- 起動・セットアップ・テストは Kusakari Canvas 名の設定だけを参照します。
- 既存MySQLのデータ移行は、バックアップ、全テーブル・ビュー等の複製、所有者ID変換、アプリ用ユーザー権限、Alembicスキーマ検証の順に行います。
- 元DBは移行検証後も直ちに削除せず、復旧用バックアップとして保持します。元DBの削除は別途明示的に判断します。
- 2026-10-08 に `greenly` から `kusakari_canvas`、`greenly_e2e` から `kusakari_canvas_e2e` へ複製しました。テーブル・ビュー構成とテーブル別行数を照合し、開発DBでは4件の所有者IDを変更して、両DBのAlembic revision `0002` を確認しました。
- 元DBは変更・削除していません。SQLバックアップと実行レポートは `%LOCALAPPDATA%\KusakariCanvas\backups` に保持しています。
