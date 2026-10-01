import argparse
import hashlib
import json
from pathlib import Path

from sqlalchemy import text

from greenly_api.config import REPO_ROOT, Settings
from greenly_api.database import create_database_engine

from .verify_api import request


def main() -> None:
    parser = argparse.ArgumentParser(description="Read-only comparison of development DB and migrated API")
    parser.add_argument("--baseline", type=Path, required=True)
    parser.add_argument("--base-url", default="http://127.0.0.1:8080")
    args = parser.parse_args()
    settings = Settings.from_env()
    if settings.profile != "dev":
        raise ValueError("This preservation check targets dev in read-only mode.")
    engine = create_database_engine(settings)
    output = REPO_ROOT / "artifacts/fastapi"
    output.mkdir(parents=True, exist_ok=True)
    try:
        with engine.connect() as connection:
            stats = {}
            for table in ("assets", "gardens", "placed_objects", "flyway_schema_history"):
                rows = [dict(row) for row in connection.execute(text(f"SELECT * FROM {table} ORDER BY 1")).mappings()]
                digest = hashlib.sha256(json.dumps(rows, ensure_ascii=False, default=str, sort_keys=True)
                                        .encode()).hexdigest()
                stats[table] = {"rows": len(rows), "sha256": digest}
            baseline = json.loads(args.baseline.read_text(encoding="utf-8"))
            assert stats == baseline, "Development data changed since the baseline"
            count = 0
            for garden in connection.execute(text("SELECT * FROM gardens WHERE owner_id=:owner"),
                                              {"owner": settings.owner_id}).mappings():
                status, doc, headers = request(args.base_url, "GET", "/api/gardens/" + garden["id"])
                assert status == 200 and headers["x-greenly-backend"] == "fastapi"
                assert doc["schemaVersion"] == 1
                assert all(doc[key] == garden[key] for key in ("id", "revision", "name", "width", "depth"))
                assert doc["photo"] == (json.loads(garden["photo_json"]) if garden["photo_json"] else None)
                objects = list(connection.execute(text(
                    "SELECT * FROM placed_objects WHERE garden_id=:id ORDER BY id"), {"id": garden["id"]}).mappings())
                assert len(objects) == len(doc["objects"])
                for obj, row in zip(doc["objects"], objects, strict=True):
                    assert obj["id"] == row["id"] and obj["assetId"] == row["asset_id"]
                    assert all(obj[kind][axis] == row[kind + "_" + axis]
                               for kind in ("position", "rotation", "scale") for axis in "xyz")
                count += 1
        report = {"result": "passed", "backend": "fastapi", "business_tables_unchanged": True,
                  "tables": stats, "gardens_checked": count, "photo_and_object_roundtrip": True,
                  "writes_performed": 0}
        (output / "development-data-preservation.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(json.dumps({"result": "passed", "gardens_checked": count, "writes": 0}))
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
