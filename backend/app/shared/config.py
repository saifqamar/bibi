"""Application settings, read from environment variables only (prefix ``BIBI_``)."""

from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

INSECURE_DEV_SECRET = "dev-insecure-secret-change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="BIBI_", env_file=".env", extra="ignore")

    env: str = "development"  # development | test | production
    app_name: str = "Bibi"
    api_prefix: str = "/api/v1"
    log_level: str = "INFO"

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/bibi"
    redis_url: str | None = None

    secret_key: str = INSECURE_DEV_SECRET
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 30
    invite_ttl_days: int = 7
    social_auth_backend: str = "disabled"  # disabled | fake (real providers: [OPEN])
    public_base_url: str = "http://localhost:8000"
    studio_url: str = "http://localhost:5173"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    storage_backend: str = "local"  # local | memory
    storage_dir: str = "var/storage"
    signed_url_ttl_seconds: int = 3600

    email_backend: str = "console"  # console | smtp | fake
    smtp_host: str = "localhost"
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    email_from: str = "Bibi <no-reply@bibi.local>"

    queue_backend: str = "memory"  # arq | memory

    # AI providers ([OPEN] in the spec; fakes need no keys)
    llm_backend: str = "fake"  # fake | anthropic
    llm_model: str = "claude-opus-5-5"
    llm_effort: str = "high"  # low | medium | high | xhigh | max
    llm_fallbacks: bool = True  # server-side refusal fallback
    llm_timeout_seconds: float = 600.0
    anthropic_api_key: str | None = None  # falls back to ANTHROPIC_API_KEY / SDK credentials
    embedding_backend: str = "fake"  # fake (provider [OPEN])
    tts_backend: str = "fake"  # fake (provider [OPEN])
    tracing_backend: str = "logging"  # logging | noop

    # Listening data
    listening_event_retention_days: int = 396  # about 13 months ([OPEN] in spec 12)

    # Audio production
    tts_concurrency: int = 4
    audio_target_lufs: float = -16.0  # [OPEN] in spec 07; common spoken-word target
    audio_true_peak: float = -1.5
    audio_mp3_bitrate: str = "96k"

    # Public website
    public_sample_seconds: int = 90  # first N seconds of episode 1 ([OPEN] in spec 13)
    public_sample_url_ttl_seconds: int = 600

    sentry_dsn: str | None = None
    sentry_traces_sample_rate: float = 0.0

    @model_validator(mode="after")
    def _require_real_secret_in_production(self) -> "Settings":
        if self.env == "production" and self.secret_key == INSECURE_DEV_SECRET:
            raise ValueError("BIBI_SECRET_KEY must be set in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
