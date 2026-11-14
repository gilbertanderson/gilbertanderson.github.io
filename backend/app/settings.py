"""Runtime settings, read from environment variables (or backend/.env)."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    # Postgres in production (Neon, Supabase, Render…): postgresql://user:pass@host/db
    # Unset: a local SQLite file, so dev and tests need no database server.
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'data' / 'site.db').as_posix()}"

    # Extra allowed browser origins, comma-separated.
    cors_origins: str = ""

    # Optional: email each contact message on via SMTP.
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    contact_to: str | None = None


settings = Settings()
