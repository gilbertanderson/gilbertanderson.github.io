// Where the FastAPI backend lives. Set VITE_API_URL at build time (e.g. in the
// deploy workflow) once the backend is hosted. In dev, Vite proxies /api to
// localhost:8000, so an empty base URL works.
export const API_URL: string = import.meta.env.VITE_API_URL ?? '';

// GitHub Pages can't run Python: only show the contact form when there is a
// real backend to send to, so visitors' messages are never silently dropped.
export const CONTACT_ENABLED: boolean = Boolean(API_URL) || import.meta.env.DEV;
