from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import create_tables
from .routers import contact, content
from .settings import settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_tables()
    yield


app = FastAPI(title="Gilbert Anderson Site API", version="2.0.0", lifespan=lifespan)

# The Vite dev server, the live site, plus any extra origins from CORS_ORIGINS.
origins = ["http://localhost:5173", "https://gilbertanderson.github.io"]
origins += [o.strip() for o in settings.cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(content.router, prefix="/api")
app.include_router(contact.router, prefix="/api")


@app.get("/api/health", tags=["meta"], operation_id="health")
def health() -> dict[str, str]:
    return {"status": "ok"}
