# FastAPI移行

## Context

Spring Boot/JPA/FlywayをPython APIへ置換し、既存API、MySQL、schemaVersion 1、写真・輪郭を含む現在の作業状態を維持する。Javaを完全にAPI起動依存から外すという選択により、マイグレーション管理もAlembicへ移す。

## Decision

Python 3.12、FastAPI、Pydantic v2、同期SQLAlchemy 2、PyMySQL、Alembic、Pillowを使う。`backend/pyproject.toml`と`uv.lock`で依存を固定する。HTTP DTO・ドメイン検証・ORMを分け、同期ルートでリクエスト単位のSessionを使用する。更新・削除はowner付きSELECT FOR UPDATEで庭行をロックし、revision比較から配置全置換までを一つのトランザクションで処理する。Sessionを共有せず、失敗時は全変更をrollbackする。日時はMySQLセッションUTC、応答はUTCのISO 8601。

URL/JSON/ステータス/日本語エラーを維持する。Pydanticの形式エラーは400 INVALID_REQUEST、ドメインエラーは既存code、DB整合性競合は409 STORAGE_CONFLICT。未知項目も拒否する。`photo`省略/nullは写真なし。識別ヘッダー`X-Greenly-Backend: fastapi`で旧Java APIの誤再利用を防ぐ。

dev/e2eだけで固定ownerをサーバー決定し、127.0.0.1へbindする。`GREENLY_PROFILE`、`GREENLY_HOST`、`GREENLY_PORT`を使い、DBの環境変数名は従来のGREENLY_DB_* / GREENLY_E2E_DB_*。devは`.env`、e2eは`.env.e2e`だけを読み、プロセス環境変数を優先する。e2e接続先はgreenly_e2eから始まる専用DBに限定する。DB資格情報はWebプロセスへ渡さない。

## Migration

`npm run migrate:api`およびAPI起動前に安全な移行処理を行う。DBごとのMySQL advisory lockで並行移行を防ぎ、既存テーブル名・列・型・nullable・主キー・索引・外部キー・InnoDBと履歴を照合する。

- 空DB: Alembic 0001(旧V1のSQLをそのまま実行) → 0002(旧V2のphoto_json追加)。
- Flyway V1: 構造照合 → mysqldumpバックアップ → 0001 stamp → 0002 upgrade。
- Flyway V1+V2: 構造照合 → バックアップ → 0002 stamp。既存データやFlyway履歴には書き込まない。
- Alembic 0002: 構造照合後、そのまま起動。0001ならバックアップ後にupgrade。
- 履歴不明・失敗履歴・未知版・構造不一致: stamp/DDLを開始せず終了。

バックアップはGit外の`%LOCALAPPDATA%\Greenly\backups`へ保存する。`GREENLY_BACKUP_DIR`で変更できる。mysqldumpが見つからない、権限不足、バックアップ失敗なら既存DBを変更しない。パスワードをコマンド引数やログへ載せない。MySQL DDLは非原子的なので、中断した不完全な移行は構造不一致として止め、バックアップからの復旧と原因修正を行う。写真列や庭を消す自動downgradeは提供しない。

## Alternatives / Consequences

Flyway実行を残すとJava依存が必要になるため採用しない。async ORM/driverは今回のローカルAPIの移行に必要な変更ではないため、同期処理を選ぶ。認証・公開運用への移行は含めない。旧Javaソースの作業状態は削除前にGit外へ退避し、無関係なフロント/オーバーレイ変更を保つ。

## Verification

Chromiumの実ポインターE2Eを主要な受入検証とし、実FastAPI・専用MySQLを使う。API/DB独立検証は、通常のブラウザーE2Eで同時PUTの行ロック、途中の整合性違反による全rollback、owner分離、既存Flyway DB採用/新規DB作成を確実に再現できないため追加する。単純な実装の写しとなるユニットテストは追加しない。

`npm run verify:api`は専用DBへ実HTTPを送り、固有名の一時DBで移行経路を検証する。自身が作成した庭・一時DBだけを削除する。レポート/ログは`artifacts/fastapi`、ブラウザーの保存JSON・スクリーンショットは`artifacts/e2e`へ保存する。実利用者データや資格情報は成果物へ含めない。

## 実行結果（2026-10-01）

- Python/JavaScript lint、TypeScript型チェック、Python compile、フロントエンド本番ビルド成功。
- 開発DBのFlyway V1/V2をバックアップ後にAlembic 0002へ採用。assets 4行、gardens 2行、placed_objects 6行、Flyway履歴2行の移行前後SHA256が一致。既存庭2件の写真・配置・DOUBLE座標を実APIの応答と照合し、一致を確認。`artifacts/fastapi/development-data-preservation.json`。
- 独立した実MySQL 8.0.45でAPI検証成功。同時更新200/409、保存途中の整合性違反による全rollback、owner分離、PNG/JPEG往復、各入力拒否、削除cascadeを確認。新規DB、Flyway V1/V2の移行と再起動、構造不一致・失敗履歴の変更前拒否も成功。`artifacts/fastapi/backend-verification.json`。
- 隔離MySQLおよび既存サービスの専用greenly_e2e DBの双方でChromium全9件成功。写真・四隅・6点輪郭・配置・保存復元・3D切替を含む。成果物は`artifacts/e2e`とPlaywright HTMLレポート。既存DB側ログは`artifacts/fastapi/existing-mysql-e2e.log`（Git対象外）。
- root start.ps1によるAPI/Web起動、Web経由APIのFastAPI識別、停止後8080/5173の待受0件を確認。`artifacts/fastapi/launcher-verification.json`。
- 旧Javaソース・Maven関連・既存の未コミット変更を`D:\GreenlyMigrationBackups\20261001-fastapi`へ退避。開発DBのSQLバックアップはGit外のGreenly backupsに保存。Python/MySQLの資格情報はローカル環境設定だけで管理。

Webビルドのチャンクサイズ警告およびThree.jsのClock非推奨警告は残る。全E2Eは成功している。公開運用向け認証は今回の移行範囲に含まれない。
