"""A persistent, loopback-only real MySQL instance, separate from Windows services."""

import base64
import json
import os
import secrets
import shutil
import socket
import subprocess
import time
from dataclasses import replace
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import pymysql

from .config import REPO_ROOT, canvas_data_home
from .setup_files import instance_lock, private_file, protect_secret, save_settings


def local_root() -> Path:
    return canvas_data_home() / 'mysql'


def read_state() -> dict | None:
    path = local_root() / 'instance.json'
    if not path.is_file():
        return None
    try:
        state = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        raise ValueError(f'Kusakari Canvas MySQL state file is unreadable: {path}') from None
    if not isinstance(state, dict):
        raise ValueError('Kusakari Canvas MySQL state file must contain a JSON object.')
    if not isinstance(state.get('data'), str) or not isinstance(state.get('executable'), str):
        raise ValueError('Kusakari Canvas MySQL state file is missing required paths.')
    if state.get('format') != 1 or Path(state['data']).resolve() != (local_root() / 'data').resolve():
        raise ValueError('Kusakari Canvas用MySQLの状態ファイルが不正です。既存データを確認してください。')
    port = state.get('port')
    if not isinstance(port, int) or isinstance(port, bool) or not 1 <= port <= 65535:
        raise ValueError('Kusakari Canvas用MySQLのポート設定が不正です。')
    previous_ports = state.get('previous_ports', [])
    if not isinstance(previous_ports, list) or any(type(value) is not int or not 1 <= value <= 65535
                                                   for value in previous_ports):
        raise ValueError('Kusakari Canvas用MySQLの過去ポート設定が不正です。')
    if not isinstance(state.get('root_secret'), str) or not state['root_secret']:
        raise ValueError('Kusakari Canvas用MySQLの認証情報が状態ファイルにありません。')
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
        raise ValueError('接続先がKusakari Canvas用MySQLの保存先と異なります。変更せず停止しました。')


def _port_is_available(port: int) -> bool:
    with socket.socket() as listener:
        try:
            listener.bind(('127.0.0.1', port))
            return True
        except OSError:
            return False


def _select_free_port(excluded: set[int]) -> int:
    for _ in range(20):
        with socket.socket() as listener:
            listener.bind(('127.0.0.1', 0))
            port = listener.getsockname()[1]
        if port not in excluded and _port_is_available(port):
            return port
    raise ValueError('Kusakari Canvas用MySQLの空きポートを確保できませんでした。')


def _run_powershell(script: str) -> str | None:
    system_root = os.environ.get('SystemRoot') or os.environ.get('WINDIR')
    executable = (Path(system_root) / 'System32' / 'WindowsPowerShell' / 'v1.0' / 'powershell.exe'
                  if system_root else None)
    if executable is None or not executable.is_file():
        found = shutil.which('powershell.exe')
        executable = Path(found) if found else None
    if executable is None or not executable.is_file():
        return None
    encoded = base64.b64encode(script.encode('utf-16le')).decode('ascii')
    try:
        result = subprocess.run([str(executable), '-NoLogo', '-NoProfile', '-NonInteractive',
                                 '-EncodedCommand', encoded], capture_output=True, text=True, timeout=10,
                                creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0), check=False)
    except (OSError, subprocess.TimeoutExpired):
        return None
    if result.returncode:
        return None
    return result.stdout.strip()


def _listener_process_ids(port: int) -> list[int] | None:
    script = (f'$ids = @(Get-NetTCPConnection -State Listen -LocalPort {port} -ErrorAction SilentlyContinue '
              '| Select-Object -ExpandProperty OwningProcess -Unique); '
              'if ($ids.Count -eq 0) { \'[]\' } else { ConvertTo-Json -InputObject $ids -Compress }')
    output = _run_powershell(script)
    if output is None:
        return None
    try:
        result = json.loads(output)
    except json.JSONDecodeError:
        return None
    if isinstance(result, int):
        return [result]
    if isinstance(result, list) and all(isinstance(item, int) for item in result):
        return result
    return None


def _process_uses_data_directory(process_id: int, data_directory: str) -> bool | None:
    encoded_path = base64.b64encode(data_directory.encode('utf-8')).decode('ascii')
    script = (f'$data = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(\'{encoded_path}\')); '
              f'$process = Get-CimInstance Win32_Process -Filter \'ProcessId = {process_id}\' -ErrorAction Stop; '
              'if ($process -and $process.Name -ieq \'mysqld.exe\' -and '
              '$process.CommandLine -and '
              '$process.CommandLine.IndexOf($data, [StringComparison]::OrdinalIgnoreCase) -ge 0) '
              "{ 'yes' } else { 'no' }")
    output = _run_powershell(script)
    if output == 'yes':
        return True
    if output == 'no':
        return False
    return None


def _managed_process_is_running(state: dict) -> bool | None:
    encoded_path = base64.b64encode(state['data'].encode('utf-8')).decode('ascii')
    script = (f'$data = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(\'{encoded_path}\')); '
              '$processes = @(Get-CimInstance Win32_Process -Filter "Name = \'mysqld.exe\'" -ErrorAction Stop); '
              'foreach ($process in $processes) { '
              'if ($process.CommandLine -and '
              '$process.CommandLine.IndexOf($data, [StringComparison]::OrdinalIgnoreCase) -ge 0) '
              "{ 'yes'; exit } }; 'no'")
    output = _run_powershell(script)
    if output == 'yes':
        return True
    if output == 'no':
        return False
    return None


def _managed_process_owns_port(state: dict) -> bool | None:
    process_ids = _listener_process_ids(state['port'])
    if process_ids is None:
        return None
    for process_id in process_ids:
        owns_data = _process_uses_data_directory(process_id, state['data'])
        if owns_data is None:
            return None
        if owns_data:
            return True
    return False


def _remember_new_port(state: dict) -> dict:
    previous_port = state['port']
    previous_ports = state.get('previous_ports', [])
    if not isinstance(previous_ports, list) or any(type(port) is not int for port in previous_ports):
        previous_ports = []
    previous_ports = list(dict.fromkeys([*previous_ports, previous_port]))[-8:]
    state['previous_ports'] = previous_ports
    state['port'] = _select_free_port(set(previous_ports))
    private_file(local_root() / 'instance.json', json.dumps(state, indent=2))
    return state


def _reassign_external_port(state: dict, error_message: str) -> dict:
    owns_data = _managed_process_owns_port(state)
    if owns_data is None:
        raise ValueError('Kusakari Canvas用MySQLのポート使用者を特定できません。既存プロセスを停止せずセットアップを中止しました。')
    if owns_data:
        raise ValueError(error_message) from None
    return _remember_new_port(state)


def _managed_ports(state: dict) -> set[int]:
    previous_ports = state.get('previous_ports', [])
    if not isinstance(previous_ports, list):
        previous_ports = []
    return {state['port'], *(port for port in previous_ports
                             if type(port) is int and 1 <= port <= 65535)}


def _updated_managed_url(value: str, profile: str, ports: set[int], current_port: int) -> str | None:
    parsed = urlparse(value.removeprefix('jdbc:'))
    expected_database = 'kusakari_canvas_e2e' if profile == 'e2e' else 'kusakari_canvas'
    if parsed.scheme not in {'mysql', 'mysql+pymysql'} or parsed.hostname not in {'127.0.0.1', 'localhost'} \
            or parsed.username or parsed.password or parsed.query or parsed.fragment \
            or parsed.path.lstrip('/') != expected_database:
        return None
    try:
        old_port = parsed.port or 3306
    except ValueError:
        return None
    if old_port not in ports or old_port == current_port:
        return None
    return urlunparse(parsed._replace(netloc=f'{parsed.hostname}:{current_port}'))


def _synchronize_managed_urls(state: dict) -> None:
    ports = _managed_ports(state)
    for profile, suffix in (('dev', ''), ('e2e', '.e2e')):
        path = REPO_ROOT / ('.env' + suffix)
        name = 'KUSAKARI_CANVAS_E2E_DB_URL' if profile == 'e2e' else 'KUSAKARI_CANVAS_DB_URL'
        saved = ''
        if path.is_file():
            for line in path.read_text(encoding='utf-8-sig').splitlines():
                key, separator, value = line.strip().partition('=')
                if separator and key.strip() == name:
                    saved = value.strip().strip('\"\'')
                    break
        updated = _updated_managed_url(saved, profile, ports, state['port']) if saved else None
        if updated:
            save_settings(path, {name: updated})
        environment_value = os.environ.get(name)
        if environment_value:
            updated = _updated_managed_url(environment_value, profile, ports, state['port'])
            if updated:
                os.environ[name] = updated


def _wait_for_running_managed_server(state: dict) -> dict:
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline:
        try:
            with connect_admin(state) as connection:
                verify_directory(connection, state)
            return state
        except pymysql.MySQLError as error:
            if error.args and error.args[0] not in {2003, 2006, 2013}:
                raise ValueError(f'Kusakari Canvas用MySQLへ認証できません (MySQL {error.args[0]})。') from None
            time.sleep(.25)
    raise ValueError('Kusakari Canvas専用MySQLプロセスは見つかりましたが、60秒以内に接続できませんでした。')


def _ensure_server(state: dict) -> dict:
    try:
        connection = connect_admin(state)
    except pymysql.MySQLError as error:
        code = error.args[0] if error.args else None
        if code not in {2003, 2006, 2013}:
            state = _reassign_external_port(
                state, f'Kusakari Canvas用MySQLへ認証できません (MySQL {code or "unknown"})。'
            )
    else:
        with connection:
            try:
                verify_directory(connection, state)
            except ValueError as error:
                state = _reassign_external_port(state, str(error))
            else:
                return state
    existing_process = _managed_process_is_running(state)
    if existing_process is None:
        raise ValueError('Kusakari Canvas用MySQLの既存プロセスを確認できません。既存プロセスを停止せずセットアップを中止しました。')
    if existing_process:
        return _wait_for_running_managed_server(state)
    if not _port_is_available(state['port']):
        owns_data = _managed_process_owns_port(state)
        if owns_data is None:
            raise ValueError('Kusakari Canvas用MySQLのポート使用者を特定できません。既存プロセスを停止せずセットアップを中止しました。')
        if owns_data:
            return _wait_for_running_managed_server(state)
        state = _remember_new_port(state)
    if not Path(state['executable']).is_file():
        raise ValueError('Kusakari Canvas用MySQLの実行ファイルが見つかりません。セットアップ設定を確認してください。')
    if not Path(state['data']).is_dir():
        raise ValueError('Kusakari Canvas用MySQLのデータフォルダーが見つかりません。初期化せず停止しました。')
    root = local_root()
    log_path = root / 'mysql.log'
    init_file = root / 'initialize-account.sql'
    args = [state['executable'], '--no-defaults', '--no-monitor', f'--datadir={state["data"]}',
            f'--port={state["port"]}', '--bind-address=127.0.0.1', '--mysqlx=0', '--skip-log-bin', '--console']
    for attempt in range(8):
        if not _port_is_available(state['port']):
            owns_data = _managed_process_owns_port(state)
            if owns_data is None:
                raise ValueError('Kusakari Canvas用MySQLのポート使用者を特定できません。既存プロセスを停止せずセットアップを中止しました。')
            if owns_data:
                return _wait_for_running_managed_server(state)
            state = _remember_new_port(state)
            continue
        process = None
        retry_with_new_port = False
        args = [state['executable'], '--no-defaults', '--no-monitor', f'--datadir={state["data"]}',
                f'--port={state["port"]}', '--bind-address=127.0.0.1', '--mysqlx=0', '--skip-log-bin', '--console']
        if not state.get('secured'):
            password = protect_secret(state['root_secret'], decrypt=True)
            private_file(init_file, f"ALTER USER 'root'@'localhost' IDENTIFIED BY '{password}';\n")
            args.append(f'--init-file={init_file}')
        try:
            with log_path.open('a', encoding='utf-8') as log:
                process = subprocess.Popen(args, stdout=log, stderr=subprocess.STDOUT,
                                           creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
            deadline = time.monotonic() + 60
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    if not _port_is_available(state['port']):
                        owns_data = _managed_process_owns_port(state)
                        if owns_data is None:
                            raise ValueError('Kusakari Canvas用MySQLのポート使用者を特定できません。既存プロセスを停止せずセットアップを中止しました。')
                        if owns_data:
                            return _wait_for_running_managed_server(state)
                        state = _remember_new_port(state)
                        retry_with_new_port = True
                        break
                    raise ValueError(f'Kusakari Canvas用MySQLが起動中に終了しました。ログ: {log_path}')
                try:
                    with connect_admin(state) as connection:
                        verify_directory(connection, state)
                    state['secured'] = True
                    private_file(root / 'instance.json', json.dumps(state, indent=2))
                    return state
                except pymysql.MySQLError as error:
                    if error.args and error.args[0] not in {2003, 2006, 2013}:
                        raise ValueError(f'Kusakari Canvas用MySQLへ認証できません (MySQL {error.args[0]})。') from None
                    time.sleep(.25)
            if not retry_with_new_port:
                raise ValueError(f'Kusakari Canvas用MySQLが60秒以内に起動しませんでした。ログ: {log_path}')
        except Exception:
            # This handle belongs only to the process created above; never stop a system service.
            if process is not None and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=15)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)
            raise
        finally:
            init_file.unlink(missing_ok=True)
        if retry_with_new_port:
            continue
    raise ValueError(f'Kusakari Canvas用MySQLの起動を8回試行しましたが完了しませんでした。ログ: {log_path}')


def _initialize(bin_path: Path) -> dict:
    state = read_state()
    if state is not None:
        state = _ensure_server(state)
        _synchronize_managed_urls(state)
        return state
    root = local_root()
    data = root / 'data'
    if data.exists() and any(data.iterdir()):
        raise ValueError(f'管理情報のないMySQLデータが残っています。初期化せず停止しました: {data}')
    root.mkdir(parents=True, exist_ok=True)
    port = _select_free_port(set())
    executable = bin_path / 'mysqld.exe'
    with (root / 'mysql-initialize.log').open('a', encoding='utf-8') as log:
        result = subprocess.run([str(executable), '--no-defaults', '--initialize-insecure',
                                 f'--datadir={data}', '--console'], stdout=log, stderr=subprocess.STDOUT,
                                creationflags=subprocess.CREATE_NO_WINDOW, timeout=120, check=False)
    if result.returncode:
        raise ValueError(f'Kusakari Canvas用MySQLの初期化に失敗しました。ログ: {root / "mysql-initialize.log"}')
    state = {'format': 1, 'executable': str(executable.resolve()), 'data': str(data.resolve()), 'port': port,
             'root_secret': protect_secret(secrets.token_urlsafe(40)), 'secured': False}
    private_file(root / 'instance.json', json.dumps(state, indent=2))
    state = _ensure_server(state)
    _synchronize_managed_urls(state)
    return state


def initialize(bin_path: Path) -> dict:
    with instance_lock(local_root()):
        return _initialize(bin_path)


def ensure_server(state: dict) -> dict:
    with instance_lock(local_root()):
        state = _ensure_server(state)
        _synchronize_managed_urls(state)
        return state


def ensure_for_settings(settings):
    if os.name != 'nt':
        return settings
    state = read_state()
    if state and settings.database_url.host in {'127.0.0.1', 'localhost'} \
            and settings.database_url.port in _managed_ports(state):
        state = ensure_server(state)
        if settings.database_url.port != state['port']:
            settings = replace(settings, database_url=settings.database_url.set(port=state['port']))
    return settings
