# オーバーレイ停止・再起動の実画面検証

2026-10-01の修正版実行ファイルで、WPFの実ボタンをUI Automationから操作しました。APIは実際のSpring Boot/MySQL、Webは実際のViteです。

- オーバーレイを開き直した際、既存Web/APIが稼働し、停止・再起動ボタンが有効。
- 停止ボタンでWeb/APIの候補ポートのLISTENが0件になり、停止完了を表示。
- 停止中の再起動ボタンからWeb/APIが復帰。Webページと`/api/assets`を実HTTPで確認。
- オーバーレイを終了して開き直した後も、停止・再起動ボタンが有効。
- 開き直した後の再起動で、API PID 23524→30068、Web PID 17896→36592。両サービスの実HTTP応答を確認。

[検証結果](ui-control-report.json)、[再実行スクリプト](verify-ui-controls.ps1)。最終状態はWeb/APIとも稼働中。

`lifecycle-report.json`、`overlay-current.png`、`overlay-after-stop.png`は前の版の検証記録です。現在の停止対象と操作結果の根拠は`ui-control-report.json`です。全庭エディタE2Eの再実行はしていません。本修正の検証対象はオーバーレイのプロセス制御です。
