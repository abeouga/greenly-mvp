# Greenly 起動オーバーレイ

WindowsデスクトップからGreenlyのAPIとWeb画面を起動、停止、再起動する小型オーバーレイです。元の `sysover-ray` とは別のコピーとして配置します。

## 起動

デスクトップの `シスオーバーレイ2` フォルダーにある `Greenlyを起動.lnk` をダブルクリックします。初回はWindowsが.NET Desktop Runtimeを要求する場合があります。その場合は .NET 10 Desktop Runtimeを導入してください。

## 操作

- **起動**: Greenlyの `start.ps1 -NoBrowser` を起動し、Greenly APIのアセット応答とWebページを確認します。既存APIが有効なら再利用します。
- **停止**: このオーバーレイが起動したPowerShellプロセスツリーだけを停止します。起動時に再利用した外部APIや、別セッションのGreenlyは停止しません。
- **再起動**: このオーバーレイが管理するセッションを停止し、再度起動します。管理中セッションがなければ、他のGreenlyプロセスを停止せずに起動します。
- **ブラウザを開く**: 現在検出したGreenly WebのURLを開きます。
- **×**: オーバーレイを隠します。通知領域のアイコンから再表示またはアプリ終了ができます。アプリ終了はGreenlyを停止しません。

## パスとポート

`app\overlay-settings.json` の `GreenlyRoot` は、実行ファイルの場所を基準に解決する相対パスです。初期値 `..\\..\\gleenly-mvp` は、Greenlyとオーバーレイのフォルダーがどちらもデスクトップ直下にある配置に対応します。現在の作業ディレクトリには依存しません。Greenlyを移動した場合は、この相対パスを更新してください。

Greenly本体はWebで5173〜5175、APIで8080、18081、18082の空きポートを順に選びます。選択されたポートはオーバーレイに表示されます。Web候補がすべて使用中の場合など、起動スクリプト自体が起動できないときはエラーを表示し、詳細を `%LOCALAPPDATA%\GreenlyOverlay\overlay.log` に記録します。設定範囲内のポートを一括終了する機能はありません。

## 開発

必要環境は .NET 10 SDK とWindows Desktop targeting packです。

```powershell
dotnet build .\SysOverRay.csproj -c Release
dotnet publish .\SysOverRay.csproj -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -o ..\app
```

配布先に `app\overlay-settings.json` を含めてください。`Greenlyを起動.lnk` は `app\SysOverRay.exe` を起動し、作業フォルダーも `app` に設定します。

## 安全境界

本アプリはローカル開発用です。認証は追加しません。Greenly側の開発用デモ利用者と127.0.0.1限定の設定を維持してください。公開ネットワークへ露出する用途には使えません。
