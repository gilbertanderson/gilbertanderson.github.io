// The demo's "database": one JSON document in localStorage, so every visitor
// gets a private sandbox that survives reloads and never touches a server.

import { buildSeed } from './seed';
import type { DemoDb } from './types';

const KEY = 'sharecrops_demo_db_v1';
const SESSION_KEY = 'sharecrops_demo_session';
export const CHANGE_EVENT = 'sharecrops:changed';

let cache: DemoDb | null = null;

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // storage blocked: the demo still runs, just in memory
  }
}

export function load(): DemoDb {
  if (cache) return cache;
  const raw = storage()?.getItem(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DemoDb;
      if (parsed?.version === 1) {
        cache = parsed;
        return cache;
      }
    } catch {
      /* fall through to a fresh seed */
    }
  }
  cache = buildSeed();
  save(cache);
  return cache;
}

export class StorageFullError extends Error {}

export function save(db: DemoDb) {
  cache = db;
  try {
    storage()?.setItem(KEY, JSON.stringify(db));
  } catch (e) {
    if (e instanceof DOMException && /quota/i.test(e.name + e.message)) {
      throw new StorageFullError('Your browser storage for this demo is full. Remove a photo or reset the demo from your profile.');
    }
  }
}

/** Wipe everything and start over with fresh seed data. */
export function resetDemo() {
  cache = null;
  storage()?.removeItem(KEY);
  storage()?.removeItem(SESSION_KEY);
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

export function getSessionUserId(): string | null {
  return storage()?.getItem(SESSION_KEY) ?? null;
}

export function setSessionUserId(id: string | null) {
  if (id) storage()?.setItem(SESSION_KEY, id);
  else storage()?.removeItem(SESSION_KEY);
}

export function notifyChanged() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Another tab changed the demo: drop the cache so the next read reloads it.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      cache = null;
      notifyChanged();
    }
  });
}

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
