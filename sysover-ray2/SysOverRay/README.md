# Kusakari Canvas 起動オーバーレイ

Windows 10/11 x64から、Kusakari内の3D庭づくりMVPのWebとAPIを起動・停止・再起動するローカル開発ツールです。

## 起動

初回はリポジトリ直下の `setup.bat` または `sysover-ray2\setup.bat` を実行します。以後は `Kusakari Canvas SysOverRay` ショートカット、または `sysover-ray2\start.bat` を使います。

## 操作

- **起動**: `start.ps1 -NoBrowser` を起動し、現在のAPIアセット応答とWebページを確認します。
- **停止**: 設定したKusakari Canvasの起動スクリプト、Vite、uvに該当するプロセスを照合して終了します。ポート番号だけで別プロジェクトのプロセスを終了しません。
- **再起動**: 対象プロセスを停止して再起動します。停止中からも起動できます。
- **ブラウザを開く**: 現在検出したWebのURLを開きます。
- **×**: オーバーレイを隠します。通知領域から再表示またはオーバーレイ終了ができます。オーバーレイ終了ではKusakari Canvasを停止しません。

## パスとポート

`app\overlay-settings.json` の `ProjectRoot` は実行ファイル位置を基準とする相対パスです。既定値 `..\..` は `sysover-ray2\app` からリポジトリルートを指します。リポジトリを移動する場合は内部のフォルダー構成を保ってください。カレントディレクトリには依存しません。

Webは5173〜5199、APIは8080・18081〜18100から空きポートを選びます。ポート競合時に範囲内のプロセスを一括終了しません。操作ログとウィンドウ位置はWindowsのLocalAppData配下に保存します。

## 開発

必要環境は.NET 10 SDKとWindows Desktop targeting packです。

```powershell
dotnet build .\SysOverRay.csproj -c Release
dotnet publish .\SysOverRay.csproj -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -o ..\app
```

配布先の `app\overlay-settings.json` も更新してください。セットアップは現在のリポジトリを指すショートカットを作成し、旧ショートカットは同じ起動スクリプトを指す場合だけ削除します。

## 安全境界

本ツールはローカル開発用です。Kusakari Canvas APIは127.0.0.1に限定し、固定デモ利用者を使います。公開ネットワークへ露出する用途には使えません。画面タイトルと`X-Kusakari-Canvas-Backend`応答ヘッダーをヘルスチェックで確認します。
