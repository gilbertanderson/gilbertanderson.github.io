import pytest
from pydantic import ValidationError
from sqlmodel import select

from app.content import load_content
from app.database import normalize_url
from app.models import ContactSubmission
from app.schemas import SiteContent


def test_content_file_is_valid():
    data = load_content()
    assert data.site.name
    assert len(data.projects) >= 1


def test_get_content_matches_schema(client):
    res = client.get("/api/content")
    assert res.status_code == 200
    SiteContent.model_validate(res.json())


def test_bad_accent_is_rejected():
    raw = load_content().model_dump(mode="json")
    raw["site"]["accent"] = "blue"
    with pytest.raises(ValidationError):
        SiteContent.model_validate(raw)


def test_contact_saves_message(client, session):
    res = client.post("/api/contact", json={"name": "Ada", "email": "ada@example.com", "message": "Hi"})
    assert res.status_code == 200
    assert res.json()["ok"] is True
    rows = session.exec(select(ContactSubmission)).all()
    assert [(r.name, r.email, r.message) for r in rows] == [("Ada", "ada@example.com", "Hi")]


def test_contact_rejects_bad_email(client, session):
    res = client.post("/api/contact", json={"name": "Ada", "email": "nope", "message": "Hi"})
    assert res.status_code == 422
    assert session.exec(select(ContactSubmission)).all() == []


def test_cors_allows_dev_server(client):
    res = client.options(
        "/api/contact",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("postgres://u:p@h/db", "postgresql+psycopg://u:p@h/db"),
        ("postgresql://u:p@h/db", "postgresql+psycopg://u:p@h/db"),
        ("sqlite:///x.db", "sqlite:///x.db"),
    ],
)
def test_normalize_url(raw, expected):
    assert normalize_url(raw) == expected


def test_role_needs_title_or_positions():
    from pydantic import ValidationError

    from app.schemas import Role

    ok = Role(company="X", period="2020", positions=[{"title": "A", "period": "2020", "highlights": ["did it"]}])
    assert ok.positions[0].title == "A"
    with pytest.raises(ValidationError):
        Role(company="X", period="2020")
    with pytest.raises(ValidationError):
        Role(company="X", period="2020", title="A", highlights=["h"], positions=[{"title": "B", "period": "2020", "highlights": ["h"]}])
