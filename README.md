# gilbertanderson.github.io

Personal portfolio site. React + TypeScript frontend, Python FastAPI backend,
typed end to end through FastAPI's OpenAPI schema.

| Layer | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Redux Toolkit / RTK Query |
| API types | FastAPI → `openapi.json` → `@rtk-query/codegen-openapi` |
| Backend | Python 3.13, FastAPI, Pydantic, SQLModel |
| Database | PostgreSQL in production (`DATABASE_URL`), SQLite locally |
| Tests | pytest (backend), Vitest + Testing Library + MSW (frontend) |
| Hosting | GitHub Pages (frontend), any Python host for the API |

```
backend/
  app/
    main.py          FastAPI app, CORS, routers
    schemas.py       Pydantic models: the source of truth for the API and the content
    models.py        SQLModel tables (contact submissions)
    database.py      engine + session (Postgres or SQLite)
    content.py       loads and validates content/site.toml
    routers/         /api/content, /api/contact
  content/site.toml  everything the site says: edit this
  scripts/export.py  writes openapi.json + content.json for the static build
  tests/
frontend/
  src/
    client/siteApi.ts  generated RTK Query hooks + types (don't edit)
    store/             emptyApi.ts (base RTK Query slice), store.ts
    components/
    App.tsx
  openapi.json         generated from the backend
  openapi-config.cjs   codegen config
.github/workflows/deploy.yml
```

## How it fits together

GitHub Pages only serves static files, so it can't run Python. The build
therefore runs the backend *once*, at build time:

1. `backend/scripts/export.py` validates `content/site.toml` against the
   Pydantic models and writes `frontend/openapi.json` and
   `frontend/src/content.json`.
2. `@rtk-query/codegen-openapi` turns `openapi.json` into typed hooks and
   types in `frontend/src/client/siteApi.ts`.
3. Vite builds the React app with that content bundled in, and GitHub
   Actions publishes `frontend/dist` to Pages.

The live API is only needed for the **contact form**, which saves messages to
the database (and can email them on). Until a backend is hosted and
`VITE_API_URL` is set, the form is hidden and the site shows GitHub and
Medium links instead, so no visitor's message is ever silently dropped.

## Run it locally

Backend (Python 3.13):

```bash
cd backend
py -3.13 -m venv .venv
.venv/Scripts/activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs. Without `DATABASE_URL` it uses SQLite
at `backend/data/site.db`; see `backend/.env.example` for settings.

Frontend (with the backend's venv active, since `npm run dev` runs the export):

```bash
cd frontend
npm install
npm run dev
```

http://localhost:5173. Vite proxies `/api` to the backend, so the contact form
works locally.

## Edit the content

Edit `backend/content/site.toml` (bio, projects, tools, links, accent color).
To use a screenshot for a project, put the image in
`frontend/public/projects/` and add `image = "/projects/<file>"` to it.
A typo or a missing field fails the build with a clear error.

## Change the API

Change `backend/app/schemas.py` or a router, then run `npm run gen` in
`frontend/`. The regenerated types make TypeScript flag every place in the UI
that needs updating. CI fails if the committed client is out of date.

## Tests

```bash
cd backend && pytest
cd frontend && npm test
```

## Deploy

**Frontend (GitHub Pages).** One-time: repository Settings › Pages › Source:
**GitHub Actions**. Every push to `master` then runs both test suites, builds
and deploys.

**Backend + database (when you want the contact form live).**

1. Create a free Postgres database (Neon or Supabase) and copy its connection string.
2. Deploy `backend/` to a Python host (Render, Railway, Koyeb, Fly.io):
   build `pip install -r requirements.txt`, start
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, env var `DATABASE_URL`.
3. In GitHub: Settings › Secrets and variables › Actions › **Variables**, add
   `VITE_API_URL` = the backend's URL (e.g. `https://your-api.onrender.com`),
   then re-run the workflow.

Tables are created on startup. Never put database credentials in the frontend:
the browser only talks to FastAPI.
