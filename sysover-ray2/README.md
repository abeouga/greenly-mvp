# Kusakari Canvas 専用起動オーバーレイ

Kusakari EC内の3D庭づくり機能をローカル起動するためのWindowsオーバーレイです。ECとは開発用プロセスを分けていますが、利用者向けの独立サービスではありません。

## セットアップと起動

初回はリポジトリ直下の `setup.bat` を実行してください。.NET 10 Desktop Runtimeを確認し、デスクトップに `Kusakari Canvas SysOverRay` ショートカットを作成します。以後はそのショートカット、または `sysover-ray2\start.bat` を使います。PowerShellからはリポジトリ直下の `start.ps1`、または `sysover-ray2\start.ps1` を実行できます。

SysOverRayの配布ファイルを作り直す場合は、`sysover-ray2`で次を実行します。開発側には.NET 10 SDKが必要です。利用者側はセットアップが.NET 10 Desktop Runtimeを確認し、不足時にユーザー領域へ導入します。

```powershell
dotnet publish .\SysOverRay\SysOverRay.csproj -c Release -r win-x64 --self-contained false -o .\app
```

設定は実行ファイルの場所を基準に読み込みます。リポジトリ一式を移動する場合は内部のフォルダー構成を維持してください。セットアップは `Kusakari Canvas SysOverRay` ショートカットを作成します。プロジェクト移動後は、新しい場所で `setup.bat` を実行してショートカットを更新してください。

## 動作

- 起動時にKusakari CanvasのAPIとWebを確認し、正常なAPIが既に動いていれば再利用します。
- 停止・再起動では設定したリポジトリの起動スクリプト、Vite、uvのプロセスだけを照合します。ポート番号だけを根拠に他のプロジェクトを終了しません。
- 起動に失敗した場合は、今回起動したプロセスを停止します。MySQLサービスは停止しません。
- Web・APIのポート候補はそれぞれ5173〜5199、8080・18081〜18100です。使用中ポートを避けて起動し、選択結果を画面に表示します。

## 設定とログ

`app\overlay-settings.json` の `ProjectRoot` は、SysOverRayの実行ファイルからKusakari Canvasのリポジトリルートへの相対パスです。停止要求には `KUSAKARI_CANVAS_STOP_REQUEST_PATH` を使います。

ツールと専用MySQLは `%LOCALAPPDATA%\KusakariCanvas`、オーバーレイ位置とログはWindowsのLocalAppData配下に保存します。`KUSAKARI_CANVAS_HOME` でツールと専用MySQLの保存先を変更できます。相対パスはプロジェクトルート基準です。`KUSAKARI_CANVAS_HOME` の変更だけでは既存のmanaged MySQLデータは移動しません。以前のGreenly名の保存先は自動では読み込みません。

## 検証

SysOverRayフォルダーで実APIを使う起動・停止・再起動確認を行う場合:

```powershell
dotnet run --project .\verification\LifecycleProbe\LifecycleProbe.csproj -c Release
```

`start.bat`から実画面と操作ボタンを確認する場合:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\verification\verify-launch-lifecycle.ps1
```

後者は実API・Web・Web経由API、起動プロセスの置換、停止後のLISTEN消失を確認します。検証後はオーバーレイとKusakari Canvasを起動状態にします。
