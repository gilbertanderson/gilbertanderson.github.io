"""Load and validate the site's content from content/site.toml."""

import tomllib
from functools import lru_cache
from pathlib import Path

from .schemas import SiteContent

CONTENT_FILE = Path(__file__).resolve().parent.parent / "content" / "site.toml"


def load_content(path: Path = CONTENT_FILE) -> SiteContent:
    with path.open("rb") as f:
        return SiteContent.model_validate(tomllib.load(f))


@lru_cache
def get_content() -> SiteContent:
    return load_content()
