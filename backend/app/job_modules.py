"""Imports every module that registers background jobs, so workers and tests see them."""

from app.modules.ai import jobs as ai_jobs  # noqa: F401
from app.modules.audio import service as audio_jobs  # noqa: F401
from app.shared import system_jobs  # noqa: F401
