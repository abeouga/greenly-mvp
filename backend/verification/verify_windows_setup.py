"""Real Windows launcher/DB boundary checks; see docs/windows-setup.md for their purpose."""

import argparse
import hashlib
import json
import os
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen
from uuid import uuid4

import pymysql
from sqlalchemy import text

from greenly_api import setup_database
from greenly_api.config import REPO_ROOT
from greenly_api.database import create_database_engine
from greenly_api.local_mysql import connect_admin, ensure_server, read_state, verify_directory


def digest_files(repo: Path) -> dict:
    return {name: hashlib.sha256((repo / name).read_bytes()).hexdigest() for name in ('.env', '.env.e2e')}


def digest_data(config: dict) -> str:
    digest = hashlib.sha256()
    with setup_database.connect(config) as connection, connection.cursor() as cursor:
        for table in ('assets', 'gardens', 'placed_objects'):
            cursor.execute(f'SELECT * FROM `{table}` ORDER BY id')
            digest.update(repr(cursor.fetchall()).encode('utf-8'))
    return digest.hexdigest()


def run_setup(repo: Path, output: Path) -> None:
    command = f'"{os.environ["COMSPEC"]}" /d /s /c ""{repo / "setup.bat"}""'
    with output.open('wb') as log:
        result = subprocess.run(command, stdin=subprocess.DEVNULL,
                                stdout=log, stderr=subprocess.STDOUT, cwd=repo, timeout=180,
                                creationflags=subprocess.CREATE_NO_WINDOW)
    assert result.returncode == 0, 'Repeated setup failed; inspect private verification log.'
    assert 'MySQL管理者名' not in output.read_text(encoding='utf-8', errors='replace'), 'Admin prompt returned.'


def launch(repo: Path, output: Path) -> dict:
    stop = output.with_suffix('.stop')
    stop.unlink(missing_ok=True)
    env = os.environ.copy()
    env['GREENLY_STOP_REQUEST_PATH'] = str(stop)
    command = f'"{os.environ["COMSPEC"]}" /d /s /c ""{repo / "start.bat"}" -NoBrowser"'
    with output.open('wb') as log:
        process = subprocess.Popen(command, cwd=repo, env=env,
                                   stdout=log, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL,
                                   creationflags=subprocess.CREATE_NO_WINDOW)
        try:
            deadline = time.monotonic() + 90
            while time.monotonic() < deadline:
                assert process.poll() is None, 'Launcher exited before health checks.'
                try:
                    with urlopen('http://127.0.0.1:8080/api/assets', timeout=2) as response:
                        assert response.headers['X-Greenly-Backend'] == 'fastapi'
                        assert len(json.load(response)) == 4
                    with urlopen('http://127.0.0.1:5173/api/assets', timeout=2) as response:
                        assert response.headers['X-Greenly-Backend'] == 'fastapi'
                        assert len(json.load(response)) == 4
                    with urlopen('http://127.0.0.1:5173/', timeout=2) as response:
                        assert response.status == 200
                    break
                except OSError:
                    time.sleep(.25)
            else:
                raise AssertionError('Launcher health checks timed out.')
            return {'api_status': 200, 'web_status': 200, 'proxy_backend': 'fastapi'}
        finally:
            stop.touch()
            try:
                process.wait(timeout=15)
            except subprocess.TimeoutExpired:
                subprocess.run(['taskkill.exe', '/PID', str(process.pid), '/T', '/F'],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
                process.wait(timeout=10)
            stop.unlink(missing_ok=True)


def managed_checks(repo: Path, output: Path, state: dict, configs: list[dict]) -> list[str]:
    checks = []
    suffix = uuid4().hex[:12]
    bad_database = 'greenly_e2e_setup_bad_' + suffix
    bad_user = 'greenly_setup_bad_' + suffix
    with connect_admin(state) as admin, admin.cursor() as cursor:
        verify_directory(admin, state)
        cursor.execute(f'CREATE DATABASE `{bad_database}`')
        cursor.execute(f'CREATE TABLE `{bad_database}`.foreign_table (id INT PRIMARY KEY)')
    before = digest_files(repo)
    env = os.environ.copy()
    env.update({'GREENLY_DB_URL': f'mysql://127.0.0.1:{state["port"]}/{bad_database}',
                'GREENLY_DB_USER': bad_user, 'GREENLY_DB_PASSWORD': uuid4().hex})
    try:
        with (output / 'schema-rejection.log').open('wb') as log:
            result = subprocess.run([sys.executable, '-m', 'greenly_api.setup_database', '--bin',
                                     str(Path(state['executable']).parent)], cwd=repo / 'backend', env=env,
                                    stdout=log, stderr=subprocess.STDOUT, timeout=30,
                                    creationflags=subprocess.CREATE_NO_WINDOW)
        assert result.returncode != 0 and digest_files(repo) == before
        with connect_admin(state) as admin, admin.cursor() as cursor:
            cursor.execute('SELECT COUNT(*) FROM mysql.user WHERE User=%s', (bad_user,))
            assert cursor.fetchone()[0] == 0
            cursor.execute(f'SELECT COUNT(*) FROM `{bad_database}`.foreign_table')
            assert cursor.fetchone()[0] == 0
        checks.append('unknown_schema_rejected_before_account_or_config_writes')
    finally:
        assert bad_database.startswith('greenly_e2e_setup_bad_')
        with connect_admin(state) as admin, admin.cursor() as cursor:
            cursor.execute(f'DROP DATABASE `{bad_database}`')
    with connect_admin(state) as admin, admin.cursor() as cursor:
        verify_directory(admin, state)
        cursor.execute('SHUTDOWN')
    time.sleep(2)
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', state['port']))
        listener.listen()
        try:
            ensure_server(state)
        except ValueError:
            pass
        else:
            raise AssertionError('Occupied managed port was accepted.')
    checks.append('occupied_managed_port_rejected')
    result = launch(repo, output / 'managed-restart-launch.log')
    assert result['api_status'] == 200
    with connect_admin(state) as admin:
        verify_directory(admin, state)
    checks.append('managed_mysql_restarted_by_launcher_with_original_data_directory')
    for config in configs:
        engine = create_database_engine(setup_database.configured_settings(config))
        try:
            with engine.connect() as connection:
                assert connection.scalar(text('SELECT version_num FROM alembic_version')) == '0002'
        finally:
            engine.dispose()
    return checks


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--workspace', type=Path, default=REPO_ROOT)
    parser.add_argument('--managed', action='store_true')
    args = parser.parse_args()
    repo = args.workspace.resolve()
    setup_database.REPO_ROOT = repo
    output = Path(os.environ['LOCALAPPDATA']) / 'Greenly/verification' / ('boundaries-' + uuid4().hex[:12])
    output.mkdir(parents=True)
    report = {'mode': 'managed' if args.managed else 'existing', 'checks': [], 'result': 'failed'}
    original_profile = os.environ.get('GREENLY_PROFILE')
    fixture = str(uuid4())
    configs = [setup_database.profile_config('dev', 3306), setup_database.profile_config('e2e', 3306)]
    try:
        # Dedicated E2E sentinel proves repeated setup preserves nonempty application data.
        with setup_database.connect(configs[1]) as connection, connection.cursor() as cursor:
            cursor.execute('INSERT INTO gardens (id,owner_id,name,width,depth,revision,updated_at) '
                           'VALUES (%s,%s,%s,10,8,0,UTC_TIMESTAMP(6))',
                           (fixture, 'greenly-e2e-demo', 'setup verification sentinel'))
        credentials = digest_files(repo)
        data = [digest_data(config) for config in configs]
        for attempt in range(2):
            run_setup(repo, output / f'repeated-setup-{attempt}.log')
            assert credentials == digest_files(repo), 'Setup changed established credentials.'
            assert data == [digest_data(config) for config in configs], 'Setup changed existing data.'
        report['checks'].append('two_repeated_setups_preserved_credentials_and_nonempty_data_without_admin_prompt')
        for config, other in ((configs[0], configs[1]), (configs[1], configs[0])):
            try:
                with setup_database.connect({**config, 'database': other['database']}):
                    raise AssertionError('Application account can access the other database.')
            except pymysql.MySQLError as error:
                assert error.args[0] == 1044
        report['checks'].append('dev_and_e2e_accounts_cannot_access_each_others_database')
        state = read_state() if args.managed else None
        if state:
            report['checks'] += managed_checks(repo, output, state, configs)
        else:
            report['launcher'] = launch(repo, output / 'launcher.log')
            report['checks'].append('root_launcher_api_web_proxy_and_graceful_stop')
        env = os.environ.copy()
        env.update({'GREENLY_PROFILE': 'dev', 'GREENLY_DB_USER': configs[0]['user'],
                    'GREENLY_DB_PASSWORD': uuid4().hex, 'GREENLY_DB_URL': configs[0]['url']})
        result = subprocess.run([sys.executable, '-m', 'greenly_api', 'serve'], cwd=repo / 'backend', env=env,
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=20,
                                creationflags=subprocess.CREATE_NO_WINDOW)
        message = result.stdout.decode('utf-8', errors='replace')
        assert result.returncode != 0 and '1045' in message
        assert env['GREENLY_DB_PASSWORD'] not in message and configs[0]['password'] not in message
        (output / 'safe-authentication-error.log').write_text(message, encoding='utf-8')
        report['checks'].append('authentication_error_1045_reported_without_secret_values')
        report['result'] = 'passed'
        return 0
    finally:
        with setup_database.connect(configs[1]) as connection, connection.cursor() as cursor:
            cursor.execute('DELETE FROM gardens WHERE id=%s AND owner_id=%s', (fixture, 'greenly-e2e-demo'))
        if original_profile is None:
            os.environ.pop('GREENLY_PROFILE', None)
        else:
            os.environ['GREENLY_PROFILE'] = original_profile
        (output / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
        destination = REPO_ROOT / 'artifacts/fastapi' / ('setup-managed-verification.json' if args.managed
                                                       else 'setup-existing-verification.json')
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(output / 'report.json', destination)
        print(json.dumps(report, indent=2))


if __name__ == '__main__':
    raise SystemExit(main())
