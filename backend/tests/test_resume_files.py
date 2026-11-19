"""The downloadable resume files must exist and be readable.

A hand-edited .docx once shipped with broken XML and would not open in Word;
these checks catch that before it is deployed.
"""

import tomllib
import zipfile
from pathlib import Path
from xml.dom import minidom

import pytest

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "frontend" / "public"
SITE = tomllib.loads((ROOT / "backend" / "content" / "site.toml").read_text(encoding="utf-8"))["site"]


def _public(path: str) -> Path:
    return PUBLIC / path.lstrip("/")


@pytest.mark.skipif(not SITE.get("resume"), reason="no .docx resume configured")
def test_docx_resume_is_a_valid_word_file():
    path = _public(SITE["resume"])
    assert path.is_file(), f"missing {path}"
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None, "corrupt entry in the .docx zip"
        names = set(z.namelist())
        for required in ("[Content_Types].xml", "word/document.xml"):
            assert required in names, f"{required} missing from the .docx"
        xml = z.read("word/document.xml")
    minidom.parseString(xml)  # raises if any tag is broken
    assert SITE["name"].upper().encode() in xml.upper(), "name not found in the resume text"


@pytest.mark.skipif(not SITE.get("resume_pdf"), reason="no PDF resume configured")
def test_pdf_resume_exists_and_is_a_pdf():
    path = _public(SITE["resume_pdf"])
    assert path.is_file(), f"missing {path}"
    assert path.read_bytes()[:5] == b"%PDF-", "the resume PDF does not start with a PDF header"
