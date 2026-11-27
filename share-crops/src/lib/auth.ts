// Local sign-in for the static demo. The production app uses Firebase Auth;
// here accounts live in this browser only. Passwords are never stored in plain
// text (SHA-256 with a per-app prefix) and never leave the device.

import { load, save, getSessionUserId, setSessionUserId, uid, notifyChanged } from '@/lib/demo/store';
import { welcome } from '@/lib/demo/neighbors';
import type { StoredUser } from '@/lib/demo/types';

type Listener = (userId: string | null) => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l(getSessionUserId()));

export class AuthError extends Error {}

async function hash(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`share-crops:${password}`);
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // http:// origins without SubtleCrypto: a weak fallback is fine for a local demo.
  let h = 0;
  for (const b of bytes) h = (h * 31 + b) | 0;
  return `fallback-${h}`;
}

function createUser(email: string, name: string): StoredUser {
  const db = load();
  const user: StoredUser = {
    id: uid(),
    email,
    name,
    bio: '',
    socialUrl: '',
    profilePhotoUrl: '',
    role: 'general',
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  welcome(db, user.id);
  save(db);
  return user;
}

export async function signUpWithEmail(email: string, password: string, name: string): Promise<void> {
  const db = load();
  const e = email.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === e)) {
    throw new AuthError('An account with that email already exists. Try logging in.');
  }
  const user = createUser(e, name.trim());
  const fresh = load();
  fresh.passwords[user.id] = await hash(password);
  save(fresh);
  setSessionUserId(user.id);
  emit();
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const db = load();
  const e = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === e && !u.bot);
  // Same message either way, so the form doesn't reveal which emails exist.
  if (!user || db.passwords[user.id] !== (await hash(password))) {
    throw new AuthError('Incorrect email or password.');
  }
  setSessionUserId(user.id);
  emit();
}

/** One tap into the demo, no form. */
export async function continueAsGuest(): Promise<void> {
  const db = load();
  const n = db.users.filter((u) => u.email.endsWith('@guest.sharecrops.example')).length + 1;
  const user = createUser(`guest${n}@guest.sharecrops.example`, n === 1 ? 'Guest Gardener' : `Guest Gardener ${n}`);
  setSessionUserId(user.id);
  emit();
}

export function currentUserId(): string | null {
  return getSessionUserId();
}

export function onAuthChange(cb: Listener): () => void {
  listeners.add(cb);
  cb(getSessionUserId());
  return () => listeners.delete(cb);
}

export function logout() {
  setSessionUserId(null);
  emit();
  notifyChanged();
}

export function friendlyAuthError(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'Something went wrong.';
}
