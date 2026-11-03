"""Imports every module's models so Alembic and tests see the full schema."""

from app.modules.admin import models as admin_models  # noqa: F401
from app.modules.ai import models as ai_models  # noqa: F401
from app.modules.audio import models as audio_models  # noqa: F401
from app.modules.catalog import models as catalog_models  # noqa: F401
from app.modules.identity import models as identity_models  # noqa: F401
from app.modules.writing import models as writing_models  # noqa: F401
from app.shared import audit  # noqa: F401
from app.shared.db import Base

metadata = Base.metadata
