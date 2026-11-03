"""Imports every module that registers background jobs, so workers and tests see them."""

from app.shared import system_jobs  # noqa: F401
