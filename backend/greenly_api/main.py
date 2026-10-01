import logging
from collections.abc import Generator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker
from starlette.exceptions import HTTPException

from . import service
from .config import Settings
from .database import create_database_engine
from .errors import ApiError
from .migrations import HEAD, current_revision, validate_schema
from .schemas import AssetResponse, CreateGardenRequest, GardenDocument, GardenDocumentRequest, GardenSummary


def error_response(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"status": status, "code": code, "message": message})


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    engine = create_database_engine(settings)
    sessions = sessionmaker(engine, expire_on_commit=False)

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        try:
            with engine.connect() as connection:
                validate_schema(connection, "0002")
                if current_revision(connection) != HEAD:
                    raise ValueError("Run npm run migrate:api before starting the API directly.")
            yield
        finally:
            engine.dispose()

    app = FastAPI(title="Greenly API", version="0.2.0", lifespan=lifespan, redirect_slashes=False)

    @app.middleware("http")
    async def backend_identity(request, call_next):
        try:
            response = await call_next(request)
        except Exception as error:
            logging.getLogger(__name__).error("API operation failed: %s", type(error).__name__)
            response = error_response(500, "INTERNAL_ERROR", "サーバーでエラーが発生しました。")
        response.headers["X-Greenly-Backend"] = "fastapi"
        return response

    @app.exception_handler(ApiError)
    async def domain_error(_request, error: ApiError):
        return error_response(error.status, error.code, error.message)

    @app.exception_handler(RequestValidationError)
    async def invalid_request(_request, _error):
        return error_response(400, "INVALID_REQUEST", "リクエストの形式または値が不正です。")

    @app.exception_handler(HTTPException)
    async def http_error(_request, error: HTTPException):
        if error.status_code == 405:
            response = error_response(405, "METHOD_NOT_ALLOWED", "このHTTPメソッドは利用できません。")
        else:
            response = error_response(404, "NOT_FOUND", "要求されたリソースが見つかりません。")
        if error.headers:
            response.headers.update(error.headers)
        return response

    @app.exception_handler(IntegrityError)
    async def storage_conflict(_request, _error):
        return error_response(409, "STORAGE_CONFLICT", "保存データが競合しました。最新の庭を取得してください。")

    @app.exception_handler(Exception)
    async def unexpected_error(_request, error):
        logging.getLogger(__name__).error("API operation failed: %s", type(error).__name__)
        return error_response(500, "INTERNAL_ERROR", "サーバーでエラーが発生しました。")

    def get_session() -> Generator[Session, None, None]:
        with sessions() as session:
            yield session

    Db = Annotated[Session, Depends(get_session)]

    @app.get("/api/assets", response_model=list[AssetResponse])
    def assets(db: Db):
        return service.list_assets(db)

    @app.get("/api/gardens", response_model=list[GardenSummary])
    def gardens(db: Db):
        return service.list_gardens(db, settings.owner_id)

    @app.post("/api/gardens", status_code=201, response_model=GardenDocument)
    def create(request: CreateGardenRequest, response: Response, db: Db):
        garden = service.create_garden(db, settings.owner_id, request)
        response.headers["Location"] = f"/api/gardens/{garden.id}"
        return garden

    @app.get("/api/gardens/{id}", response_model=GardenDocument)
    def get(id: str, db: Db):
        return service.get_garden(db, settings.owner_id, id)

    @app.put("/api/gardens/{id}", response_model=GardenDocument)
    def update(id: str, request: GardenDocumentRequest, db: Db):
        return service.update_garden(db, settings.owner_id, id, request)

    @app.delete("/api/gardens/{id}", status_code=204)
    def delete(id: str, db: Db):
        service.delete_garden(db, settings.owner_id, id)
        return Response(status_code=204)

    return app
