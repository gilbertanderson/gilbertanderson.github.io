// MSW stands in for the FastAPI backend during tests. Handlers are typed with
// the generated client types, so they drift-check against the real API too.
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { ContactMessage, ContactReceipt } from '../client/siteApi';

export const API = 'http://api.test';

export const received: ContactMessage[] = [];

export const handlers = [
  http.post<never, ContactMessage, ContactReceipt>(`${API}/api/contact`, async ({ request }) => {
    received.push(await request.json());
    return HttpResponse.json({ ok: true, detail: 'Thanks — message sent.' });
  }),
];

export const server = setupServer(...handlers);
