"""Useful database diagnostics without printing driver messages or SQL parameters."""

MESSAGES = {
    1044: 'DBへのアクセス権限が不足しています。setup.batを再実行してください。',
    1045: 'MySQLユーザーとパスワードが一致しません。setup.batで専用アカウントを設定してください。',
    1049: '接続先DBが存在しません。setup.batでDBを準備してください。',
    1142: 'DB操作の権限が不足しています。setup.batで権限を確認してください。',
    2003: 'MySQLに接続できません。サーバーの起動状態と接続先を確認してください。',
}


def safe_error(error: Exception) -> str:
    original = getattr(error, 'orig', error)
    code = original.args[0] if original.args and isinstance(original.args[0], int) else None
    if code is not None:
        message = MESSAGES.get(code, 'DB処理に失敗しました。接続先・権限・MySQLログを確認してください。')
        return f'MySQL {code}: {message}'
    return f'{type(error).__name__}: 処理に失敗しました。設定とローカルログを確認してください。'
