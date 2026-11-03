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

    @model_validator(mode="after")
    def _require_real_secret_in_production(self) -> "Settings":
        if self.env == "production" and self.secret_key == INSECURE_DEV_SECRET:
            raise ValueError("BIBI_SECRET_KEY must be set in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
