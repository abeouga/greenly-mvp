# Windowsの一括セットアップ

## Context

従来のsetupはMySQLへのTCP接続だけを確認し、DB・専用ユーザー・権限を準備しなかった。
そのためセットアップ成功後にAPI起動が失敗した。別PCではMySQL本体も用意する必要がある。

## Decision

- Windows 10/11 x64で、ルートのsetup.batを一括セットアップの入口にする。start.batも同じsetupを呼ぶ。
- 既存のローカルMySQLが応答していれば利用する。接続設定が未作成なら管理者名・パスワードを非表示入力する。
  管理者パスワードは保存しない。dev/e2eに別DB・別ユーザーを用意し、専用のランダムなパスワードを生成する。
- 既存ユーザーのパスワードを変更しない。自動選択したユーザー名が既に使われている場合は固有名を生成する。
  明示指定された既存ユーザーは、その認証情報を検証して利用する。
- 接続設定をGit無視対象の.env/.env.e2eへ保存する。書き込み前にWindowsの現在ユーザーだけにアクセスを制限する。
  次回のsetupは保存済み資格情報で接続できれば管理者入力を省略する。
- MySQL未稼働かつ接続先が未指定なら、ユーザー領域のGreenly専用MySQLを初期化する。
  強制選択はsetup.bat -DatabaseMode managed。既存の明示接続設定を別DBへ自動変更しない。
- インストール済みのMySQL 8.0/8.4バイナリを利用できない場合、公式MySQL 8.4.11のZIPを取得する。
  固定SHA-256およびOracle署名を検証してから利用する。バージョン変更には再検証とチェックサム更新が必要。
- 専用MySQLは127.0.0.1だけで待ち受け、MySQL X Protocolとバイナリログを無効化する。
  Windowsサービスへ登録せず、既存MySQLのサービス・データディレクトリを変更しない。
  状態・データ・ログは%LOCALAPPDATA%\Greenly\mysqlへ保存し、管理者秘密はWindows DPAPIで保護する。
  ポートは初期化時に空きポートを選択して保存する。次回起動ではそのポートと実際のデータディレクトリを照合する。
- 初期化・起動はプロセス間ファイルロック、DB準備はMySQL advisory lockで重複実行を防ぐ。
- 既存DBは変更前に構造・履歴を照合し、既存のAlembic移行処理によるバックアップ・移行を使用する。
  接続・認証・スキーマ・初期アセットの確認に失敗した場合はセットアップ成功と表示しない。
- API起動エラーはMySQLの番号と対応方法を表示し、ドライバの全文・SQL・秘密情報は出力しない。

## Alternatives

システム全体へのMySQL MSI導入は、管理者権限と既存サービスへの影響が大きいため既定にしない。
Docker、SQLite、localStorageへの置換は、現在の実MySQLを使うMVPの境界を変えるため採用しない。

## Consequences

初回は配布物の取得にネット接続とディスク空き容量が必要。MySQLのVisual C++ランタイムが未導入のPCでは、
Microsoft署名を確認したランタイムのインストール時だけWindowsの管理者確認が必要になる。
既存MySQLの管理者パスワードが不明な場合は、接続設定のない新しいチェックアウトでmanagedを選べる。
専用MySQLはAPI終了後も稼働する。PC再起動後はsetup/start/API起動時に同じ保存先から復帰する。
別PCへ.env、.env.e2e、MySQLデータディレクトリをコピーせず、ソースと同梱アセットを渡してsetupを実行する。
DPAPI秘密は作成したWindowsユーザーに結びつく。アカウントを変える場合はDBバックアップと移行が必要。

SysOverRay用のユーザー領域ランタイムは、.NET本体とWindows Desktopの両方を取得する。
Windows Desktop ZIPだけではdotnet.exe/.NET本体が揃わないため、両方の導入後にランタイム一覧を検証する。

## Verification scope

主要検証は実API・実MySQLを使うChromiumの保存・再読み込みフローとする。
独立検証では、初回DB/ユーザー作成、再実行時の資格情報・データ不変、専用MySQLの停止後再起動、
空きポート競合、構造不一致での変更前拒否、認証エラー番号と秘密情報の非出力を確認する。
ブラウザーE2Eだけでは、ツール未導入・MySQL未初期化・Windows DPAPI・初回管理者入力を再現できないため、
別のユーザー領域とクリーンなソースコピーで一括setupを実行する。
検証のログと状態はGit外へ置き、Gitに保存する報告には秘密情報・機械固有パス・実利用者の庭を含めない。

## 検証結果（2026-10-02）

- 実際の既存MySQL 8.0.46に、DBと専用ユーザーを初回作成。root認証は非表示入力し、保存しなかった。
- Node/uv/Pythonと接続設定のないユーザー領域、依存関係のない日本語・空白入りソースコピーで、
  Node 24.21.0、uv 0.12.21、Python 3.12.14とロック済み依存関係を取得できた。
- 公式MySQL 8.4.11のZIPについてSHA-256とOracle署名を確認し、専用保存先でDB・専用ユーザーを作成できた。
- .NETがPATHにない環境で.NET本体とWindows Desktop 10.0.12を導入し、両ランタイムの存在確認が成功。
- setup.batを2回再実行し、管理者再入力なし・資格情報不変・dev/E2Eの業務テーブル不変を確認。
  E2E専用DBには保存データを入れて検証し、自分で作った検証レコードだけを削除した。
- start.batを直接実行し、API、Web、Web経由APIの200応答とFastAPI識別、停止処理を確認。
- 専用MySQLのポート競合時の拒否、停止後のstart.batによる同一保存先からの復帰、
  未知スキーマでアカウント/.envを書き換える前の拒否、dev/e2eの相互DBアクセス拒否を確認。
- 誤った接続資格情報でMySQL 1045の表示と秘密情報の非出力を確認。
- 型チェック・JS/Python lint・Python compile・Webビルド成功。既存MySQLでChromium全10件成功。
  専用MySQLでも庭作成・GLB配置・保存・再読み込みのシナリオを実行。
- 要約はartifacts/fastapi/setup-existing-verification.jsonとsetup-managed-verification.json。
  再読み込み後の画面・実API JSONはartifacts/e2e。詳細ログ・テスト用MySQLはGit外に保持。

別PCの実機そのものは未検証。Visual C++ランタイムの新規導入とUAC承認は、このPCに既存ランタイムがあるため未実行。
クリーンなユーザー領域を使う検証では、通常のMySQLサービスを停止せずmanagedモードを明示して専用MySQLを使用した。
WebビルドのチャンクサイズとThree.js Clockの既存警告は残る。
