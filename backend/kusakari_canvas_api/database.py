from sqlalchemy import Engine, create_engine, event

from .config import Settings


def create_database_engine(settings: Settings) -> Engine:
    engine = create_engine(settings.database_url, pool_pre_ping=True, pool_recycle=3600,
                           connect_args={"connect_timeout": 10}, hide_parameters=True)

    @event.listens_for(engine, "connect")
    def utc_session(connection, _record):
        with connection.cursor() as cursor:
            cursor.execute("SET time_zone = '+00:00'")

    return engine
