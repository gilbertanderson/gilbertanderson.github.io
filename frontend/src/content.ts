// Site content, exported by the backend at build time (npm run export) and
// typed by the client generated from FastAPI's OpenAPI schema.
import type { SiteContent } from './client/siteApi';
import data from './content.json';

// JSON imports widen the "design" | "development" literals to string, hence the cast.
export const content = data as SiteContent;
