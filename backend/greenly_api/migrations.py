import os
import re
import shutil
import subprocess
from datetime import UTC, datetime
from pathlib import Path

from alembic.config import Config
from sqlalchemy import Connection, inspect, text

from alembic import command

from .config import BACKEND_ROOT, Settings
from .database import create_database_engine
from .models import Base

HEAD = "0002"


def type_signature(value, dialect) -> str:
    # MySQL may report legacy integer display widths (e.g. BIGINT(20)).
    compiled = value.compile(dialect=dialect).upper().replace(" ", "")
    return re.sub(r"\b(BIGINT|INTEGER|INT)\(\d+\)", r"\1", compiled)


def validate_schema(connection: Connection, revision: str) -> None:
    if revision not in {"0001", HEAD}:
        raise ValueError("Unknown Greenly schema revision; migration stopped.")
    inspector = inspect(connection)
    names = set(inspector.get_table_names())
    allowed = set(Base.metadata.tables) | {"flyway_schema_history", "alembic_version"}
    if not set(Base.metadata.tables) <= names or names - allowed:
        raise ValueError("Database tables do not match the Greenly schema; migration stopped.")
    for table in Base.metadata.sorted_tables:
        expected = {c.name: c for c in table.columns if not (
            revision == "0001" and table.name == "gardens" and c.name == "photo_json")}
        actual = {c["name"]: c for c in inspector.get_columns(table.name)}
        if set(expected) != set(actual):
            raise ValueError(f"Schema column mismatch: {table.name}; migration stopped.")
        for name, column in expected.items():
            found = actual[name]
            if type_signature(column.type, connection.dialect) != type_signature(found["type"], connection.dialect) \
                    or bool(column.nullable) != bool(found["nullable"]):
                raise ValueError(f"Schema type/nullability mismatch: {table.name}.{name}; migration stopped.")
        if inspector.get_pk_constraint(table.name)["constrained_columns"] != [c.name for c in table.primary_key]:
            raise ValueError(f"Schema primary key mismatch: {table.name}; migration stopped.")
        indexes = {i["name"]: (i["column_names"], bool(i["unique"])) for i in inspector.get_indexes(table.name)}
        expected_indexes = {i.name: ([c.name for c in i.columns], bool(i.unique)) for i in table.indexes}
        # InnoDB automatically creates the supporting index for the asset foreign key.
        for name, signature in expected_indexes.items():
            if indexes.get(name) != signature:
                raise ValueError(f"Schema index mismatch: {table.name}.{name}; migration stopped.")
        if any(unique for _columns, unique in indexes.values()):
            raise ValueError(f"Unexpected unique index: {table.name}; migration stopped.")
        options = inspector.get_table_options(table.name)
        if options.get("mysql_engine", "").lower() != "innodb":
            raise ValueError(f"Nontransactional table: {table.name}; migration stopped.")
        actual_fks = {(tuple(f["constrained_columns"]), f["referred_table"], tuple(f["referred_columns"]),
                       f.get("options", {}).get("ondelete", "").upper())
                      for f in inspector.get_foreign_keys(table.name)}
        expected_fks = {(tuple(f.parent.name for f in fk.elements), fk.referred_table.name,
                         tuple(f.column.name for f in fk.elements), (fk.ondelete or "").upper())
                        for fk in table.foreign_key_constraints}
        if actual_fks != expected_fks:
            raise ValueError(f"Schema foreign key mismatch: {table.name}; migration stopped.")


def current_revision(connection: Connection) -> str | None:
    if "alembic_version" not in inspect(connection).get_table_names():
        return None
    rows = list(connection.scalars(text("SELECT version_num FROM alembic_version")))
    if len(rows) != 1 or rows[0] not in {"0001", HEAD}:
        raise ValueError("Alembic history is empty, branched, or unsupported; migration stopped.")
    return rows[0]


def legacy_revision(connection: Connection) -> str:
    if "flyway_schema_history" not in inspect(connection).get_table_names():
        raise ValueError("Existing schema has no known migration history; migration stopped.")
    rows = list(connection.execute(text(
        "SELECT version, type, success FROM flyway_schema_history ORDER BY installed_rank")).mappings())
    versions = [str(row["version"]) for row in rows]
    if versions not in (["1"], ["1", "2"]) or any(not r["success"] or r["type"] != "SQL" for r in rows):
        raise ValueError("Flyway history does not match V1/V2; migration stopped.")
    revision = "0001" if versions == ["1"] else HEAD
    validate_schema(connection, revision)
    return revision


def backup_database(settings: Settings) -> Path:
    executable = shutil.which("mysqldump")
    if executable is None:
        candidate = Path(os.environ.get("ProgramFiles", "C:/Program Files")) \
            / "MySQL/MySQL Server 8.0/bin/mysqldump.exe"
        executable = str(candidate) if candidate.is_file() else None
    if executable is None:
        raise ValueError("mysqldump is required before changing an existing database.")
    settings.backup_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%fZ")
    path = settings.backup_dir / f"{settings.database_url.database}-{stamp}.sql"
    env = os.environ.copy()
    env["MYSQL_PWD"] = settings.database_url.password or ""
    args = [executable, "--single-transaction", "--hex-blob", "--set-gtid-purged=OFF", "--no-tablespaces",
            "--column-statistics=0", "--default-character-set=utf8mb4", "--protocol=TCP",
            f"--host={settings.database_url.host}", f"--port={settings.database_url.port}",
            f"--user={settings.database_url.username}", settings.database_url.database]
    with path.open("xb") as output:
        result = subprocess.run(args, env=env, stdout=output, stderr=subprocess.PIPE, timeout=120, check=False)
    if result.returncode or path.stat().st_size == 0:
        path.unlink(missing_ok=True)
        raise ValueError("Database backup failed; no migration was started. Check mysqldump permissions.")
    return path


def alembic_config(connection: Connection) -> Config:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    config.attributes["connection"] = connection
    return config


def migrate(settings: Settings) -> dict:
    engine = create_database_engine(settings)
    backup = None
    try:
        with engine.connect() as lock_connection:
            lock_name = "greenly_migrate_" + settings.database_url.database
            if lock_connection.scalar(text("SELECT GET_LOCK(:name, 30)"), {"name": lock_name}) != 1:
                raise ValueError("Another schema migration is running; migration stopped.")
            try:
                with engine.connect() as connection:
                    tables = set(inspect(connection).get_table_names())
                    revision = current_revision(connection)
                    adopted = False
                    if not tables:
                        previous = "empty"
                    elif revision is not None:
                        validate_schema(connection, revision)
                        previous = revision
                    else:
                        revision = legacy_revision(connection)
                        previous = "flyway_" + revision
                        adopted = True
                    if tables and (adopted or revision != HEAD):
                        backup = backup_database(settings)
                    connection.commit()
                    config = alembic_config(connection)
                    if adopted:
                        command.stamp(config, revision)
                        connection.commit()
                    command.upgrade(config, "head")
                    connection.commit()
                    validate_schema(connection, HEAD)
                    if current_revision(connection) != HEAD:
                        raise ValueError("Schema migration did not reach the expected revision.")
                    return {"database": settings.database_url.database, "previous": previous, "revision": HEAD,
                            "backup": str(backup) if backup else None}
            finally:
                lock_connection.execute(text("SELECT RELEASE_LOCK(:name)"), {"name": lock_name})
    finally:
        engine.dispose()
