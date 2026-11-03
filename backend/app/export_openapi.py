"""Writes the OpenAPI schema used to generate the TypeScript client.

Usage: ``python -m app.export_openapi path/to/openapi.json``
"""

import json
import sys

from app.main import create_app


def main() -> None:
    target = sys.argv[1] if len(sys.argv) > 1 else "openapi.json"
    schema = create_app().openapi()
    with open(target, "w", encoding="utf-8") as fh:
        json.dump(schema, fh, indent=2, sort_keys=True)
        fh.write("\n")


if __name__ == "__main__":
    main()
