import base64
import copy
import io
import json
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4

from PIL import Image
from sqlalchemy import text

from greenly_api.database import create_database_engine


def request(base: str, method: str, path: str, data=None, *, raw: bytes | None = None):
    body = raw if raw is not None else (json.dumps(data).encode() if data is not None else None)
    req = Request(base + path, data=body, method=method, headers={"Content-Type": "application/json"})
    try:
        response = urlopen(req, timeout=15)
    except HTTPError as error:
        response = error
    with response:
        content = response.read()
        return response.status, json.loads(content) if content else None, {k.lower(): v for k, v in response.headers.items()}


def photo(format: str) -> dict:
    image = Image.new("RGB", (80, 60), "#748b53")
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    corners = [{"x": 0.1, "y": 0.9}, {"x": 0.9, "y": 0.9},
               {"x": 0.9, "y": 0.1}, {"x": 0.1, "y": 0.1}]
    return {"dataUrl": f"data:image/{'png' if format == 'PNG' else 'jpeg'};base64,"
            + base64.b64encode(buffer.getvalue()).decode(), "imageWidth": 80, "imageHeight": 60,
            "corners": corners, "boundary": copy.deepcopy(corners)}


def placed(id: str | None = None) -> dict:
    return {"id": id or str(uuid4()), "assetId": "tree_oak", "position": {"x": 0, "y": 0, "z": 0},
            "rotation": {"x": 0, "y": 7.853981633974483, "z": 0}, "scale": {"x": 1, "y": 1, "z": 1}}


def verify_api(base: str, settings) -> list[str]:
    engine = create_database_engine(settings)
    ids = []
    checks = []

    def create():
        status, doc, headers = request(base, "POST", "/api/gardens",
                                       {"name": "  FastAPI verification  ", "width": 10, "depth": 8})
        assert status == 201
        ids.append(doc["id"])
        assert headers["location"] == "/api/gardens/" + doc["id"]
        assert doc["photo"] is None and doc["revision"] == 0 and doc["name"] == "FastAPI verification"
        return doc

    def get(id):
        status, doc, _ = request(base, "GET", "/api/gardens/" + id)
        assert status == 200
        return doc

    def save(doc):
        status, stored, _ = request(base, "PUT", "/api/gardens/" + doc["id"], doc)
        assert status == 200
        return stored

    def reject(doc, code, status=400):
        before = get(doc["id"])
        actual, error, _ = request(base, "PUT", "/api/gardens/" + doc["id"], doc)
        assert actual == status and error["code"] == code
        assert set(error) == {"status", "code", "message"}
        assert get(doc["id"]) == before

    try:
        status, assets, headers = request(base, "GET", "/api/assets")
        assert status == 200 and headers["x-greenly-backend"] == "fastapi"
        assert [a["id"] for a in assets] == sorted(a["id"] for a in assets)
        assert {a["id"] for a in assets} >= {"tree_oak", "shrub_boxwood", "brick_paver", "bench_wood"}
        for a in assets:
            assert set(a) == {"id", "name", "category", "modelUrl", "baseDimensions"}
        for method, path, status, code in [("GET", "/missing", 404, "NOT_FOUND"),
                                            ("PATCH", "/api/gardens", 405, "METHOD_NOT_ALLOWED")]:
            actual, error, _ = request(base, method, path)
            assert actual == status and error["code"] == code
        invalid_creates = [{"name": "x", "width": 51, "depth": 8},
                           {"name": " ", "width": 10, "depth": 8},
                           {"name": "x", "width": 10, "depth": 8, "ownerId": "client-owner"}]
        for payload in invalid_creates:
            status, error, _ = request(base, "POST", "/api/gardens", payload)
            assert status == 400 and error["code"] == "INVALID_REQUEST"
        assert request(base, "POST", "/api/gardens", raw=b'{"broken"')[0] == 400
        checks.append("HTTP CRUD envelope / 201 Location / 400 unknown-field and malformed JSON / 404 / 405")

        garden = create()
        id = garden["id"]
        garden["objects"] = [placed()]
        for format in ("PNG", "JPEG"):
            garden["photo"] = photo(format)
            garden = save(garden)
            assert get(id) == garden
        checks.append("PNG and JPEG photo byte-preserving roundtrip with objects and accumulated rotation")
        invalids = []
        for change, code in [(lambda d: d.update(width=51), "INVALID_REQUEST"),
                             (lambda d: d.update(extra=True), "INVALID_REQUEST"),
                             (lambda d: d["objects"][0].update(id="invalid"), "INVALID_OBJECT_ID"),
                             (lambda d: d["objects"][0].update(assetId="unknown"), "UNKNOWN_ASSET"),
                             (lambda d: d["objects"][0]["position"].update(x=6), "OBJECT_POSITION_OUT_OF_BOUNDS"),
                             (lambda d: d["objects"][0]["rotation"].update(x=1), "INVALID_OBJECT_ROTATION"),
                             (lambda d: d["objects"][0]["scale"].update(y=2), "INVALID_OBJECT_SCALE"),
                             (lambda d: d["photo"].update(dataUrl="data:image/png;base64,invalid"), "INVALID_PHOTO"),
                             (lambda d: d["photo"].update(imageWidth=79), "INVALID_PHOTO"),
                             (lambda d: d["photo"].update(imageWidth=6001), "INVALID_PHOTO"),
                             (lambda d: d["photo"].update(corners=list(reversed(d["photo"]["corners"]))),
                              "INVALID_PHOTO_CORNERS"),
                             (lambda d: d["photo"]["boundary"][0].update(x=0), "INVALID_PHOTO_BOUNDARY")]:
            invalid = copy.deepcopy(garden)
            change(invalid)
            invalids.append((invalid, code))
        invalid = copy.deepcopy(garden)
        duplicate = copy.deepcopy(invalid["objects"][0])
        duplicate["id"] = duplicate["id"].upper()
        invalid["objects"].append(duplicate)
        invalids.append((invalid, "DUPLICATE_OBJECT_ID"))
        invalid = copy.deepcopy(garden)
        invalid["photo"]["boundary"] = [{"x": .2, "y": .2}, {"x": .8, "y": .8},
                                           {"x": .2, "y": .8}, {"x": .8, "y": .2}]
        invalids.append((invalid, "INVALID_PHOTO_BOUNDARY"))
        for invalid, code in invalids:
            reject(invalid, code)
        mismatched = copy.deepcopy(garden)
        mismatched["id"] = str(uuid4())
        status, error, _ = request(base, "PUT", "/api/gardens/" + id, mismatched)
        assert status == 400 and error["code"] == "GARDEN_ID_MISMATCH"
        assert get(id) == garden
        checks.append("Validation matrix rejects invalid geometry/photo/UUID/asset/fields without modifying saved state")

        competing = copy.deepcopy(garden)
        with ThreadPoolExecutor(max_workers=2) as pool:
            futures = [pool.submit(request, base, "PUT", "/api/gardens/" + id, competing) for _ in range(2)]
            results = [f.result() for f in futures]
        assert sorted(r[0] for r in results) == [200, 409]
        assert next(r[1]["code"] for r in results if r[0] == 409) == "REVISION_CONFLICT"
        garden = get(id)
        assert garden["revision"] == competing["revision"] + 1
        checks.append("Concurrent same-revision PUT: one commit, one 409 (real MySQL row lock)")

        other = create()
        other["objects"] = [placed()]
        other = save(other)
        broken = copy.deepcopy(garden)
        broken["name"] = "must rollback"
        broken["photo"] = None
        broken["objects"] = copy.deepcopy(other["objects"])
        reject(broken, "STORAGE_CONFLICT", 409)
        checks.append("Foreign garden object PK collision rolls back name, revision, photo, and object deletion")

        foreign_id = str(uuid4())
        ids.append(foreign_id)
        with engine.begin() as connection:
            connection.execute(text("INSERT INTO gardens (id,owner_id,name,width,depth,revision,updated_at) "
                                    "VALUES (:id,'verification-other-owner','foreign',10,8,0,:now)"),
                               {"id": foreign_id, "now": datetime.now(UTC).replace(tzinfo=None)})
        foreign = copy.deepcopy(garden)
        foreign.update(id=foreign_id, revision=0)
        for method, data in [("GET", None), ("PUT", foreign), ("DELETE", None)]:
            status, error, _ = request(base, method, "/api/gardens/" + foreign_id, data)
            assert status == 404 and error["code"] == "GARDEN_NOT_FOUND"
        listed = request(base, "GET", "/api/gardens")[1]
        assert foreign_id not in {g["id"] for g in listed}
        assert all(g["updatedAt"].endswith("Z") for g in listed)
        checks.append("Owner-scoped list/get/put/delete and UTC summary timestamps")

        garden.pop("photo")
        garden = save(garden)
        assert get(id)["photo"] is None
        with engine.begin() as connection:
            connection.execute(text("UPDATE gardens SET revision=9223372036854775807 WHERE id=:id"), {"id": id})
        reject(get(id), "REVISION_EXHAUSTED", 409)
        assert request(base, "DELETE", "/api/gardens/" + id)[:2] == (204, None)
        assert request(base, "GET", "/api/gardens/" + id)[0] == 404
        with engine.connect() as connection:
            assert connection.scalar(text("SELECT COUNT(*) FROM placed_objects WHERE garden_id=:id"), {"id": id}) == 0
        checks.append("Optional photo removal / BIGINT revision exhaustion / 204 delete cascade / reload 404")
        return checks
    finally:
        with engine.begin() as connection:
            for id in ids:
                connection.execute(text("DELETE FROM gardens WHERE id=:id"), {"id": id})
        engine.dispose()
