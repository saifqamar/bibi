"""Imports every module's models so Alembic and tests see the full schema."""

from app.modules.identity import models as identity_models  # noqa: F401
from app.shared import audit  # noqa: F401
from app.shared.db import Base

metadata = Base.metadata
