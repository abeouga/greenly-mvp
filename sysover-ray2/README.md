# Greenly 専用起動オーバーレイ

## 起動

デスクトップの `Greenly 起動.lnk` またはフォルダー内の `Greenlyを起動.lnk` をダブルクリックしてください。オーバーレイは右上に表示され、GreenlyのAPI/Web状態とポート番号を示します。

## 配置

このフォルダーは `C:\Users\hanam\Desktop\sysover-ray` から作ったGreenly専用コピーです。実行ファイルは `app\SysOverRay.exe`、設定は `app\overlay-settings.json` にあります。設定のGreenlyパスは実行ファイル位置を基準にするため、カレントディレクトリに依存しません。詳細は [SysOverRay\README.md](SysOverRay/README.md) を参照してください。

## 動作境界

ポート全停止は行いません。停止・再起動は、このオーバーレイが起動したGreenlyのプロセスツリーだけを対象にします。起動時に検出した既存APIは再利用し、そのプロセスを停止しません。

## 検証の再実行

PowerShellでこのフォルダーへ移動し、次を実行します。実際のGreenly `start.ps1` とローカルAPIを使い、起動、停止、停止後の起動、再起動、最終停止を確認します。GreenlyのMySQLと依存関係が先に起動している必要があります。

```powershell
dotnet run --project .\verification\LifecycleProbe\LifecycleProbe.csproj -c Release
```

結果は `verification\lifecycle-report.json`、表示確認用スクリーンショットは `verification\overlay-running.png` にあります。直近の実行では5173番が別アプリ、5174番が既存Greenlyで使用中の状態から起動し、5175番へ退避しました。
