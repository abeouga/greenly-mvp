import json
import os
import socket
import subprocess
import sys
import time
import traceback
from datetime import UTC, datetime

from greenly_api.config import BACKEND_ROOT, REPO_ROOT, Settings

from .verify_api import request, verify_api
from .verify_migrations import verify_migrations


def main() -> int:
    os.environ["GREENLY_PROFILE"] = "e2e"
    settings = Settings.from_env()
    output = REPO_ROOT / "artifacts/fastapi"
    output.mkdir(parents=True, exist_ok=True)
    report = {"time": datetime.now(UTC).isoformat(), "database": settings.database_url.database,
              "api_checks": [], "migration_checks": [], "result": "failed"}
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    env = os.environ.copy()
    env["GREENLY_PORT"] = str(port)
    env["GREENLY_HOST"] = "127.0.0.1"
    base = f"http://127.0.0.1:{port}"
    with (output / "api-verification.log").open("w", encoding="utf-8") as log:
        process = subprocess.Popen([sys.executable, "-m", "greenly_api", "serve"], cwd=BACKEND_ROOT,
                                   env=env, stdout=log, stderr=subprocess.STDOUT)
        try:
            deadline = time.monotonic() + 45
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    raise RuntimeError("Verification API failed to start; check api-verification.log")
                try:
                    if request(base, "GET", "/api/assets")[0] == 200:
                        break
                except OSError:
                    pass
                time.sleep(.25)
            else:
                raise RuntimeError("Verification API startup timed out")
            report["api_checks"] = verify_api(base, settings)
            report["migration_checks"] = verify_migrations(settings)
            report["result"] = "passed"
        except Exception as error:
            report["error_type"] = type(error).__name__
            traceback.print_tb(error.__traceback__)
            print(f"Verification failed: {type(error).__name__}; see artifacts/fastapi", file=sys.stderr)
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
    (output / "backend-verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["result"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
