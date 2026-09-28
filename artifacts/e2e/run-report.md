# E2E実行記録

## 最終実行

- 実行日時: 2026-09-26 21:54 JST
- コマンド: `npm run test:e2e`
- 結果: 8件成功、0件失敗（45.4秒）
- ブラウザー: Playwright 1.63.0 / Chromium
- 画面: 1440 × 960、Windows PowerShell
- 実行環境: Node.js 24.14.1、Java 25.0.1（Java 21 bytecode）、Maven Wrapper 3.9.12、ローカルMySQL
- 接続先: Spring Boot `e2e` profile（127.0.0.1:18080）、Vite（127.0.0.1:15174）、専用MySQL schema `greenly_e2e`
- 認証情報: PowerShellプロセス環境変数でのみ設定。成果物・ソース・ログへ保存していません。
- 実行時の注意: R3F/Three.js由来の`THREE.Clock` deprecation console warningがあります。Gの失敗注入中はGLTFLoaderのロードエラーがconsoleに出ますが、再試行後に復旧することを確認しています。`npm run precheck`と`npm run build:web`は成功し、minify後のJSサイズが約1.31MBというVite警告が残ります。対象E2Eの初回起動は開発用DB利用者にテストDB権限がなく停止しました。今回はローカル管理者資格情報をプロセス環境変数へ設定し、専用`greenly_e2e` schemaで対象E2Eと全E2Eを実行しました。

## シナリオ

| シナリオ | 実操作と確認結果 |
| --- | --- |
| A | 庭をUIから作成し、キャンバスをクリックして木を配置。実ポインター操作で移動し、角度と倍率を入力して保存。再読み込み後のGLB・選択・入力値を確認し、庭一覧から再開。削除確認をキャンセルしたときはAPIデータが残り、確定後は404になることを確認。GET APIのrevision 1と保存値も照合。 |
| B | 同じGLBを2個配置し、一方を移動。複製後に複製だけを動かし、削除。保存APIの結果で元の2個のIDと位置が独立していることを確認。 |
| C | 寸法51mの作成と庭外座標のPUTが400になること、および拒否後も既存の保存JSONが変わらないことを確認。 |
| D | PUTをPlaywright routeで遮断。画面に日本語の通信エラーと再試行が表示され、変更が未保存のまま保持されることを確認。遮断解除後の再試行を実API・DBで確認。 |
| E | 庭を保存後、別のAPI PUTでrevisionを進める。古いrevisionの保存は409となり、画面のローカル編集を保持することを確認。 |
| F | 木・低木・レンガ・ベンチの4 GLBをキャンバスへ置き、それぞれ読み込み完了を確認。保存後の再読み込みでも4/4を確認。 |
| G | GLB取得を失敗させ、読み込みエラーと再試行を表示。通信回復後の再試行でモデルを表示し、庭を保存できることを確認。 |
| H | ベンチを配置し、回転リングの通常表示とホバー時の色の変化を撮影。リングの単独クリックで編集がロックされないこと、ドラッグ中の操作抑止、Escでの角度復元、実ポインタードラッグによる角度変更を確認。明示的な保存前にはAPI上の配置数が0であること、保存後のラジアン値、再読み込み後の表示角度とモデルの向きを照合。 |

## 成果物

- `garden-roundtrip.png`: 保存後の再読み込みで、木モデル・1mグリッド・選択状態・X/Z/回転/倍率を目視確認済み。
- `garden-roundtrip.json`: シナリオAで実GET APIから取得した確定JSON。revision 1、木1個、回転30度相当、倍率1.25。
- `garden-independent.json`: シナリオBで保存後に実GET APIから取得した2個の木。
- `garden-conflict.json`: シナリオE後の実GET API結果。
- `garden-catalog.png` / `garden-catalog.json`: シナリオFの全モデル読込後、再読み込みを行った画面と実GET API結果。
- `garden-model-retry.json`: シナリオGの再試行成功後に実GET APIから取得した庭。
- `garden-rotation-idle.png` / `garden-rotation-hover.png`: シナリオHの回転リング通常時とホバー時。ホバーで緑色の表示が明るい色へ変化することを目視確認済み。
- `garden-rotation-cancel.png`: シナリオHでEscにより角度が0度へ戻り、操作欄が再び使える状態になった画面。
- `garden-rotation-handle.png` / `garden-rotation-handle.json`: シナリオHでリングをドラッグして保存したベンチの再読み込み後の画面と実GET API結果。
- `failure-B-*`: 初回シナリオBの失敗記録。クリック位置が選択ギズモに重なったため、E2Eを空地クリックへ直し再実行で成功。
- `failure-B-ordering-*`: 最終スイート途中のシナリオB失敗記録。APIのID順とUIの配置順を混同していたテストをIDで照合するよう直し、再実行で成功。
- `failure-A-*`: 一覧から庭を再開した後に削除確認するテスト手順が一覧へ戻っていなかった初回記録。再遷移を加えて成功。
- `failure-D-*`: 初回シナリオDの失敗記録。通信例外の英語表示を日本語の案内へ修正し、再実行で成功。
- `../playwright-report/index.html`: 最終全E2EのHTMLレポート。
- `../playwright-results/`: Playwrightの最終実行出力。全件成功のため失敗traceはありません。初回失敗traceは上記`failure-*-trace.zip`に保存しています。

## 再実行

MySQL 8.0のローカルインスタンスで`greenly_e2e` schemaとテスト用DBユーザーを用意し、ルートから次を実行します。値は各自のローカル設定を使い、リポジトリへ保存しないでください。

```powershell
$env:GREENLY_E2E_DB_USER = '<greenly_e2e DB user>'
$env:GREENLY_E2E_DB_PASSWORD = '<local DB password>'
npm run test:e2e -- --grep 'H\. 回転リング'
npm run test:e2e
Remove-Item Env:GREENLY_E2E_DB_USER
Remove-Item Env:GREENLY_E2E_DB_PASSWORD
```

ブラウザーが未導入の場合は事前に`npx playwright install chromium`を実行します。シナリオを絞る場合は`npm run test:e2e -- --grep 'D\. 保存失敗'`のように指定します。

## DB状態

E2Eは開発DBへ接続せず、専用schema内の作成したテスト庭だけを各シナリオ後に削除します。削除APIの応答は各テストで確認しています。今回、DB全体の行数は別途確認していません。
