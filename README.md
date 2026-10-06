# Greenly 手動3D庭エディタ MVP

Greenlyは、PCブラウザーで庭を手動設計するローカル開発用MVPです。名前だけで庭を作成し、編集画面で形・寸法を設定して4種類の開発用GLBを配置します。FastAPI経由でMySQLへ保存して復元します。AI提案、認証、資材計算、写実的なモデルは含みません。

庭写真を読み込み、任意形状の地面輪郭（3〜64点）を直接描けます。頂点数による自動終了はなく、始点1をクリックして閉じた時に領域を確定します。写真＋設計モードでは固定したThree.jsカメラで木などのGLBを写真に重ねて表示し、写真・3D庭のどちらからも配置できます。3D庭モードでは写真を外して庭を自由に回転できます。

## 必要な環境

- Windows 10/11 x64。Windows以外からは`start.bat`とWPFオーバーレイを利用できません。
- Node.js 22.12以降、Python 3.12、uv（`setup.bat`が不足分をユーザー領域へ用意します。Java/Mavenは不要）
- MySQL Server 8.0/8.4（未導入の場合は`setup.bat`がGreenly専用MySQLを用意します）
- Chromium（E2Eを実行するとき）
- 初回セットアップ時のインターネット接続とディスク空き容量。既存MySQLを使う場合はその管理者認証情報

JavaScript依存バージョンは`package-lock.json`で固定しています。R3F 9はReact 19と組み合わせ、Drei 10はFiber 9をpeer dependencyとして指定しています。詳細は[React Three Fiberの導入資料](https://r3f.docs.pmnd.rs/getting-started/installation)と`docs/architecture.md`を参照してください。

## Windowsでの初回設定

Windows 10/11 x64で、リポジトリのルートにある`setup.bat`を実行します。PowerShellからは`./setup.ps1`を実行できます。Node.js、uv、Python 3.12、ロック済み依存関係、GLB、MySQL、SysOverRay用.NET 10 Desktop Runtimeをまとめて準備します。未導入のツールはユーザー領域へ取得し、MySQL配布物は固定SHA-256とOracle署名を確認します。MySQLのVisual C++ランタイムが未導入の場合だけ、Windowsの管理者確認が表示されることがあります。

セットアップ後、`start.bat`またはPowerShellの`./start.ps1`で起動します。起動時も環境を再確認し、ロックファイルが変わった場合だけ依存関係を復元します。`start.bat -NoBrowser`、`start.ps1 -NoBrowser`も使えます。

既存のMySQLが`127.0.0.1:3306`で応答する場合は、そのサーバーを利用します。初回に「MySQL管理者名」でEnterを押すとrootが選択されます。続けて、その管理者のパスワードを非表示入力します。管理者パスワードは保存しません。GreenlyのDB・専用ユーザー・権限・テーブルを自動準備し、専用ユーザーの自動生成パスワードを`.env`と`.env.e2e`へ保存します。通常はSQLの手動実行や設定ファイルの手動編集は不要です。

MySQLが未稼働で接続先も未指定の場合は、Greenly専用MySQLをユーザー領域へ用意します。管理者名・パスワードの入力は不要です。既存MySQLから独立した保存先と空きポートを使い、既存サービスを変更しません。専用MySQLを明示的に選ぶ場合は次を実行します。既存の明示接続設定を別DBへ自動変更する処理はありません。

```powershell
.\setup.bat -DatabaseMode managed
```

再実行では接続設定と既存データを再利用します。認証・権限・スキーマの確認に失敗した場合は「完了」と表示せず、原因を表示します。別PCへはソースと同梱アセットを渡し、`.env`・`.env.e2e`・`node_modules`・`backend/.venv`・MySQLデータはコピーしないでください。詳細は[`docs/windows-setup.md`](docs/windows-setup.md)を参照してください。

## 起動

リポジトリ直下の`start.bat`をダブルクリックすると、必要な依存関係を確認・準備してからAPIとWebを同じコンソールに出力して起動します。プロジェクトのフォルダーを移動しても、バッチ自身の場所からPowerShellスクリプトや依存ファイルを解決します。起動後はその画面を閉じず、停止時にCtrl+Cを押してください。`Terminate batch job (Y/N)?`が表示されたら`N`を押すと、起動スクリプトの停止処理が完了します。その後、キー入力でコンソールを閉じます。

`setup.bat`で準備した接続情報を使うため、通常の起動時はパスワード入力不要です。プロセス環境変数が設定済みの場合は`.env`より優先します。rootのパスワードを専用ユーザー用として入力する必要はありません。

```powershell
.\setup.bat
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

E2Eはsetupが作成した`.env.e2e`を使用します。API起動時のe2e profileだけが読み込み、WebへDB資格情報を渡しません。専用MySQLを選んだPCでは、再起動後もAPI起動時に同じMySQLの保存先から復帰します。

## 操作

1. 庭名だけを入力して作成します。土台は10m × 8mで開始します。写真の多角形は輪郭の辺をクリックして、現在の長さを確認します。実測値は「写真のカメラを設定」で基準長方形の幅・奥行きに入力して計算・適用します。校正寸法を変えても写真上の輪郭の位置は保たれます。写真のない矩形の土台は3D画面上部の「土台設定」から変更できます。編集後は上部の「保存」で確定します。
2. 画面下の素材カタログで種類を選び、地面をクリックします。同じ素材を続けて配置でき、Escで配置モードを終了します。1目盛りは1mです。
3. 配置済み一覧またはモデルをクリックして選択します。移動ツールではモデル本体をドラッグできます。回転ツールでは対象の周囲に出る円形ハンドルをドラッグします。ハンドルはホバー時に色が変わり、操作中にEscを押すと開始前の角度へ戻ります。拡縮は選択枠のギズモか右の入力欄を使います。
4. 回転入力は度、保存値はラジアンです。倍率は縦横比を維持し、0.25〜3.0に制限します。オブジェクトのY座標とX/Z回転は固定です。
5. 上部の「保存」で庭全体を送信します。移動操作ごとには送信しません。失敗時は編集状態を保持し、表示された再試行操作を使います。
6. カメラは左ドラッグで回転、右ドラッグでパン、ホイールでズームできます。「上から見る」は再現可能な視点、「初期視点」は斜め上の視点へ戻します。
7. 削除キーまたは右側の「削除」で選択オブジェクトを削除します。入力欄・ダイアログでのキー操作は背面の配置物へ伝えません。未保存で一覧へ戻る場合は、編集を続けるか破棄するかを画面内で確認します。ブラウザー自体を閉じる場合はブラウザーの確認になります。
8. 下部カタログの「しまう／開く」と、上部の「配置・編集」は独立して開閉できます。辺の長さは写真上の辺をクリックして確認し、土台設定・写真カメラ設定は専用ダイアログで編集します。ダイアログはEscで閉じ、呼び出した操作へフォーカスを戻します。詳しい画面構成は[ワークスペースUI](docs/workspace-ui.md)を参照してください。

### 写真と多角形地面

1. 名前だけで庭を作成し、「写真＋設計」でJPEG/PNGを読み込みます。クリックまたはドラッグ＆ドロップで選択できます。写真は5MB以下、各辺6000px以下、総画素数2500万以下です。
2. 写真読み込み直後から庭の輪郭を描きます。最初のクリックが頂点1です。仮線がマウスに追従し、次のクリックが頂点2、以後3、4、5…になります。4点目でも同じ描画操作を継続し、点はリセットされません。
3. 輪郭を一周する順に3〜64点クリックし、番号1の始点へ戻ってクリックすると、最後の頂点から始点へ辺をつないで領域を確定します。四角形は「1→2→3→4→1」、五角形は「1→2→3→4→5→1」です。3点以上では始点に閉じる目印が表示されます。交差、面積不足、重複や近すぎる頂点は確定できません。
   - 「最後の点を戻す」で描画途中の点を取り消せます。「輪郭の描画を取消」は描画前の輪郭へ戻します。描画途中は保存・3D切替・配置ができません。
   - 確定すると頂点番号は消えます。描き直す場合は「庭の領域を書き直す」を押します。確定前の線は編集中の状態だけに保持され、取消時は元の輪郭へ戻ります。確定後の番号のない橙色の点はドラッグで調整できます。
4. カタログのアセットを選んで輪郭内をクリックすると、写真上にも木などの3Dモデルを配置できます。3D庭で置いた木も同じ位置に写真へ表示されます。木をクリックして選択し、右側のプロパティで位置・回転・倍率を調整できます。写真画面のカメラは固定され、ドラッグによる視点回転はありません。地面・グリッド・配置の表示は個別に切り替えられます。
5. 「3D庭」に切り替えると写真は消え、同じ多角形地面と配置物を回転・パン・ズームできます。「写真＋設計」へ戻しても写真上の指定位置は維持されます。上部の「保存」で写真・輪郭・内部の変換基準・配置物をMySQLに保存します。

「写真のカメラを設定」では、水平な地面の基準長方形を手前左→手前右→奥右→奥左の順に指定し、その実測幅・奥行きを入力して撮影カメラを計算します。計算結果を確認して適用すると、同じ透視カメラで木の高さ・奥行きとクリック位置を扱います。基準長方形は庭の多角形とは別の情報です。辺の計測表示は読み取り専用で、長さの確認によって頂点は動きません。校正後の表示はカメラから算出した実寸、未設定時は土台に基づく概算です。カメラ設定は[写真カメラ校正](docs/photo-camera-calibration.md)、辺の計測は[多角形の辺計測](docs/polygon-edge-editing.md)を参照してください。写真内の既存物による遮蔽、広角歪みの補正、傾斜地、写真だけからの自動測量はありません。

座標は庭の中心をX=0,Z=0、地面をY=0とします。Xは幅、Zは奥行きです。庭内制限はオブジェクトの配置基準点に適用します。オブジェクト同士の重なりとモデル端部の庭外へのはみ出しは許可します。

## アセット

`npm run assets:generate`は基本形状だけを使った実GLBファイルを`frontend/public/models/`へ作ります。生成元と寸法は[`docs/assets.md`](docs/assets.md)に記録しています。ファイルは開発用で、写実的な植物モデルではありません。

新しいアセットを追加するときは、生成スクリプトに安定ID・GLB部品・接地原点を追加し、`0002`の後続Alembic migrationで新しいIDのseedを追加します。既存IDの基準寸法や意味は黙って変更しないでください。カタログのAPI応答とGLB実寸法を一致させてください。

## チェックとE2E

```powershell
# JS/Python lint、Python compile
npm run precheck

# E2Eの型チェック
npx tsc --noEmit -p e2e/tsconfig.json

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
- `frontend/src/stores/editorStore.js`: GardenDocumentとエディタ状態
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
