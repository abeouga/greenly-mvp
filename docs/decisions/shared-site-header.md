# Canvasのサイトヘッダー

## Context

CanvasはKusakari EC内の購入支援機能です。旧画面は庭一覧と編集画面で別々のCanvas専用ロゴ表記を使っていました。

## Decision

- ECのロゴ画像・Georgiaのブランド表記・配色・ナビゲーションをCanvasにも適用します。Canvasの表示はナビゲーションのリンクにまとめ、ロゴ横には重複表示しません。
- Canvas内は `SiteHeader` を一覧・読み込み中・編集画面で共用します。庭名・保存・庭一覧への操作は編集バーに分けます。
- ECの `packages/site-header` にヘッダーとCSSの正本をまとめます。ECはnpm workspace、Canvasは `vendor` の同じnpmパッケージを使用します。Canvasの `site-header.css` は外枠のみを扱い、ヘッダーの見た目を個別定義しません。
- 独立起動とフォルダ移動を維持するため、ECの兄弟フォルダへの直接importは行いません。Canvas単体のnpm install・ビルドに必要なパッケージはCanvasのvendorに保持します。
- 「ひと鉢からはじまる、緑のある暮らし。」の帯も共通部品に含めます。ボタンとリンクの行高・余白も共通CSSで明示します。
- リンクは既存の `VITE_KUSAKARI_EC_URL` を基準に生成します。ECの店舗・説明・注文履歴ダイアログは許可した `panel=stores|guide|orders` のみを受け付けます。
- ヘッダーのリンクは編集画面の未保存確認を通します。保存中・配置物のドラッグ中は移動を止めます。
- Canvasはカート件数を独自に保持せず、カートへ移動するリンクを提供します。
- Viteの依存事前変換では共通ヘッダーを除外し、依存する `lucide-react` を明示的に対象へ含めます。アイコンの再エクスポートから未使用の個別ファイルまで読み込まれ、ブラウザで遮断される問題を防ぎます。

## Alternatives

- `Kusakari for Canvas` はCanvas向けサービス、`Kusakari in Canvas` はCanvas内のサービスという意味になるため採用しません。
- 兄弟リポジトリへの直接依存はフォルダ移動や単独起動を妨げるため採用しません。

## Consequences

利用者はECとCanvasで同じヘッダー部品とCSSを使用します。変更はECのpackages/site-headerで行い、npm packでCanvasのvendorへ配布して依存バージョンを更新します。Canvas側でヘッダーを別実装する必要はありません。配布手順はECのpackages/site-header/README.mdに記録します。

## 画面調整

- 本文・フォームはECと同じDM Sans / Noto Sans JP、見出しはNoto Serif JPを読み込みます。
- 共通の外枠は最大1920px、一覧の内容は最大1360pxの枠に中央配置します。小さい画面では余白を減らします。
- 一覧の「庭のワークスペース」「マイガーデン」と説明文を削除し、フッターを `kusakari 年` の中央表示にします。
- ヘッダーの「店舗を探す」の右にCanvasへのリンクを置きます。
- スクロールバーの有無による左右のずれを避けるため、Canvasではスクロールバー用の余白を確保します。

## Verification

- 実ブラウザのEC・Canvas一覧・Canvas編集・390px幅の画面を `artifacts/e2e/common-header-*.png` に記録します。
- 正常起動中のECに対して8つの移動先とダイアログを確認し、`common-header-browser.json` に記録します。
- `e2e/site-header.spec.ts` は実API・専用MySQLで未保存確認、取消、保存・再読み込み、スマートフォンの横幅を確認します。
- `shared-package-header-browser.json` はパッケージのソース・CSSのハッシュ一致、実ブラウザの計算済みスタイル、上部の帯、各画面幅の表示を記録します。
- `artifacts/e2e/check-icon-delivery.mjs` はEC・Canvas一覧・編集画面を実ブラウザで開き、個別の `fingerprint.js` を遮断する障害注入を行います。最適化されたLucideの配信、個別アイコンへの要求が0件、ヘッダーアイコン、木50本の読み込み、390px幅の横はみ出しを確認し、`icon-delivery-browser.json` と画面画像へ記録します。
