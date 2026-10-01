# Greenly 手動3D庭エディタ MVP

Greenlyは、PCブラウザーで庭を手動設計するローカル開発用MVPです。庭の名前・寸法を登録し、4種類の開発用GLBを配置・編集し、FastAPI経由でMySQLへ保存して復元します。AI提案、認証、資材計算、写実的なモデルは含みません。

庭写真を読み込み、投影基準の四隅と任意形状の地面輪郭（3〜64点）を指定できます。写真＋設計モードでは写真上に地面・1mグリッド・配置マーカーを固定投影し、3D庭モードでは写真を外して庭を自由に回転できます。

## 必要な環境

- Windows 10/11 x64。Windows以外からは`start.bat`とWPFオーバーレイを利用できません。
- Node.js 22.12以降、Python 3.12、uv（`setup.bat`が不足分をユーザー領域へ用意します。Java/Mavenは不要）
- MySQL Server 8.0。開発用とE2E専用の2データベースを作成できるローカルアカウント
- Chromium（E2Eを実行するとき）
- MySQLのmysqldumpコマンド（既存DBの初回引き継ぎ・スキーマ更新時にバックアップを作成するため）

JavaScript依存バージョンは`package-lock.json`で固定しています。R3F 9はReact 19と組み合わせ、Drei 10はFiber 9をpeer dependencyとして指定しています。詳細は[React Three Fiberの導入資料](https://r3f.docs.pmnd.rs/getting-started/installation)と`docs/architecture.md`を参照してください。

## Windowsでの初回設定

Windows 10/11 x64で、リポジトリのルートにある`setup.bat`を実行します。PowerShellからは`./setup.ps1`を実行できます。Node.js 22.12以降が見つからない場合は公式LTS配布物をSHA-256照合後に`%LOCALAPPDATA%\Greenly\tools`へ展開します。uvも同じユーザー領域に導入し、Python 3.12はuvの管理領域に取得します。`package-lock.json`と`backend\uv.lock`に基づく依存関係、GLBアセット、SysOverRay用.NET 10 Desktop Runtimeを準備し、デスクトップにSysOverRayのショートカットを作成します。管理者権限のあるシステム全体インストールは行いません。

セットアップ後、`start.bat`またはPowerShellの`./start.ps1`で起動します。起動時も環境を再確認し、ロックファイルが変わった場合だけ依存関係を復元します。`start.bat -NoBrowser`、`start.ps1 -NoBrowser`も使えます。

この処理はMySQL Serverをインストールせず、DBや利用者も作成しません。既存データを持つMySQL環境を誤って変更しないためです。MySQL Server 8.0以降を別途起動し、下記の開発用DBとアカウントを作成してください。接続先は`127.0.0.1:3306`が初期値です。

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

リポジトリ直下の`start.bat`をダブルクリックすると、必要な依存関係を確認・準備してからAPIとWebを同じコンソールに出力して起動します。プロジェクトのフォルダーを移動しても、バッチ自身の場所からPowerShellスクリプトや依存ファイルを解決します。起動後はその画面を閉じず、停止時にCtrl+Cを押してください。`Terminate batch job (Y/N)?`が表示されたら`N`を押すと、起動スクリプトの停止処理が完了します。その後、キー入力でコンソールを閉じます。

初回は`.env.example`を`.env`へコピーし、MySQLユーザーとパスワードを設定します。`.env`がない場合、ユーザー名は`greenly_dev`、パスワードは起動時に非表示で入力できます。プロセス環境変数が設定済みの場合は`.env`より優先します。

```powershell
Copy-Item .env.example .env
# .envを編集してGREENLY_DB_PASSWORDを設定
.\start.bat
```

PowerShellから直接起動する場合は、次のコマンドを使えます。カレントディレクトリがリポジトリ外でも動作し、パスに空白が含まれていても引用符で指定できます。

```powershell
$repo = 'C:\path\to\gleenly-mvp' # クローン先に置き換え
& (Join-Path $repo 'start.ps1')
```

スクリプトは`127.0.0.1`だけにbindし、APIは`8080`、Webは`5173`を優先します。使用中のポートは、APIが`18081`・`18082`、Webが`5174`・`5175`へ順に切り替わります。APIが既に応答中なら、同梱アセットIDと`X-Greenly-Backend: fastapi`を確認したうえで既存のFastAPIを再利用します。旧Java APIは再利用しません。起動完了後にブラウザーを開きます。`start.bat -NoBrowser`または`start.ps1 -NoBrowser`は自動起動を抑える検証用オプションです。APIとWebのログは一つのコンソールに表示されます。

API起動前にAlembic移行を実行します。新規DBは0001/0002でテーブルと4つのアセットを作成します。旧Flyway V1/V2の既存DBは構造と履歴を照合し、mysqldumpバックアップ後に対応するAlembic版として記録します。バックアップはGit外の`%LOCALAPPDATA%\Greenly\backups`へ保存し、構造不一致・履歴不明・バックアップ失敗ではDBを変更せず停止します。既存庭を消す設定はありません。移行だけを行うには`npm run migrate:api`を使います。詳細は[`docs/fastapi-migration.md`](docs/fastapi-migration.md)に記録しています。

停止時にCtrl+Cを押すと、この起動スクリプトが起動したAPI・Webプロセスを停止します。既に起動していたAPIは停止しません。APIが起動に失敗した場合は、子プロセス終了を検出して長時間待たずにエラーを表示します。Viteは`/api`を選択されたAPIポートへproxyします。CORSの全許可設定は追加していません。

E2Eでは引き続き専用の`GREENLY_E2E_DB_USER`と`GREENLY_E2E_DB_PASSWORD`を、実行するPowerShellの環境変数として設定します。起動スクリプトはE2E用DB資格情報を読み込みません。

## 操作

1. 庭名、幅、奥行きを入力して作成します。初期寸法は10m × 8mです。各辺は1〜50mで、作成後の寸法変更はできません。
2. 左のカタログで種類を選び、3D地面をクリックします。1目盛りは1mです。
3. 配置済み一覧またはモデルをクリックして選択します。移動ツールではモデル本体をドラッグできます。回転ツールでは対象の周囲に出る円形ハンドルをドラッグします。ハンドルはホバー時に色が変わり、操作中にEscを押すと開始前の角度へ戻ります。拡縮は選択枠のギズモか右の入力欄を使います。
4. 回転入力は度、保存値はラジアンです。倍率は縦横比を維持し、0.25〜3.0に制限します。オブジェクトのY座標とX/Z回転は固定です。
5. 上部の「保存」で庭全体を送信します。移動操作ごとには送信しません。失敗時は編集状態を保持し、表示された再試行操作を使います。
6. カメラは左ドラッグで回転、右ドラッグでパン、ホイールでズームできます。「上から見る」は再現可能な視点、「初期視点」は斜め上の視点へ戻します。
7. 削除キーまたは右側の「削除」で選択オブジェクトを削除します。入力欄にフォーカス中は削除キーを横取りしません。未保存で一覧へ戻る場合は確認します。

### 写真と多角形地面

1. 庭作成時に幅・奥行きの実寸を入力します。「写真＋設計」を選び、「写真を選択」でJPEG/PNGを読み込みます。写真は5MB以下、各辺6000px以下、総画素数2500万以下です。
2. 写真を「手前左→手前右→奥右→奥左」の順で4回クリックし、実寸と写真を対応させる投影基準を指定します。白い番号付き点と白い破線が投影基準です。4点目の指定後、庭の輪郭描画が始まります。この時点では地面領域は確定しません。白い点のドラッグによる修正は輪郭描画の確定または取消後に行います。
3. 実際の庭の輪郭を一周する順に3〜64点クリックします。最初の点を置くと仮線がマウスに追従し、次のクリックで辺と頂点が決まります。4点で自動終了せず、橙色の始点へ戻ってクリックした時に多角形を確定します。始点には3点以上で閉じる目印が表示されます。「輪郭を確定」ボタンでも閉じられます。交差、面積不足、投影基準の四隅からのはみ出しがあると確定できません。
   - 「最後の点を戻す」で描画途中の点を取り消せます。「輪郭の描画を取消」は描画前の輪郭へ戻します。描画途中は保存・3D切替・配置ができません。
   - 描き直す場合は「多角形を描く」を押します。確定前の線は編集中の状態だけに保持され、確定した輪郭が庭データへ反映されます。確定後の橙色の点はドラッグで調整できます。
4. カタログのアセットを選んで輪郭内をクリックすると配置できます。写真モードでは配置物は地面上のマーカーで示されます。地面・グリッド・配置の表示は個別に切り替えられます。
5. 「3D庭」に切り替えると写真は消え、同じ多角形地面と配置物を回転・パン・ズームできます。「写真＋設計」へ戻しても写真上の指定位置は維持されます。上部の「保存」で写真・四隅・輪郭・配置物をMySQLに保存します。

写真モードの投影は地面平面に限ります。高さのあるGLBを写真へ正確に合成する機能、写真だけからの実寸推定はありません。輪郭変更で配置物が地面外に出た場合は赤いマーカーで示し、自動移動・削除はしません。保存方式と制約は[`docs/geometry-photo.md`](docs/geometry-photo.md)を参照してください。

座標は庭の中心をX=0,Z=0、地面をY=0とします。Xは幅、Zは奥行きです。庭内制限はオブジェクトの配置基準点に適用します。オブジェクト同士の重なりとモデル端部の庭外へのはみ出しは許可します。

## アセット

`npm run assets:generate`は基本形状だけを使った実GLBファイルを`frontend/public/models/`へ作ります。生成元と寸法は[`docs/assets.md`](docs/assets.md)に記録しています。ファイルは開発用で、写実的な植物モデルではありません。

新しいアセットを追加するときは、生成スクリプトに安定ID・GLB部品・接地原点を追加し、`0002`の後続Alembic migrationで新しいIDのseedを追加します。既存IDの基準寸法や意味は黙って変更しないでください。カタログのAPI応答とGLB実寸法を一致させてください。

## チェックとE2E

```powershell
# TypeScript型チェック、E2E型チェック、JS/Python lint、Python compile
npm run precheck

# フロントエンド本番ビルド
npm run build:web

# Chromiumを用意（初回のみ）
npx playwright install chromium

# 実MySQLの独立検証（専用E2E資格情報と一時テストDBの作成権限が必要）
npm run verify:api

# 全E2E。専用ポート18080/15174でAPI(e2e profile)とViteを起動し、greenly_e2e DBを使用
npm run test:e2e

# 対象シナリオだけ実行
npm run test:e2e -- --grep 'A\. 庭作成'
npm run test:e2e -- --grep 'D\. 保存失敗'
npm run test:e2e -- --grep 'H\. 回転リング'
```

E2Eの前に同じPowerShellで`GREENLY_E2E_DB_USER`と`GREENLY_E2E_DB_PASSWORD`を設定してください。Git無視対象の`.env.e2e`にこれらのキーを設定することもできます。`GREENLY_E2E_DB_URL`で接続先を変更できますが、DB名は`greenly_e2e`から始まる専用DBに限定します。dev用`.env`からE2E資格情報を流用しません。E2E成功系は実フロント、実FastAPI、専用MySQL DBを使います。正常系APIはモックしていません。障害系だけ、Playwright routeで保存通信を遮断します。

`verify:api`はブラウザーE2Eで再現しにくい同時PUT、途中の整合性違反によるrollback、owner分離、旧DB引き継ぎを検証します。移行検証では固有名の`greenly_e2e_migration_*` DBを作成し、自身が作成したDBだけを削除します。テスト用接続ユーザーにそのDBの作成・操作・削除権限を設定してください。実行記録は`artifacts/fastapi/backend-verification.json`へ保存します。

既存MySQLに一時DB作成権限を与えず検証する場合は、`backend`で`uv run --locked python -m verification.run_isolated_mysql`を実行できます。インストール済みの実MySQL Serverを固有のデータディレクトリと空きポートで起動し、API独立検証と全E2Eを実行後、そのMySQLだけを停止します。既存MySQLサービスは変更しません。データ・ログ・バックアップはGit外に残し、結果を`artifacts/fastapi/isolated-mysql-verification.json`へ保存します。

Playwrightは専用ポート18080(API)・15174(Web)を使用し、各シナリオで作成した庭だけを削除します。開発用DBへは接続しません。実行記録、APIで取得したJSON、再読み込み後のスクリーンショットは`artifacts/e2e/`に置きます。HTMLレポート、trace、失敗時スクリーンショットは`artifacts/playwright-report/`と`artifacts/playwright-results/`です。

## APIと責務

主要な保存形式、エンドポイント、revision競合、座標規則、ローカル所有者境界は[`docs/architecture.md`](docs/architecture.md)に記録しています。フロントのGardenDocumentはZustand内で編集し、TanStack Queryの取得結果を同じ可変オブジェクトとして共有しません。Pydantic DTOとSQLAlchemy Entityを分離しています。Python依存は`backend/uv.lock`で固定しています。

主要コードの担当は次のとおりです。

- `frontend/src/domain/`: 配置・変形ルールと上限値
- `frontend/src/stores/editorStore.ts`: GardenDocumentとエディタ状態
- `frontend/src/api/`: `/api`契約とHTTPエラー変換
- `frontend/src/pages/`、`components/`: 庭一覧・エディタUI
- `frontend/src/three/`: GLB、地面、カメラ、R3F操作
- `backend/greenly_api/main.py`、`schemas.py`、`errors.py`: API、DTO、エラー応答
- `backend/greenly_api/validation.py`: サーバー検証と写真・輪郭制約
- `backend/greenly_api/service.py`、`models.py`、`database.py`: owner、revision、トランザクション、ORM
- `backend/greenly_api/migrations.py`、`backend/alembic/`: 旧DB照合、バックアップ、Alembic履歴と初期カタログ
- `e2e/greenly.spec.ts`: 実ユーザー操作とAPI/DB連携のChromiumシナリオ

## 利用境界と制限

dev/e2e用デモ所有者はサーバーが固定し、HTTP bodyからownerIdを受け取りません。FastAPIは127.0.0.1へbindします。一般ユーザー向け認証・認可はありません。このためLANや公開サーバーへbindして運用してはいけません。公開運用にはログイン、認可、所有者分離の実装が必要です。

配置上限は200個、庭各辺は1〜50mです。AI、写真からの自動測量、高低差のある地形、成長予測、BOM/価格、衝突物理、Undo/Redo、多人数編集、スマートフォン専用UIは未実装です。モデル読み込みはGLBファイルが存在することを前提とし、失敗時は対象表示を維持しながら再試行・削除できます。
