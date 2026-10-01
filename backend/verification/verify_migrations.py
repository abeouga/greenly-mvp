import hashlib
import json
from dataclasses import replace
from uuid import uuid4

from sqlalchemy import inspect, text

from greenly_api.config import BACKEND_ROOT
from greenly_api.database import create_database_engine
from greenly_api.migrations import current_revision, migrate, validate_schema


def data_digest(connection) -> str:
    rows = {table: [dict(r) for r in connection.execute(text(f"SELECT * FROM {table} ORDER BY 1")).mappings()]
            for table in ("assets", "gardens", "placed_objects", "flyway_schema_history")
            if table in inspect(connection).get_table_names()}
    return hashlib.sha256(json.dumps(rows, default=str, sort_keys=True).encode()).hexdigest()


def legacy_fixture(connection, version: int) -> None:
    files = ["V1__create_garden_tables_and_seed_assets.sql", "V2__garden_photo.sql"]
    for filename in files[:version]:
        source = (BACKEND_ROOT / "alembic/sql" / filename).read_text(encoding="utf-8-sig")
        for sql in source.split(";"):
            if sql.strip():
                connection.execute(text(sql.strip()))
    connection.execute(text("CREATE TABLE flyway_schema_history (installed_rank INT NOT NULL PRIMARY KEY, "
                            "version VARCHAR(50), type VARCHAR(20) NOT NULL, success BOOLEAN NOT NULL) ENGINE=InnoDB"))
    for rank in range(1, version + 1):
        connection.execute(text("INSERT INTO flyway_schema_history VALUES (:rank,:version,'SQL',true)"),
                           {"rank": rank, "version": str(rank)})
    connection.execute(text("INSERT INTO gardens (id,owner_id,name,width,depth,revision,updated_at) "
                            "VALUES (:id,'greenly-e2e-demo','migration sentinel',10,8,7,'2026-01-01 00:00:00.123456')"),
                       {"id": "12345678-1234-4321-8321-123456789012"})
    if version == 2:
        connection.execute(text("UPDATE gardens SET photo_json='{}'"))
    connection.commit()


def verify_migrations(settings) -> list[dict]:
    admin = create_database_engine(settings)
    results = []
    # Only databases created successfully by this invocation can be removed.
    created = []
    try:
        for scenario in ("fresh", "v1", "v2", "mismatch", "failed_history"):
            name = f"greenly_e2e_migration_{uuid4().hex[:12]}"
            with admin.connect() as connection:
                connection.execute(text(f"CREATE DATABASE `{name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"))
                created.append(name)
            fixture = replace(settings, database_url=settings.database_url.set(database=name))
            engine = create_database_engine(fixture)
            try:
                before = None
                if scenario != "fresh":
                    with engine.connect() as connection:
                        legacy_fixture(connection, 2 if scenario == "v2" else 1)
                        if scenario == "mismatch":
                            connection.execute(text("ALTER TABLE gardens MODIFY width INT NOT NULL"))
                        if scenario == "failed_history":
                            connection.execute(text("UPDATE flyway_schema_history SET success=false"))
                        connection.commit()
                        before = data_digest(connection)
                if scenario in {"mismatch", "failed_history"}:
                    try:
                        migrate(fixture)
                    except ValueError:
                        pass
                    else:
                        raise AssertionError("Unsafe schema/history was adopted")
                    with engine.connect() as connection:
                        assert "alembic_version" not in inspect(connection).get_table_names()
                        assert data_digest(connection) == before
                    results.append({"scenario": scenario, "result": "rejected before stamp/DDL"})
                else:
                    result = migrate(fixture)
                    with engine.connect() as connection:
                        validate_schema(connection, "0002")
                        assert current_revision(connection) == "0002"
                        if scenario == "v2":
                            assert data_digest(connection) == before
                        if scenario == "v1":
                            row = connection.execute(text("SELECT revision,photo_json FROM gardens")).one()
                            assert tuple(row) == (7, None)
                        if scenario == "fresh":
                            assert connection.scalar(text("SELECT COUNT(*) FROM assets")) == 4
                        preserved = data_digest(connection)
                    second = migrate(fixture)
                    assert second["previous"] == "0002" and second["backup"] is None
                    with engine.connect() as connection:
                        assert data_digest(connection) == preserved
                    results.append({"scenario": scenario, "result": "passed", "backup": bool(result["backup"]),
                                    "repeat_start_preserved": True})
            finally:
                engine.dispose()
        return results
    finally:
        with admin.connect() as connection:
            for name in created:
                if not name.startswith("greenly_e2e_migration_") or len(name) != 34:
                    raise RuntimeError("Unsafe test database cleanup name")
                connection.execute(text(f"DROP DATABASE `{name}`"))
        admin.dispose()
