# Greenly 手動3D庭エディタ MVP

Greenlyは、PCブラウザーで庭を手動設計するローカル開発用MVPです。庭の名前・寸法を登録し、4種類の開発用GLBを配置・編集し、Spring Boot API経由でMySQLへ保存して復元します。AI提案、認証、資材計算、写実的なモデルは含みません。

## 必要な環境

- Node.js 22.12以降（Node 24で確認。Vite 8の実行要件は20.19以降または22.12以降）
- JDK 21（Java 21のバイトコードを生成。Java 25でもコンパイル可能）
- MySQL Server 8.0。開発用とE2E専用の2データベースを作成できるローカルアカウント
- Chromium（E2Eを実行するとき）
- Mavenは不要です。WindowsはMaven Wrapperを使います。初回はMaven WrapperがMaven配布物を取得します。

JavaScript依存バージョンは`package-lock.json`で固定しています。R3F 9はReact 19と組み合わせ、Drei 10はFiber 9をpeer dependencyとして指定しています。詳細は[React Three Fiberの導入資料](https://r3f.docs.pmnd.rs/getting-started/installation)と`docs/architecture.md`を参照してください。

## Windowsでの初回設定

リポジトリのルートで実行します。

```powershell
npm install
npm run assets:generate
```

MySQLへ管理者で接続し、開発用とE2E用に独立したDB・ユーザーを作ります。下記のパスワードは例なので、ローカルだけで使用する値に置き換えてください。アプリ接続情報はソースやGitへ保存しません。

```powershell
$mysql = Join-Path $env:ProgramFiles 'MySQL\MySQL Server 8.0\bin\mysql.exe'
& $mysql -u root -p
```

MySQLプロンプトで実行します。

```sql
CREATE DATABASE IF NOT EXISTS greenly CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS greenly_e2e CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER IF NOT EXISTS 'greenly_dev'@'localhost' IDENTIFIED BY 'replace-with-local-password';
CREATE USER IF NOT EXISTS 'greenly_e2e'@'localhost' IDENTIFIED BY 'replace-with-another-local-password';
GRANT ALL PRIVILEGES ON greenly.* TO 'greenly_dev'@'localhost';
GRANT ALL PRIVILEGES ON greenly_e2e.* TO 'greenly_e2e'@'localhost';
```

## 起動

リポジトリ直下の`start.bat`をダブルクリックすると、APIとWebを同じコンソールに出力して起動します。プロジェクトのフォルダーを移動しても、バッチ自身の場所からPowerShellスクリプトや依存ファイルを解決します。起動後はその画面を閉じず、停止時にCtrl+Cを押してください。終了確認が表示されたら、Yで閉じるかNでログ確認後のキー入力待ちに進みます。

初回は`.env.example`を`.env`へコピーし、利用するMySQLユーザーとパスワードを設定します。`.env`がない場合、パスワードは起動時に非表示で入力できます。プロセス環境変数が設定済みの場合は`.env`より優先します。

```powershell
Copy-Item .env.example .env
# .envを編集してGREENLY_DB_PASSWORDを設定
.\start.bat
```

PowerShellから直接起動する場合は、次のコマンドを使えます。カレントディレクトリがリポジトリ外でも動作し、パスに空白が含まれていても引用符で指定できます。

```powershell
& 'C:\Users\hanam\Desktop\gleenly-mvp\start.ps1'
```

スクリプトは`127.0.0.1`だけにbindし、APIは`8080`、Webは`5173`を優先します。使用中のポートは、APIが`18081`・`18082`、Webが`5174`・`5175`へ順に切り替わります。APIが既に応答中なら、同梱アセットIDを確認したうえで既存のGreenly APIを再利用します。起動完了後にブラウザーを開きます。`start.bat -NoBrowser`または`start.ps1 -NoBrowser`は自動起動を抑える検証用オプションです。APIとWebのログは一つのコンソールに表示されます。

初回API起動時にFlywayがテーブルを作成し、4つのアセットカタログ項目を投入します。起動のたびに既存庭を消す設定はありません。停止時にCtrl+Cを押すと、この起動スクリプトが起動したAPI・Webプロセスを停止します。既に起動していたAPIは停止しません。APIが起動に失敗した場合は、子プロセス終了を検出して長時間待たずにエラーを表示します。Viteは`/api`を選択されたAPIポートへproxyします。CORSの全許可設定は追加していません。

E2Eでは引き続き専用の`GREENLY_E2E_DB_USER`と`GREENLY_E2E_DB_PASSWORD`を、実行するPowerShellの環境変数として設定します。起動スクリプトはE2E用DB資格情報を読み込みません。

## 操作

1. 庭名、幅、奥行きを入力して作成します。初期寸法は10m × 8mです。各辺は1〜50mで、作成後の寸法変更はできません。
2. 左のカタログで種類を選び、3D地面をクリックします。1目盛りは1mです。
3. 配置済み一覧またはモデルをクリックして選択します。移動ツールではモデル本体をドラッグできます。回転ツールでは対象の周囲に出る円形ハンドルをドラッグします。ハンドルはホバー時に色が変わり、操作中にEscを押すと開始前の角度へ戻ります。拡縮は選択枠のギズモか右の入力欄を使います。
4. 回転入力は度、保存値はラジアンです。倍率は縦横比を維持し、0.25〜3.0に制限します。オブジェクトのY座標とX/Z回転は固定です。
5. 上部の「保存」で庭全体を送信します。移動操作ごとには送信しません。失敗時は編集状態を保持し、表示された再試行操作を使います。
6. カメラは左ドラッグで回転、右ドラッグでパン、ホイールでズームできます。「上から見る」は再現可能な視点、「初期視点」は斜め上の視点へ戻します。
7. 削除キーまたは右側の「削除」で選択オブジェクトを削除します。入力欄にフォーカス中は削除キーを横取りしません。未保存で一覧へ戻る場合は確認します。

座標は庭の中心をX=0,Z=0、地面をY=0とします。Xは幅、Zは奥行きです。庭内制限はオブジェクトの配置基準点に適用します。オブジェクト同士の重なりとモデル端部の庭外へのはみ出しは許可します。

## アセット

`npm run assets:generate`は基本形状だけを使った実GLBファイルを`frontend/public/models/`へ作ります。生成元と寸法は[`docs/assets.md`](docs/assets.md)に記録しています。ファイルは開発用で、写実的な植物モデルではありません。

新しいアセットを追加するときは、生成スクリプトに安定ID・GLB部品・接地原点を追加し、`V2`以降のFlyway migrationで新しいIDのseedを追加します。既存IDの基準寸法や意味は黙って変更しないでください。カタログのAPI応答とGLB実寸法を一致させてください。

## チェックとE2E

```powershell
# TypeScript型チェック、E2E型チェック、lint、Java compile
npm run precheck

# フロントエンド本番ビルド
npm run build:web

# Chromiumを用意（初回のみ）
npx playwright install chromium

# 全E2E。専用ポート18080/15174でAPI(e2e profile)とViteを起動し、greenly_e2e DBを使用
npm run test:e2e

# 対象シナリオだけ実行
npm run test:e2e -- --grep 'A\. 庭作成'
npm run test:e2e -- --grep 'D\. 保存失敗'
npm run test:e2e -- --grep 'H\. 回転リング'
```

E2Eの前に同じPowerShellで`GREENLY_E2E_DB_USER`と`GREENLY_E2E_DB_PASSWORD`を設定してください。`GREENLY_E2E_DB_URL`を指定するとE2E接続先を変更できます。E2E成功系は実フロント、実Spring Boot API、専用MySQL DBを使います。正常系APIはモックしていません。障害系だけ、Playwright routeで保存通信を遮断します。

Playwrightは専用ポート18080(API)・15174(Web)を使用し、各シナリオで作成した庭だけを削除します。開発用DBへは接続しません。実行記録、APIで取得したJSON、再読み込み後のスクリーンショットは`artifacts/e2e/`に置きます。HTMLレポート、trace、失敗時スクリーンショットは`artifacts/playwright-report/`と`artifacts/playwright-results/`です。

## APIと責務

主要な保存形式、エンドポイント、revision競合、座標規則、ローカル所有者境界は[`docs/architecture.md`](docs/architecture.md)に記録しています。フロントのGardenDocumentはZustand内で編集し、TanStack Queryの取得結果を同じ可変オブジェクトとして共有しません。Spring DTOとJPA Entityを分離しています。

主要コードの担当は次のとおりです。

- `frontend/src/domain/`: 配置・変形ルールと上限値
- `frontend/src/stores/editorStore.ts`: GardenDocumentとエディタ状態
- `frontend/src/api/`: `/api`契約とHTTPエラー変換
- `frontend/src/pages/`、`components/`: 庭一覧・エディタUI
- `frontend/src/three/`: GLB、地面、カメラ、R3F操作
- `backend/src/main/java/jp/greenly/api/api/`: DTO、Controller、エラー応答
- `backend/src/main/java/jp/greenly/api/domain/`: サーバー検証と制限値
- `backend/src/main/java/jp/greenly/api/service/`: 所有者範囲、revision、トランザクション
- `backend/src/main/java/jp/greenly/api/persistence/`: JPA EntityとRepository
- `backend/src/main/resources/db/migration/`: Flyway schemaと初期カタログ
- `e2e/greenly.spec.ts`: 実ユーザー操作とAPI/DB連携のChromiumシナリオ

## 利用境界と制限

dev/e2e用デモ所有者はサーバーが固定し、HTTP bodyからownerIdを受け取りません。Spring Bootは127.0.0.1へbindします。一般ユーザー向け認証・認可はありません。このためLANや公開サーバーへbindして運用してはいけません。公開運用にはログイン、認可、所有者分離の実装が必要です。

配置上限は200個、庭各辺は1〜50mです。AI、写真測量、成長予測、BOM/価格、衝突物理、不整形地形、Undo/Redo、多人数編集、スマートフォン専用UIは未実装です。モデル読み込みはGLBファイルが存在することを前提とし、失敗時は対象表示を維持しながら再試行・削除できます。
