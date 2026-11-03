"""Management commands.

Usage: ``python -m app.cli create-admin --email admin@example.com --password '...'``
"""

import argparse
import getpass
import sys

from app.container import build_container
from app.modules.identity.service import IdentityService
from app.shared.config import get_settings
from app.shared.errors import AppError


def create_admin(email: str, password: str | None) -> int:
    password = password or getpass.getpass("Password: ")
    if len(password) < 8:
        print("Password must be at least 8 characters", file=sys.stderr)
        return 1
    container = build_container(get_settings())
    with container.db.session() as db:
        try:
            user = IdentityService(db, container).create_admin(email, password)
            db.commit()
        except AppError as exc:
            print(exc.message, file=sys.stderr)
            return 1
    print(f"Created admin {user.email} ({user.id})")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    admin = commands.add_parser("create-admin", help="Create the first (or another) admin")
    admin.add_argument("--email", required=True)
    admin.add_argument("--password", help="Omit to be prompted")
    args = parser.parse_args(argv)
    if args.command == "create-admin":
        return create_admin(args.email, args.password)
    return 1


if __name__ == "__main__":
    sys.exit(main())
