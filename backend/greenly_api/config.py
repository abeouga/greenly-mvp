import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy import URL

BACKEND_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_ROOT.parent


def load_local_settings(profile: str) -> None:
    prefix = "GREENLY_E2E_DB_" if profile == "e2e" else "GREENLY_DB_"
    path = REPO_ROOT / (".env.e2e" if profile == "e2e" else ".env")
    if not path.is_file():
        return
    allowed = {prefix + suffix for suffix in ("USER", "PASSWORD", "URL")}
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        key, sep, value = line.strip().partition("=")
        if sep and key.strip() in allowed:
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            if not os.environ.get(key.strip()):
                os.environ[key.strip()] = value


@dataclass(frozen=True)
class Settings:
    profile: str
    host: str
    port: int
    database_url: URL
    backup_dir: Path

    @property
    def owner_id(self) -> str:
        return "greenly-e2e-demo" if self.profile == "e2e" else "greenly-local-demo"

    @classmethod
    def from_env(cls) -> "Settings":
        profile = os.environ.get("GREENLY_PROFILE", "dev")
        if profile not in {"dev", "e2e"}:
            raise ValueError("GREENLY_PROFILE must be dev or e2e (local demo only).")
        load_local_settings(profile)
        host = os.environ.get("GREENLY_HOST", "127.0.0.1")
        if host != "127.0.0.1":
            raise ValueError("Local demo API must bind to 127.0.0.1.")
        prefix = "GREENLY_E2E_DB_" if profile == "e2e" else "GREENLY_DB_"
        user, password = (os.environ.get(prefix + suffix, "") for suffix in ("USER", "PASSWORD"))
        if not user or not password:
            raise ValueError(f"{prefix}USER and {prefix}PASSWORD must be configured.")
        default_db = "greenly_e2e" if profile == "e2e" else "greenly"
        address = os.environ.get(prefix + "URL", f"mysql://127.0.0.1:3306/{default_db}")
        parsed = urlparse(address.removeprefix("jdbc:"))
        if parsed.scheme not in {"mysql", "mysql+pymysql"} or not parsed.hostname:
            raise ValueError(f"{prefix}URL must be a MySQL URL.")
        database = parsed.path.lstrip("/")
        if not database or "/" in database:
            raise ValueError("MySQL database name is missing or invalid.")
        if profile == "e2e" and not database.startswith("greenly_e2e"):
            raise ValueError("E2E requires a dedicated greenly_e2e* database.")
        if parsed.username or parsed.password or parsed.query:
            raise ValueError("Use separate DB_USER/DB_PASSWORD and a host/port/database URL without query parameters.")
        url = URL.create("mysql+pymysql", username=user, password=password, host=parsed.hostname,
                         port=parsed.port or 3306, database=database, query={"charset": "utf8mb4"})
        backup_dir = Path(os.environ.get("GREENLY_BACKUP_DIR", str(
            Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "Greenly" / "backups")))
        port = int(os.environ.get("GREENLY_PORT", "8080"))
        if not 1 <= port <= 65535:
            raise ValueError("GREENLY_PORT must be between 1 and 65535.")
        return cls(profile, host, port, url, backup_dir)
