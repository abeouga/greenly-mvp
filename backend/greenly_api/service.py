from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .errors import ApiError, bad_request, not_found
from .models import Asset, Garden, PlacedObject
from .schemas import (
    AssetResponse,
    BaseDimensions,
    CreateGardenRequest,
    GardenDocument,
    GardenDocumentRequest,
    GardenObject,
    GardenPhoto,
    GardenSummary,
    Vector,
)
from .validation import validate_document


def owned_garden(session: Session, owner: str, id: str, *, lock: bool = False) -> Garden:
    query = select(Garden).where(Garden.id == id, Garden.owner_id == owner)
    if lock:
        query = query.with_for_update()
    garden = session.scalar(query)
    if garden is None:
        raise not_found()
    return garden


def as_document(garden: Garden, objects: list[GardenObject]) -> GardenDocument:
    return GardenDocument(id=garden.id, revision=garden.revision, name=garden.name,
                          width=garden.width, depth=garden.depth, objects=objects,
                          photo=GardenPhoto.model_validate_json(garden.photo_json) if garden.photo_json else None)


def object_response(obj: PlacedObject) -> GardenObject:
    vectors = {kind: Vector(**{axis: getattr(obj, f"{kind}_{axis}") for axis in "xyz"})
               for kind in ("position", "rotation", "scale")}
    return GardenObject(id=obj.id, assetId=obj.asset_id, **vectors)


def list_assets(session: Session) -> list[AssetResponse]:
    with session.begin():
        return [AssetResponse(id=a.id, name=a.name, category=a.category, modelUrl=a.model_url,
                              baseDimensions=BaseDimensions(width=float(a.base_width), height=float(a.base_height),
                                                            depth=float(a.base_depth)))
                for a in session.scalars(select(Asset).order_by(Asset.id))]


def list_gardens(session: Session, owner: str) -> list[GardenSummary]:
    with session.begin():
        return [GardenSummary(id=g.id, name=g.name, width=g.width, depth=g.depth, revision=g.revision,
                              updatedAt=g.updated_at.replace(tzinfo=UTC))
                for g in session.scalars(select(Garden).where(Garden.owner_id == owner)
                                         .order_by(Garden.updated_at.desc()))]


def create_garden(session: Session, owner: str, request: CreateGardenRequest) -> GardenDocument:
    with session.begin():
        garden = Garden(id=str(uuid4()), owner_id=owner, name=request.name.strip(), width=request.width,
                        depth=request.depth, revision=0, updated_at=datetime.now(UTC).replace(tzinfo=None))
        session.add(garden)
        session.flush()
        response = as_document(garden, [])
    return response


def get_garden(session: Session, owner: str, id: str) -> GardenDocument:
    with session.begin():
        garden = owned_garden(session, owner, id)
        objects = [object_response(o) for o in session.scalars(select(PlacedObject)
                   .where(PlacedObject.garden_id == garden.id).order_by(PlacedObject.id))]
        return as_document(garden, objects)


def update_garden(session: Session, owner: str, id: str, document: GardenDocumentRequest) -> GardenDocument:
    validate_document(document)
    if id != document.id:
        bad_request("GARDEN_ID_MISMATCH", "URLと保存データの庭IDが一致しません。")
    with session.begin():
        garden = owned_garden(session, owner, id, lock=True)
        if garden.revision != document.revision:
            raise ApiError(409, "REVISION_CONFLICT", "庭が別の版で更新されています。最新データを取得してください。")
        if garden.width != document.width or garden.depth != document.depth:
            bad_request("GARDEN_DIMENSIONS_IMMUTABLE", "作成済みの庭の寸法は変更できません。")
        if garden.revision == 9223372036854775807:
            raise ApiError(409, "REVISION_EXHAUSTED", "庭の版番号を更新できません。")
        asset_ids = {obj.assetId for obj in document.objects}
        known = set(session.scalars(select(Asset.id).where(Asset.id.in_(asset_ids)))) if asset_ids else set()
        if known != asset_ids:
            bad_request("UNKNOWN_ASSET", "カタログに存在しないアセットが含まれています。")
        garden.name = document.name.strip()
        garden.revision += 1
        garden.updated_at = datetime.now(UTC).replace(tzinfo=None)
        garden.photo_json = document.photo.model_dump_json() if document.photo is not None else None
        session.execute(delete(PlacedObject).where(PlacedObject.garden_id == id))
        response_objects = []
        for obj in document.objects:
            values = {f"{kind}_{axis}": getattr(getattr(obj, kind), axis)
                      for kind in ("position", "rotation", "scale") for axis in "xyz"}
            session.add(PlacedObject(id=obj.id.lower(), garden_id=id, asset_id=obj.assetId, **values))
            response_objects.append(obj.model_copy(update={"id": obj.id.lower()}))
        session.flush()
        response = as_document(garden, response_objects)
    return response


def delete_garden(session: Session, owner: str, id: str) -> None:
    with session.begin():
        session.delete(owned_garden(session, owner, id, lock=True))
        session.flush()
