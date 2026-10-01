import argparse
import json
import sys

import uvicorn

from .config import Settings
from .local_mysql import ensure_for_settings
from .migrations import migrate
from .startup_errors import safe_error


def main() -> int:
    parser = argparse.ArgumentParser(description="Greenly local API and safe MySQL migrations")
    parser.add_argument("action", choices=("serve", "migrate"))
    args = parser.parse_args()
    try:
        settings = Settings.from_env()
        ensure_for_settings(settings)
        result = migrate(settings)
        print(json.dumps(result, ensure_ascii=False), flush=True)
        if args.action == "serve":
            from .main import create_app
            uvicorn.run(create_app(settings), host=settings.host, port=settings.port, log_level="info")
        return 0
    except ValueError as error:
        print(f"Greenly startup rejected: {error}", file=sys.stderr)
    except Exception as error:
        # Do not print SQL parameters, credentials, or request payloads.
        print(f"Greenly startup failed: {safe_error(error)}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
