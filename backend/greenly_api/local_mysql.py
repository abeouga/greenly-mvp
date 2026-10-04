"""A persistent, loopback-only real MySQL instance, separate from Windows services."""

import json
import os
import secrets
import socket
import subprocess
import time
from pathlib import Path

import pymysql

from .setup_files import instance_lock, private_file, protect_secret


def local_root() -> Path:
    return Path(os.environ.get('GREENLY_SETUP_HOME', str(Path(os.environ['LOCALAPPDATA']) / 'Greenly/mysql')))


def read_state() -> dict | None:
    path = local_root() / 'instance.json'
    if not path.is_file():
        return None
    state = json.loads(path.read_text(encoding='utf-8'))
    if state.get('format') != 1 or Path(state['data']).resolve() != (local_root() / 'data').resolve():
        raise ValueError('Greenly専用MySQLの状態ファイルが不正です。既存データを確認してください。')
    if not 1 <= state['port'] <= 65535:
        raise ValueError('Greenly専用MySQLのポート設定が不正です。')
    return state


def connect_admin(state: dict):
    return pymysql.connect(host='127.0.0.1', port=state['port'], user='root',
                           password=protect_secret(state['root_secret'], decrypt=True),
                           autocommit=True, connect_timeout=2, read_timeout=2, write_timeout=2)


def verify_directory(connection, state: dict) -> None:
    with connection.cursor() as cursor:
        cursor.execute('SELECT @@datadir')
        actual = cursor.fetchone()[0]
    if Path(actual).resolve() != Path(state['data']).resolve():
        raise ValueError('接続先がGreenly専用MySQLの保存先と異なります。変更せず停止しました。')


def _ensure_server(state: dict) -> None:
    try:
        with connect_admin(state) as connection:
            verify_directory(connection, state)
        return
    except pymysql.MySQLError as error:
        if error.args[0] != 2003:
            raise ValueError(f'Greenly専用MySQLへ認証できません (MySQL {error.args[0]})。') from None
    with socket.socket() as listener:
        try:
            listener.bind(('127.0.0.1', state['port']))
        except OSError:
            raise ValueError('Greenly専用MySQLのポートが別のプロセスに使用されています。') from None
    root = local_root()
    log_path = root / 'mysql.log'
    init_file = root / 'initialize-account.sql'
    args = [state['executable'], '--no-defaults', '--no-monitor', f'--datadir={state["data"]}',
            f'--port={state["port"]}', '--bind-address=127.0.0.1', '--mysqlx=0', '--skip-log-bin', '--console']
    if not state.get('secured'):
        password = protect_secret(state['root_secret'], decrypt=True)
        private_file(init_file, f"ALTER USER 'root'@'localhost' IDENTIFIED BY '{password}';\n")
        args.append(f'--init-file={init_file}')
    with log_path.open('a', encoding='utf-8') as log:
        process = subprocess.Popen(args, stdout=log, stderr=subprocess.STDOUT,
                                   creationflags=subprocess.CREATE_NO_WINDOW)
    try:
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            if process.poll() is not None:
                raise ValueError(f'Greenly専用MySQLが起動中に終了しました。ログ: {log_path}')
            try:
                with connect_admin(state) as connection:
                    verify_directory(connection, state)
                state['secured'] = True
                private_file(root / 'instance.json', json.dumps(state, indent=2))
                return
            except pymysql.MySQLError:
                time.sleep(.25)
        raise ValueError(f'Greenly専用MySQLが60秒以内に起動しませんでした。ログ: {log_path}')
    except Exception:
        # This handle belongs only to the process created above; never stop a system service.
        process.terminate()
        process.wait(timeout=15)
        raise
    finally:
        init_file.unlink(missing_ok=True)


def _initialize(bin_path: Path) -> dict:
    state = read_state()
    if state is not None:
        _ensure_server(state)
        return state
    root = local_root()
    data = root / 'data'
    if data.exists() and any(data.iterdir()):
        raise ValueError(f'管理情報のないMySQLデータが残っています。初期化せず停止しました: {data}')
    root.mkdir(parents=True, exist_ok=True)
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        port = listener.getsockname()[1]
    executable = bin_path / 'mysqld.exe'
    with (root / 'mysql-initialize.log').open('a', encoding='utf-8') as log:
        result = subprocess.run([str(executable), '--no-defaults', '--initialize-insecure',
                                 f'--datadir={data}', '--console'], stdout=log, stderr=subprocess.STDOUT,
                                creationflags=subprocess.CREATE_NO_WINDOW, timeout=120, check=False)
    if result.returncode:
        raise ValueError(f'Greenly専用MySQLの初期化に失敗しました。ログ: {root / "mysql-initialize.log"}')
    state = {'format': 1, 'executable': str(executable.resolve()), 'data': str(data.resolve()), 'port': port,
             'root_secret': protect_secret(secrets.token_urlsafe(40)), 'secured': False}
    private_file(root / 'instance.json', json.dumps(state, indent=2))
    _ensure_server(state)
    return state


def initialize(bin_path: Path) -> dict:
    with instance_lock(local_root()):
        return _initialize(bin_path)


def ensure_server(state: dict) -> None:
    with instance_lock(local_root()):
        _ensure_server(state)


def ensure_for_settings(settings) -> None:
    if os.name != 'nt':
        return
    state = read_state()
    if state and settings.database_url.host in {'127.0.0.1', 'localhost'} and settings.database_url.port == state['port']:
        ensure_server(state)
