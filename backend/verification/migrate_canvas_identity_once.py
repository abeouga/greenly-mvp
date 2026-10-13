"""One-time, interactive copy of legacy local garden databases into Kusakari Canvas.

This is a manual data migration only. It is never called by application startup and
does not add legacy-name compatibility to the running system.
"""

import getpass
import json
import os
import re
import secrets
import shutil
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

import pymysql

from kusakari_canvas_api.config import REPO_ROOT, Settings, canvas_data_home
from kusakari_canvas_api.migrations import migrate
from kusakari_canvas_api.startup_errors import safe_error

HOST = "127.0.0.1"
PORT = 3306
DATABASES = {
    "dev": {
        "sources": ("kusakari_garden", "greenly"),
        "target": "kusakari_canvas",
        "legacy_owners": ("kusakari-garden-local-demo", "greenly-local-demo"),
        "owner": "kusakari-canvas-local-demo",
    },
    "e2e": {
        "sources": ("kusakari_garden_e2e", "greenly_e2e"),
        "target": "kusakari_canvas_e2e",
        "legacy_owners": ("kusakari-garden-e2e-demo", "greenly-e2e-demo"),
        "owner": "kusakari-canvas-e2e-demo",
    },
}


def mysql_tools() -> tuple[Path, Path]:
    configured = os.environ.get("KUSAKARI_CANVAS_MYSQL_BIN", "")
    candidates = []
    if configured:
        configured_path = Path(os.path.expandvars(configured)).expanduser()
        if not configured_path.is_absolute():
            configured_path = REPO_ROOT / configured_path
        candidates.append(configured_path.resolve())

    dump_on_path = shutil.which("mysqldump.exe") or shutil.which("mysqldump")
    client_on_path = shutil.which("mysql.exe") or shutil.which("mysql")
    if dump_on_path and client_on_path:
        candidates.append(Path(dump_on_path).resolve().parent)

    program_roots = {os.environ.get("ProgramFiles"), os.environ.get("ProgramFiles(x86)")}
    for program_root in filter(None, program_roots):
        mysql_root = Path(program_root) / "MySQL"
        if not mysql_root.is_dir():
            continue
        candidates.extend(
            entry / "bin" for entry in mysql_root.iterdir()
            if entry.is_dir() and entry.name.startswith("MySQL Server ")
        )
    for directory in candidates:
        dump = directory / "mysqldump.exe"
        client = directory / "mysql.exe"
        if dump.is_file() and client.is_file():
            return dump, client
    raise ValueError("MySQL 8.0/8.4 の mysqldump.exe と mysql.exe が見つかりません。")


def connect_admin():
    for attempt in range(3):
        user = input("MySQL管理者名（Enter=root）: ").strip() or "root"
        if not re.fullmatch(r"[A-Za-z0-9_]{1,32}", user):
            print("管理者名は英数字とアンダースコアで入力してください。", flush=True)
            continue
        password = getpass.getpass(f"MySQL管理者 {user} のパスワード（画面には表示されません）: ")
        try:
            connection = pymysql.connect(host=HOST, port=PORT, user=user, password=password,
                                          autocommit=True, connect_timeout=5, read_timeout=15,
                                          write_timeout=15, charset="utf8mb4")
            return connection, user, password
        except pymysql.MySQLError as error:
            print(safe_error(error), flush=True)
            if error.args[0] != 1045 or attempt == 2:
                break
    raise ValueError("既存MySQLへの管理者認証に失敗しました。DBは変更していません。")


def list_schemas(connection) -> set[str]:
    expected = {name for item in DATABASES.values() for name in item["sources"]}
    expected |= {item["target"] for item in DATABASES.values()}
    placeholders = ",".join(["%s"] * len(expected))
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME IN ({placeholders})",
                       tuple(sorted(expected)))
        return {row[0] for row in cursor.fetchall()}


def database_objects(connection, database: str) -> list[tuple[str, str]]:
    with connection.cursor() as cursor:
        cursor.execute("SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA=%s "
                       "ORDER BY TABLE_NAME", (database,))
        return [(row[0], row[1]) for row in cursor.fetchall()]


def row_counts(connection, database: str, objects: list[tuple[str, str]]) -> dict[str, int]:
    result = {}
    with connection.cursor() as cursor:
        for name, kind in objects:
            if kind != "BASE TABLE":
                continue
            cursor.execute(f"SELECT COUNT(*) FROM `{database}`.`{name}`")
            result[name] = int(cursor.fetchone()[0])
    return result


def ensure_empty_target(connection, target: str) -> None:
    objects = database_objects(connection, target)
    if objects:
        raise ValueError(f"移行先 {target} に既存オブジェクトがあります。上書きせず停止しました。")


def cli_error(result: subprocess.CompletedProcess, password: str) -> str:
    message = result.stderr.decode("utf-8", errors="replace").strip()
    if password:
        message = message.replace(password, "[REDACTED]")
    if not message:
        message = f"終了コード {result.returncode}"
    return message[:1500]


def backup_and_copy(connection, admin_user: str, admin_password: str, source: str, target: str,
                    target_exists: bool, dump_executable: Path, mysql_executable: Path,
                    backup_directory: Path) -> dict:
    backup_directory.mkdir(parents=True, exist_ok=True)
    source_objects = database_objects(connection, source)
    if not source_objects:
        raise ValueError(f"移行元 {source} にテーブルまたはビューがありません。")
    source_counts = row_counts(connection, source, source_objects)
    backup_path = backup_directory / f"{source}.sql"
    secret_environment = os.environ.copy()
    secret_environment["MYSQL_PWD"] = admin_password
    # The installed MySQL clients do not support --no-login-paths. Point the
    # remaining login-path lookup at a unique, absent file instead.
    login_path_file = backup_directory / ".isolated-login-path.cnf"
    if login_path_file.exists():
        raise ValueError("隔離用ログイン設定ファイルが既に存在します。安全のため停止しました。")
    secret_environment["MYSQL_TEST_LOGIN_FILE"] = str(login_path_file)
    options = ["--no-defaults", "--protocol=TCP", f"--host={HOST}", f"--port={PORT}",
               f"--user={admin_user}", "--default-character-set=utf8mb4"]
    dump_args = [str(dump_executable), *options, "--single-transaction", "--hex-blob", "--routines", "--events",
                 "--triggers", "--set-gtid-purged=OFF", "--no-tablespaces", "--column-statistics=0", source]
    with backup_path.open("xb") as backup_file:
        result = subprocess.run(dump_args, env=secret_environment, stdout=backup_file, stderr=subprocess.PIPE,
                                 timeout=300, check=False)
    if result.returncode or backup_path.stat().st_size == 0:
        raise ValueError(f"{source} のバックアップに失敗しました: {cli_error(result, admin_password)}。"
                         f"バックアップフォルダー: {backup_directory}")

    if not target_exists:
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE `{target}` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci")
    import_args = [str(mysql_executable), *options, f"--database={target}"]
    with backup_path.open("rb") as backup_file:
        result = subprocess.run(import_args, env=secret_environment, stdin=backup_file, stdout=subprocess.DEVNULL,
                                stderr=subprocess.PIPE, timeout=300, check=False)
    if result.returncode:
        raise ValueError(f"{source} から {target} への複製に失敗しました: "
                         f"{cli_error(result, admin_password)}。元DBとバックアップは保持しています。")

    target_objects = database_objects(connection, target)
    if source_objects != target_objects:
        raise ValueError(f"{source} と {target} のテーブル・ビュー構成が一致しません。")
    target_counts = row_counts(connection, target, target_objects)
    if source_counts != target_counts:
        raise ValueError(f"{source} と {target} の行数が一致しません。")
    return {"source": source, "target": target, "objects": len(source_objects), "row_counts": source_counts,
            "backup": str(backup_path)}


def map_owner_ids(connection, database: str, legacy_owners: tuple[str, ...], new_owner: str) -> int:
    with connection.cursor() as cursor:
        cursor.execute("SELECT TABLE_NAME FROM information_schema.COLUMNS "
                       "WHERE TABLE_SCHEMA=%s AND COLUMN_NAME='owner_id'", (database,))
        tables = [row[0] for row in cursor.fetchall()]
        changed = 0
        for table in tables:
            for old_owner in legacy_owners:
                cursor.execute(f"UPDATE `{database}`.`{table}` SET owner_id=%s WHERE owner_id=%s",
                               (new_owner, old_owner))
                changed += cursor.rowcount
        return changed


def ensure_application_user(connection, config: dict) -> None:
    user = config["user"]
    database = config["database"]
    password = config["password"]
    if not re.fullmatch(r"[A-Za-z0-9_]{1,32}", user) or not re.fullmatch(r"[A-Za-z0-9_]{1,64}", database):
        raise ValueError("Kusakari Canvas のMySQLユーザー名またはDB名が不正です。")
    with connection.cursor() as cursor:
        for host in ("localhost", "127.0.0.1"):
            cursor.execute("SELECT COUNT(*) FROM mysql.user WHERE User=%s AND Host=%s", (user, host))
            exists = cursor.fetchone()[0] > 0
            if exists:
                cursor.execute(f"ALTER USER `{user}`@`{host}` IDENTIFIED BY %s", (password,))
            else:
                cursor.execute(f"CREATE USER `{user}`@`{host}` IDENTIFIED BY %s", (password,))
            cursor.execute(f"GRANT ALL PRIVILEGES ON `{database}`.* TO `{user}`@`{host}`")


def apply_profile(connection, profile: str) -> dict:
    os.environ["KUSAKARI_CANVAS_PROFILE"] = profile
    settings = Settings.from_env()
    prefix = "KUSAKARI_CANVAS_E2E_DB_" if profile == "e2e" else "KUSAKARI_CANVAS_DB_"
    config = {
        "profile": profile,
        "prefix": prefix,
        "host": HOST,
        "port": PORT,
        "database": DATABASES[profile]["target"],
        "user": settings.database_url.username,
        "password": settings.database_url.password,
        "url": f"mysql://{HOST}:{PORT}/{DATABASES[profile]['target']}",
    }
    if settings.database_url.database != config["database"] or settings.database_url.host != HOST \
            or settings.database_url.port != PORT or not config["user"] or not config["password"]:
        raise ValueError(f"{prefix} の設定が移行先DBと一致しません。")
    ensure_application_user(connection, config)
    os.environ["KUSAKARI_CANVAS_PROFILE"] = profile
    os.environ[prefix + "URL"] = config["url"]
    settings = Settings.from_env()
    result = migrate(settings)
    return {"database": result["database"], "revision": result["revision"], "backup": result["backup"]}


def main() -> int:
    dump_executable, mysql_executable = mysql_tools()
    connection, admin_user, admin_password = connect_admin()
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ") + "-" + secrets.token_hex(4)
    backup_directory = canvas_data_home() / "backups" / f"identity-migration-{stamp}"
    report = {"time": datetime.now(UTC).isoformat(), "result": "failed", "profiles": []}
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()[0]
            if "MariaDB" in version or not re.match(r"^8\.(0|4)\.", version):
                raise ValueError("既存MySQLは8.0/8.4が必要です。データベースは変更していません。")
        schemas = list_schemas(connection)
        print("確認した対象DB名: " + ", ".join(sorted(schemas)), flush=True)
        if not any(name in schemas for name in DATABASES["dev"]["sources"] + (DATABASES["dev"]["target"],)):
            raise ValueError("開発用の旧DBまたは移行先DBがありません。対象DBは作成していません。")

        backup_directory.mkdir(parents=True, exist_ok=False)
        for profile, specification in DATABASES.items():
            found_sources = [name for name in specification["sources"] if name in schemas]
            if len(found_sources) > 1:
                raise ValueError(f"{profile} の旧DBが複数あります: {', '.join(found_sources)}。統合元を特定してから実行してください。")
            source = found_sources[0] if found_sources else None
            target = specification["target"]
            target_exists = target in schemas
            if target_exists:
                ensure_empty_target(connection, target)
            elif source is None:
                if profile == "e2e":
                    with connection.cursor() as cursor:
                        cursor.execute(f"CREATE DATABASE `{target}` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci")
                    target_exists = True
                else:
                    raise ValueError("開発用の移行元DBが見つかりません。")

            copied = None
            if source is not None:
                copied = backup_and_copy(connection, admin_user, admin_password, source, target,
                                         target_exists, dump_executable, mysql_executable, backup_directory)
                updated_owners = map_owner_ids(connection, target, specification["legacy_owners"],
                                               specification["owner"])
            else:
                updated_owners = 0
            migration = apply_profile(connection, profile)
            report["profiles"].append({"profile": profile, "copy": copied, "owner_ids_updated": updated_owners,
                                       "schema_migration": migration})
            print(f"{profile}: Kusakari Canvas DBとスキーマを確認しました。", flush=True)

        report["result"] = "passed"
        report["backup_directory"] = str(backup_directory)
        report_path = backup_directory / "migration-report.json"
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"データ移行と検証が完了しました。バックアップ: {backup_directory}", flush=True)
        return 0
    except Exception as error:
        report["error"] = safe_error(error) if isinstance(error, pymysql.MySQLError) else str(error)
        report["backup_directory"] = str(backup_directory) if backup_directory.exists() else None
        print(f"移行を完了できませんでした: {report['error']}", file=sys.stderr, flush=True)
        if backup_directory.exists():
            (backup_directory / "migration-report.json").write_text(
                json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        return 1
    finally:
        connection.close()


if __name__ == "__main__":
    raise SystemExit(main())
