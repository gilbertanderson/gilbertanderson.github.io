"""Database tables (SQLModel)."""

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class ContactSubmission(SQLModel, table=True):
    __tablename__ = "contact_submission"

    id: int | None = Field(default=None, primary_key=True)
    received_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    name: str = Field(max_length=200)
    email: str = Field(max_length=320)
    message: str = Field(max_length=5000)
