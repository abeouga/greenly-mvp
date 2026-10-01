# Greenly 専用起動オーバーレイ

## 初回セットアップと起動

リポジトリ直下の `setup.bat` を一度実行すると、.NET 10 Desktop Runtimeをユーザー領域へ準備し、デスクトップに `Greenly SysOverRay` ショートカットを作成します。PowerShellからはリポジトリ直下の `setup.ps1` を実行できます。

その後はデスクトップのショートカット、またはこのフォルダーの `start.bat` を使います。PowerShellからは `start.ps1` を実行できます。フォルダーを移動しても、設定と実行ファイルはスクリプトの場所から解決します。オーバーレイは右上に表示され、GreenlyのAPI/Web状態とポート番号を示します。

## 配置

このフォルダーはリポジトリ内の `sysover-ray2` にあります。実行ファイルは `app\SysOverRay.exe`、設定は `app\overlay-settings.json` にあります。設定のGreenlyパスは実行ファイル位置を基準に `..\\..` とし、カレントディレクトリに依存しません。絶対パスを含む既存ショートカットはなくし、セットアップ時に現在のクローン位置を指すショートカットを作成します。詳細は [SysOverRay\README.md](SysOverRay/README.md) を参照してください。

## 動作境界

停止・再起動は、設定されたGreenlyフォルダーの起動スクリプト、Vite、バックエンド用uvの実行引数を照合して、そのプロセスツリーを対象にします。`start.bat`からの既存起動分と、オーバーレイを開き直す前からの起動分も操作できます。同じフォルダーで複数起動している場合はまとめて停止します。MySQLサービスは停止しません。

## 検証の再実行

PowerShellでこのフォルダーへ移動し、次を実行します。実際のGreenly `start.ps1` とローカルAPIを使い、起動、停止、停止後の起動、再起動、最終停止を確認します。GreenlyのMySQLと依存関係が先に起動している必要があります。

```powershell
dotnet run --project .\verification\LifecycleProbe\LifecycleProbe.csproj -c Release
```

このコマンドの結果は `verification\lifecycle-report.json` に保存します。現在残っている同ファイルは前の版の検証記録です。実画面での停止・再起動・オーバーレイ再表示後の検証は `verification\ui-check.md` と `verification\ui-control-report.json` に記録しています。起動時の空きポートはその時点の使用状況で変わります。
