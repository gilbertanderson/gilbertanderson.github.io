"""Pydantic models: the single source of truth for the site's data shapes.

FastAPI turns these into openapi.json, and the frontend generates its
TypeScript types from that file, so a change here shows up as a type error
in the React code that uses it.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

HEX_COLOR = r"^#[0-9A-Fa-f]{6}$"


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Site(Strict):
    name: str = Field(min_length=1)
    title: str = Field(min_length=1, description="Short role line shown above the headline.")
    headline: str = Field(min_length=1)
    headline_highlights: list[str] = Field(default=[], description="Words in the headline shown in the accent color.")
    bio: str = ""
    url: HttpUrl
    accent: str = Field(default="#0B63CE", pattern=HEX_COLOR)
    accent_on_dark: str = Field(default="#6CB2FF", pattern=HEX_COLOR)
    banner: str | None = Field(default=None, description="Profile banner, path under frontend/public.")
    avatar: str | None = Field(default=None, description="Profile photo, path under frontend/public.")
    resume: str | None = Field(default=None, description="Path under frontend/public, e.g. /Resume.docx.")
    resume_pdf: str | None = Field(default=None, description="PDF copy of the resume, path under frontend/public.")


class Link(Strict):
    label: str = Field(min_length=1)
    url: HttpUrl


class Project(Strict):
    title: str = Field(min_length=1)
    kind: str = Field(min_length=1, description="Short category tag, e.g. 'React'.")
    description: str = Field(min_length=1)
    url: HttpUrl | None = Field(default=None, description="Repository or live link; leave out for unreleased work.")
    category: Literal["design", "development"] = "development"
    link_label: str = "View on GitHub"
    demos: list[Link] = Field(default=[], description="Playable or live versions, shown as extra links.")
    article_url: HttpUrl | None = Field(default=None, description="Optional write-up, e.g. a blog post about the project.")
    image: str | None = Field(default=None, description="Path under frontend/public, e.g. /projects/dive-log.png.")


class ToolGroup(Strict):
    group: str = Field(min_length=1)
    items: list[str] = Field(min_length=1)


class Position(Strict):
    """One title held at a company, shown nested under it like LinkedIn does."""

    title: str = Field(min_length=1)
    period: str = Field(min_length=1)
    note: str | None = Field(default=None, description="Optional line under the title, e.g. the program or employer.")
    highlights: list[str] = Field(min_length=1)


class Role(Strict):
    company: str = Field(min_length=1)
    logo: str | None = Field(default=None, description="Company logo, path under frontend/public.")
    period: str = Field(min_length=1, description="Display text, e.g. 'Jul 2023 – Jul 2025'.")
    title: str | None = None
    highlights: list[str] = []
    positions: list[Position] = Field(default=[], description="Several titles at one company, newest first.")

    @model_validator(mode="after")
    def _title_or_positions(self) -> "Role":
        if self.positions:
            if self.title or self.highlights:
                raise ValueError("use either title/highlights or positions, not both")
        elif not self.title:
            raise ValueError("a role needs a title, or a list of positions")
        return self


class Article(Strict):
    title: str = Field(min_length=1)
    summary: str = ""
    url: HttpUrl
    source: str = Field(default="", description="Where it was published, e.g. 'Medium'.")


class HowBuilt(Strict):
    heading: str = Field(min_length=1)
    blurb: str = ""
    points: list[str] = Field(min_length=1)


class ContactSection(Strict):
    heading: str = Field(min_length=1)
    blurb: str = ""
    email: str | None = Field(default=None, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    phone: str | None = Field(default=None, description="Display text, e.g. '504-233-3599'.")


class SiteContent(Strict):
    site: Site
    links: list[Link]
    projects: list[Project] = Field(min_length=1)
    experience: list[Role] = []
    tools: list[ToolGroup]
    credentials: list[ToolGroup] = []
    writing: list[Article] = []
    how_built: HowBuilt | None = None
    contact: ContactSection


class ContactMessage(Strict):
    name: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=3, max_length=320, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    message: str = Field(min_length=1, max_length=5000)


class ContactReceipt(BaseModel):
    ok: bool
    detail: str
