# Canvas編集ツール・ECカート連携の検証（2026-10-13）

## 実装

- 配置物の変形・数値編集・角度リセット・複製・削除を庭右上のツールバーに移動。
- 詳細メニューは未選択時も利用可能。数量・施工範囲を内部の折りたたみ項目に移動し、配置数量を表示専用に変更。
- 写真の通常案内バーを削除。輪郭描画中の進捗表示は維持。
- 写真／3D切替を庭描画幅の中央に配置。狭い幅では視点操作を別行に配置。
- 保存状態を保存ボタンに統合。上部の「ECへ戻る」を削除。共通ロゴの移動と未保存確認は維持。
- 商品候補／カート内容を右パネルに配置。ECのカート・商品照合・数量更新APIをCookie付きで利用。
- EC側でCanvas Originを明示的に許可。revision競合時は再取得して通知し、自動再適用しない。
- 共通ヘッダー0.1.5をCanvasに配布。同一クエリのカート件数と「ECでカートを確認」を表示。
- GardenDocumentと庭保存APIの形式は変更していない。

## 検証環境

実EC API（Spring/MySQL）、実Canvas API（FastAPI/MySQL）と専用E2Eデータベースを使用。通常データへのテスト書込みは行わず、独立したブラウザーコンテキストと専用の庭を作成。通信障害シナリオのみ明示的な遮断を使用。

## 実行結果

- Canvas lint / build:web / API lint・compile: 成功。ビルドの大きなチャンク警告は残る。
- EC lint / typecheck / build:web / build:api: 成功。
- 最終UIに対するCanvas対象E2E 7件: 全件成功（editor-toolbar、photo-calibration 2件、photo-scale 3件、site-header）。
- EC統合E2E: 商品候補・共有カート・競合/通信障害/数量上限・写真モードの3件が成功。検証データと旧UI参照の修正後、在庫不足・既存EC往復の2件も成功（合計5シナリオ）。
- 50本の樹木を配置した庭の共有描画・個別編集・保存復元も成功（TREE50、実行時間1.7分）。最終対象E2Eは上記7件と合わせて8件成功。
- Canvasの保存失敗・revision競合・GLB読込再試行・土台寸法の対象テストも修正後に成功。

## 証跡

- EC `artifacts/e2e/commerce-1440.png`、`commerce-1024.png`、`commerce-390.png`、`commerce-320.png`：保存・再読み込み後の画面。1440pxと320pxの描画を目視確認。
- EC `artifacts/e2e/commerce-photo.png`：写真モードで数値編集・保存復元後の画面。案内バー非表示をDOMで確認、描画を目視確認。
- EC `artifacts/e2e/commerce-roundtrip.json`、`commerce-photo.json`：実APIの保存結果。
- Canvas `artifacts/e2e/editor-toolbar-reloaded.png`、`editor-toolbar-reloaded.json`：ツールバー操作と保存復元。
- Canvas `artifacts/commerce-initial-failures`、`artifacts/commerce-intermediate-failures`、EC `artifacts/commerce-integration-intermediate-failures`：途中の失敗証跡を保存。UI変更前のセレクター、テストデータの入力検証、並行実行中のタイムアウト／接続切断を含む。一部traceはタイムアウト中の書込み中断で不完全。

## 通常起動

EC APIは `npm run dev:api` で8086に復帰し、Canvas API8080・EC Web5186も応答。Canvas Web5173はユーザーの保存済み確認後に再起動し、通常画面で新しいヘッダー文言を確認。

2026-10-13追記：上記のアクセス拒否はPowerShell 7での診断結果であり、SysOverRayのWindows PowerShell 5.1では再現しなかった。Viteの所有プロセス識別と起動ログ取得を修正し、実際のSysOverRayボタンから起動・停止・再起動、API/Webのヘルスチェックに成功。詳細はECの docs/launcher-validation.md を参照。

最終確認：通常のWeb5173/5186、API8080/8086はいずれもHTTP 200。未解決の対象機能テスト失敗はない。全E2E一括実行の成功を示すものではなく、上記対象シナリオの検証結果。
