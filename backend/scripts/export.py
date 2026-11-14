"""Export the API's schema and the site content for the static frontend build.

GitHub Pages can only serve static files, so instead of calling the API at
runtime the frontend is built from these exports:

  frontend/openapi.json       -> TypeScript types (npm run gen:client)
  frontend/src/content.json   -> validated site content, bundled into the page
  frontend/public/sitemap.xml and robots.txt

Run from backend/:  python -m scripts.export
"""

import json
from pathlib import Path

from app.content import load_content
from app.main import app

FRONTEND = Path(__file__).resolve().parents[2] / "frontend"


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")
    print(f"wrote {path.relative_to(FRONTEND.parent)}")


def main() -> None:
    content = load_content()  # raises a readable ValidationError if site.toml is wrong
    base = str(content.site.url).rstrip("/")

    write(FRONTEND / "openapi.json", json.dumps(app.openapi(), indent=2) + "\n")
    write(FRONTEND / "src" / "content.json", content.model_dump_json(indent=2) + "\n")
    write(
        FRONTEND / "public" / "sitemap.xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"  <url><loc>{base}/</loc></url>\n"
        "</urlset>\n",
    )
    write(FRONTEND / "public" / "robots.txt", f"User-agent: *\nAllow: /\nSitemap: {base}/sitemap.xml\n")


if __name__ == "__main__":
    main()
