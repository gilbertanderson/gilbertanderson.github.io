from fastapi import APIRouter

from ..content import get_content
from ..schemas import SiteContent

router = APIRouter(tags=["content"])


@router.get("/content", response_model=SiteContent, operation_id="getContent")
def read_content() -> SiteContent:
    return get_content()
