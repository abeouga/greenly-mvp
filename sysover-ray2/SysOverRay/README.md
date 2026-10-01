# Greenly 起動オーバーレイ

Windows 10/11 x64デスクトップからGreenlyのAPIとWeb画面を起動、停止、再起動する小型オーバーレイです。元の `sysover-ray` とは別のコピーとして配置します。

## 起動

初回はリポジトリ直下の `setup.bat` を実行してください。以後はデスクトップに作成された `Greenly SysOverRay` ショートカット、または `sysover-ray2\start.bat` を実行します。PowerShellからは `sysover-ray2\start.ps1` を使います。

## 操作

- **起動**: Greenlyの `start.ps1 -NoBrowser` を起動し、Greenly APIのアセット応答とWebページを確認します。既存APIが有効なら再利用します。
- **停止**: 設定されたGreenlyフォルダーの起動プロセスとWeb/APIを停止します。`start.bat`による起動分や、オーバーレイを開き直す前から稼働していた分も対象です。同じフォルダーの複数セッションも停止します。
- **再起動**: 設定されたGreenlyフォルダーのWeb/APIを停止し、再度起動します。停止中からも起動できます。
- **ブラウザを開く**: 現在検出したGreenly WebのURLを開きます。
- **×**: オーバーレイを隠します。通知領域のアイコンから再表示またはアプリ終了ができます。アプリ終了はGreenlyを停止しません。

## パスとポート

`app\overlay-settings.json` の `GreenlyRoot` は、実行ファイルの場所を基準に解決する相対パスです。初期値 `..\\..` は、リポジトリ内の `sysover-ray2\app` からGreenlyのルートを指します。現在の作業ディレクトリには依存しません。リポジトリ内のフォルダー構成を保ってクローンすれば、設定の変更は不要です。

Greenly本体はWebで5173〜5175、APIで8080、18081、18082の空きポートを順に選びます。選択されたポートはオーバーレイに表示されます。Web候補がすべて使用中の場合など、起動スクリプト自体が起動できないときはエラーを表示し、詳細を `%LOCALAPPDATA%\GreenlyOverlay\overlay.log` に記録します。設定範囲内のポートを一括終了する機能はありません。

## 開発

必要環境は .NET 10 SDK とWindows Desktop targeting packです。

```powershell
dotnet build .\SysOverRay.csproj -c Release
dotnet publish .\SysOverRay.csproj -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -o ..\app
```

配布先に `app\overlay-settings.json` を含めてください。`SysOverRayを起動.lnk` は `app\SysOverRay.exe` を起動し、作業フォルダーも `app` に設定します。

## 安全境界

本アプリはローカル開発用です。認証は追加しません。Greenly側の開発用デモ利用者と127.0.0.1限定の設定を維持してください。公開ネットワークへ露出する用途には使えません。
