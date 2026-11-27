// Share Crops API client, static-demo edition.
//
// The production app (share-crops-v2) sends these calls to a Hono API backed by
// Supabase Postgres, with Firebase Auth tokens. GitHub Pages can't run a server,
// so this file keeps the exact same `API` surface the screens already use and
// answers it from an in-browser database instead. The rules the server enforced
// (only the seller accepts, no offers on your own listing, rate only completed
// trades you were part of, one rating per trade, ownership moves to the buyer on
// completion) are enforced here the same way, so the UI behaves identically.

import type { User, Listing, Offer, Thread, Message, Rating, Community } from '@/types';
import { load, save, notifyChanged, getSessionUserId, uid, StorageFullError } from '@/lib/demo/store';
import { scheduleBotReply, scheduleOfferAnswer, scheduleNeighborOffer, scheduleRateBack, runDueEvents, draftDescription } from '@/lib/demo/neighbors';
import type { DemoDb, StoredListing, StoredOffer, StoredUser, StoredThread } from '@/lib/demo/types';
import { sanitizeInput } from '@/lib/security';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export class AuthManager {
  private static COMMUNITY_SELECTED_KEY = 'sharecrops_community_selected';
  static hasSelectedCommunityThisSession(): boolean {
    return sessionStorage.getItem(this.COMMUNITY_SELECTED_KEY) === 'true';
  }
  static markCommunitySelected() {
    sessionStorage.setItem(this.COMMUNITY_SELECTED_KEY, 'true');
  }
  static resetCommunitySelection() {
    sessionStorage.removeItem(this.COMMUNITY_SELECTED_KEY);
  }
  static clearToken() {
    this.resetCommunitySelection();
  }
}

const MAX_LISTING_EXPIRATION_DAYS = 30;
const LATENCY_MS = 140; // just enough that loaders and skeletons get a frame

// ── helpers ────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Run a handler against the db with the same shape as an HTTP round-trip. */
async function call<T>(fn: (db: DemoDb, me: StoredUser | null) => T, opts: { auth?: boolean; write?: boolean } = {}): Promise<T> {
  await sleep(LATENCY_MS);
  const db = load();
  if (runDueEvents(db)) save(db);
  const meId = getSessionUserId();
  const me = meId ? db.users.find((u) => u.id === meId) ?? null : null;
  if (opts.auth !== false && !me) {
    onUnauthorized?.();
    throw new ApiError('Session expired. Please log in again.', 401);
  }
  const result = fn(db, me);
  if (opts.write) {
    try {
      save(db);
    } catch (e) {
      if (e instanceof StorageFullError) throw new ApiError(e.message, 507);
      throw e;
    }
    notifyChanged();
  }
  // Hand back copies so screens can't mutate the store by accident.
  return structuredClone(result);
}

const fail = (message: string, status = 400): never => {
  throw new ApiError(message, status);
};

function toUser(db: DemoDb, u: StoredUser): User {
  const mine = db.ratings.filter((r) => r.ratedUserId === u.id);
  const avg = mine.length ? mine.reduce((s, r) => s + r.rating, 0) / mine.length : 0;
  const { bot: _bot, ...rest } = u;
  return { ...rest, rating: Math.round(avg * 10) / 10, ratingCount: mine.length };
}

function userById(db: DemoDb, id: string): User | undefined {
  const u = db.users.find((x) => x.id === id);
  return u ? toUser(db, u) : undefined;
}

function toCommunity(db: DemoDb, c: DemoDb['communities'][number]): Community {
  return { ...c, memberCount: db.memberships.filter((m) => m.communityId === c.id).length };
}

const isExpired = (l: StoredListing) => !!l.expiresAt && new Date(l.expiresAt).getTime() <= Date.now();

function toListing(db: DemoDb, l: StoredListing): Listing {
  return { ...l, status: l.status === 'active' && isExpired(l) ? 'expired' : l.status, seller: userById(db, l.sellerId) };
}

function toOffer(db: DemoDb, o: StoredOffer): Offer {
  const l = db.listings.find((x) => x.id === o.listingId);
  return { ...o, listing: l ? toListing(db, l) : undefined, buyer: userById(db, o.buyerId), seller: userById(db, o.sellerId) };
}

function toThread(t: StoredThread): Thread {
  const { dedupeKey: _k, ...rest } = t;
  return rest;
}

const isMember = (db: DemoDb, userId: string, communityId: string) =>
  db.memberships.some((m) => m.userId === userId && m.communityId === communityId);

function activeCommunityId(db: DemoDb, userId: string): string | null {
  const stored = db.activeCommunity[userId];
  if (stored && isMember(db, userId, stored)) return stored;
  const first = db.memberships.find((m) => m.userId === userId)?.communityId ?? null;
  db.activeCommunity[userId] = first;
  return first;
}

function addMembership(db: DemoDb, userId: string, communityId: string) {
  if (!isMember(db, userId, communityId)) {
    db.memberships.push({ userId, communityId, joinedAt: new Date().toISOString() });
  }
  db.activeCommunity[userId] = communityId;
}

export function getOrCreateThread(db: DemoDb, input: { listingId: string; type: 'listing' | 'support'; title?: string; dedupeKey: string; participants: string[] }): StoredThread {
  const existing = db.threads.find((t) => t.dedupeKey === input.dedupeKey);
  if (existing) return existing;
  const now = new Date().toISOString();
  const thread: StoredThread = { id: uid(), ...input, lastMessageAt: now, createdAt: now };
  db.threads.push(thread);
  return thread;
}

export function insertMessage(db: DemoDb, threadId: string, senderId: string, content: string) {
  const thread = db.threads.find((t) => t.id === threadId)!;
  const message = { id: uid(), threadId, senderId, content, createdAt: new Date().toISOString() };
  db.messages.push(message);
  thread.lastMessage = content;
  thread.lastMessageAt = message.createdAt;
  return message;
}

export const listingThreadKey = (a: string, b: string, listingId: string) => `${[a, b].sort().join(':')}:${listingId}`;

function readImage(file: File): Promise<string> {
  // Downscale to keep a photo around 100 KB, so a handful fit in localStorage.
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      reject(new ApiError('Please choose a JPEG, PNG, WebP or GIF image.', 400));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      reject(new ApiError('That image is over 15 MB. Please pick a smaller one.', 413));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 900;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ApiError('Could not read that image.', 400));
    };
    img.src = url;
  });
}

// ── API ────────────────────────────────────────────────────────────────────

export class API {
  static getMe(): Promise<{ user: User }> {
    return call((db, me) => ({ user: toUser(db, me!) }));
  }

  // Communities
  static createCommunity(name: string, zipCode: string): Promise<{ community: Community }> {
    return call((db, me) => {
      const n = sanitizeInput(name ?? '').trim();
      const z = (zipCode ?? '').trim();
      if (!n || !z) fail('Name and zip code are required');
      if (!/^\d{5}$/.test(z)) fail('Enter a 5-digit zip code');
      if (db.communities.some((c) => c.zipCode === z && c.name.toLowerCase() === n.toLowerCase())) {
        fail('A community with this name already exists in this zip code', 409);
      }
      const c = { id: uid(), name: n, zipCode: z, createdBy: me!.id, createdAt: new Date().toISOString() };
      db.communities.push(c);
      addMembership(db, me!.id, c.id);
      return { community: toCommunity(db, c) };
    }, { write: true });
  }

  static joinCommunity(communityId: string): Promise<{ community: Community }> {
    return call((db, me) => {
      const c = db.communities.find((x) => x.id === communityId) ?? fail('Community not found', 404);
      addMembership(db, me!.id, c.id);
      return { community: toCommunity(db, c) };
    }, { write: true });
  }

  static searchCommunities(zipCode: string): Promise<{ communities: Community[] }> {
    return call((db) => {
      const z = (zipCode ?? '').trim();
      // Same zip first, then neighbors sharing the first three digits.
      const exact = db.communities.filter((c) => c.zipCode === z);
      const near = db.communities.filter((c) => c.zipCode !== z && z.length >= 3 && c.zipCode.startsWith(z.slice(0, 3)));
      return { communities: [...exact, ...near].map((c) => toCommunity(db, c)) };
    });
  }

  static getMyCommunity(): Promise<{ community: Community | null }> {
    return call((db, me) => {
      const id = activeCommunityId(db, me!.id);
      const c = id ? db.communities.find((x) => x.id === id) : undefined;
      return { community: c ? toCommunity(db, c) : null };
    });
  }

  static getMyCommunities(): Promise<{ communities: Community[]; activeCommunityId: string | null }> {
    return call((db, me) => {
      const ids = db.memberships.filter((m) => m.userId === me!.id).map((m) => m.communityId);
      return {
        communities: db.communities.filter((c) => ids.includes(c.id)).map((c) => toCommunity(db, c)),
        activeCommunityId: activeCommunityId(db, me!.id),
      };
    });
  }

  static setActiveCommunity(communityId: string): Promise<{ community: Community }> {
    return call((db, me) => {
      if (!isMember(db, me!.id, communityId)) fail('You are not a member of that community', 403);
      db.activeCommunity[me!.id] = communityId;
      return { community: toCommunity(db, db.communities.find((c) => c.id === communityId)!) };
    }, { write: true });
  }

  static leaveCommunity(communityId: string): Promise<{ success: boolean }> {
    return call((db, me) => {
      db.memberships = db.memberships.filter((m) => !(m.userId === me!.id && m.communityId === communityId));
      if (db.activeCommunity[me!.id] === communityId) db.activeCommunity[me!.id] = null;
      return { success: true };
    }, { write: true });
  }

  static getAllCommunities(): Promise<{ communities: Community[] }> {
    return call((db) => ({ communities: db.communities.map((c) => toCommunity(db, c)) }));
  }

  static getCommunityMembersPreview(communityId: string): Promise<{ members: Array<{ id: string; name: string; profilePhotoUrl: string | null }> }> {
    return call((db) => ({
      members: db.memberships
        .filter((m) => m.communityId === communityId)
        .slice(0, 5)
        .map((m) => db.users.find((u) => u.id === m.userId)!)
        .filter(Boolean)
        .map((u) => ({ id: u.id, name: u.name, profilePhotoUrl: u.profilePhotoUrl || null })),
    }));
  }

  static getCommunityMembers(communityId: string): Promise<{ members: User[] }> {
    return call((db) => ({
      members: db.memberships
        .filter((m) => m.communityId === communityId)
        .map((m) => userById(db, m.userId))
        .filter((u): u is User => !!u),
    }));
  }

  static removeCommunityMember(communityId: string, userId: string): Promise<{ success: boolean }> {
    return call((db, me) => {
      if (me!.role !== 'admin') fail('Only admins can remove members', 403);
      db.memberships = db.memberships.filter((m) => !(m.userId === userId && m.communityId === communityId));
      return { success: true };
    }, { write: true });
  }

  // Listings
  static createListing(data: {
    title: string;
    description: string;
    quantity: string;
    photos: string[];
    lookingFor?: string;
    expiresInDays: number;
  }): Promise<{ listing: Listing }> {
    return call((db, me) => {
      const title = sanitizeInput(data.title ?? '').trim();
      const description = sanitizeInput(data.description ?? '').trim();
      const quantity = sanitizeInput(data.quantity ?? '').trim();
      const lookingFor = sanitizeInput(data.lookingFor ?? '').trim();
      if (title.length < 1 || title.length > 200) fail('Title must be 1-200 characters');
      if (description.length > 2000) fail('Description must be 0-2000 characters');
      if (!quantity || quantity.length > 100) fail('Quantity must be specified');
      if ((data.photos ?? []).length > 5) fail('Maximum 5 photos allowed');
      if (lookingFor.length > 500) fail('Looking for description must be 0-500 characters');

      let expiresAt: string | null;
      const days = Number(data.expiresInDays ?? 30);
      if (days === 0) {
        if (me!.role !== 'admin') fail(`Expiration must be between 1 and ${MAX_LISTING_EXPIRATION_DAYS} days`);
        expiresAt = null;
      } else {
        if (!Number.isInteger(days) || days < 1 || days > MAX_LISTING_EXPIRATION_DAYS) {
          fail(`Expiration must be between 1 and ${MAX_LISTING_EXPIRATION_DAYS} days`);
        }
        expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
      }

      const communityId = activeCommunityId(db, me!.id);
      const community = communityId ? db.communities.find((c) => c.id === communityId) : undefined;
      if (!community) fail('You must join a community first');

      const listing: StoredListing = {
        id: uid(),
        sellerId: me!.id,
        title,
        description,
        quantity,
        photos: data.photos ?? [],
        lookingFor,
        communityId: community!.id,
        zipCode: community!.zipCode,
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt,
      };
      db.listings.push(listing);
      scheduleNeighborOffer(db, listing, me!.id);
      return { listing: toListing(db, listing) };
    }, { write: true });
  }

  static draftListingDescription(title: string, notes?: string): Promise<{
    description: string;
    usage: { inputTokens: number; cacheCreationInputTokens: number; cacheReadInputTokens: number; outputTokens: number };
  }> {
    return call(() => {
      const t = (title ?? '').trim();
      if (!t || t.length > 200) fail('Add a title first, then tap Draft.');
      return {
        description: draftDescription(t, notes),
        usage: { inputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0, outputTokens: 0 },
      };
    });
  }

  static getListings(filters?: { communityId?: string; zipCode?: string; cursor?: string; limit?: number }): Promise<{ listings: Listing[]; nextCursor: string | null }> {
    return call((db) => {
      const limit = Math.min(Math.max(Number(filters?.limit ?? 50), 1), 100);
      let rows = db.listings
        .filter((l) => l.status === 'active' && !isExpired(l))
        .filter((l) => (filters?.communityId ? l.communityId === filters.communityId : filters?.zipCode ? l.zipCode === filters.zipCode : true))
        .sort((a, b) => (b.createdAt.localeCompare(a.createdAt)) || b.id.localeCompare(a.id));
      if (filters?.cursor) {
        const [ts, id] = filters.cursor.split('|');
        rows = rows.filter((l) => l.createdAt < ts || (l.createdAt === ts && l.id < id));
      }
      const page = rows.slice(0, limit);
      const last = page[page.length - 1];
      return {
        listings: page.map((l) => toListing(db, l)),
        nextCursor: rows.length > limit && last ? `${last.createdAt}|${last.id}` : null,
      };
    });
  }

  static getListing(id: string): Promise<{ listing: Listing }> {
    return call((db) => {
      const l = db.listings.find((x) => x.id === id) ?? fail('Listing not found', 404);
      return { listing: toListing(db, l) };
    });
  }

  static deleteListing(id: string): Promise<{ success: boolean }> {
    return call((db, me) => {
      const l = db.listings.find((x) => x.id === id) ?? fail('Listing not found', 404);
      if (l.sellerId !== me!.id && me!.role !== 'admin') fail('You can only delete your own listings', 403);
      db.listings = db.listings.filter((x) => x.id !== id);
      db.offers = db.offers.filter((o) => o.listingId !== id || o.status === 'completed');
      return { success: true };
    }, { write: true });
  }

  static getUserListings(userId: string): Promise<{ listings: Listing[] }> {
    return call((db) => ({
      listings: db.listings
        .filter((l) => l.sellerId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((l) => toListing(db, l)),
    }));
  }

  // Offers
  static createOffer(listingId: string, offeredProduce: string, message?: string): Promise<{ offer: Offer }> {
    return call((db, me) => {
      const produce = sanitizeInput(offeredProduce ?? '').trim();
      if (!produce) fail("You must specify what you're offering");
      const listing = db.listings.find((l) => l.id === listingId) ?? fail('Listing not found', 404);
      if (listing.sellerId === me!.id) fail('You cannot make an offer on your own listing');
      if (listing.status !== 'active' || isExpired(listing)) fail('This listing is no longer accepting offers');
      const dupe = db.offers.some(
        (o) => o.listingId === listingId && o.buyerId === me!.id && o.offeredProduce.toLowerCase() === produce.toLowerCase() && o.status !== 'declined',
      );
      if (dupe) fail('You already have an offer for this produce on this listing. Delete your existing offer to submit a new one.');

      const offer: StoredOffer = {
        id: uid(),
        listingId,
        buyerId: me!.id,
        sellerId: listing.sellerId,
        offeredProduce: produce,
        message: sanitizeInput(message ?? '').trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      db.offers.push(offer);
      scheduleOfferAnswer(db, offer);
      return { offer: toOffer(db, offer) };
    }, { write: true });
  }

  static deleteOffer(offerId: string): Promise<{ success: boolean }> {
    return call((db, me) => {
      const o = db.offers.find((x) => x.id === offerId) ?? fail('Offer not found', 404);
      if (o.buyerId !== me!.id) fail('Only the buyer can delete their offer', 403);
      db.offers = db.offers.filter((x) => x.id !== offerId);
      db.events = db.events.filter((e) => !(e.kind === 'answer-offer' && e.offerId === offerId));
      return { success: true };
    }, { write: true });
  }

  private static setStatus(offerId: string, status: 'accepted' | 'declined'): Promise<{ offer: Offer }> {
    return call((db, me) => {
      const o = db.offers.find((x) => x.id === offerId) ?? fail('Offer not found', 404);
      if (o.sellerId !== me!.id) fail(`Only the seller can ${status === 'accepted' ? 'accept' : 'decline'} offers`, 403);
      if (o.status !== 'pending') fail(`This offer is already ${o.status}`);
      o.status = status;
      if (status === 'accepted') o.acceptedAt = new Date().toISOString();
      else o.declinedAt = new Date().toISOString();
      return { offer: toOffer(db, o) };
    }, { write: true });
  }

  static acceptOffer(offerId: string) {
    return this.setStatus(offerId, 'accepted');
  }

  static declineOffer(offerId: string) {
    return this.setStatus(offerId, 'declined');
  }

  static completeOffer(offerId: string): Promise<{ offer: Offer }> {
    return call((db, me) => {
      const o = db.offers.find((x) => x.id === offerId) ?? fail('Offer not found', 404);
      if (o.sellerId !== me!.id && o.buyerId !== me!.id) fail('Unauthorized', 403);
      if (o.status !== 'accepted') fail('Only accepted offers can be completed');
      o.status = 'completed';
      o.completedAt = new Date().toISOString();
      // Same as the complete_offer() Postgres function: the listing closes and
      // ownership moves to the buyer.
      const l = db.listings.find((x) => x.id === o.listingId);
      if (l) {
        l.status = 'completed';
        l.sellerId = o.buyerId;
      }
      scheduleRateBack(db, o, me!.id);
      return { offer: toOffer(db, o) };
    }, { write: true });
  }

  static getMyOffers(as?: 'buyer' | 'seller'): Promise<{ offers: Offer[] }> {
    return call((db, me) => ({
      offers: db.offers
        .filter((o) => (as === 'buyer' ? o.buyerId === me!.id : as === 'seller' ? o.sellerId === me!.id : o.buyerId === me!.id || o.sellerId === me!.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((o) => toOffer(db, o)),
    }));
  }

  // Chat
  static createSupportThread(): Promise<{ thread: Thread }> {
    return call((db, me) => {
      const admins = db.users.filter((u) => u.role === 'admin' && u.id !== me!.id).map((u) => u.id);
      if (admins.length === 0) fail('No admins available', 404);
      const thread = getOrCreateThread(db, {
        listingId: '',
        type: 'support',
        title: 'Support Team',
        dedupeKey: `support:${me!.id}`,
        participants: [me!.id, ...admins],
      });
      return { thread: toThread(thread) };
    }, { write: true });
  }

  static createThread(listingId: string, otherUserId: string): Promise<{ thread: Thread }> {
    return call((db, me) => {
      if (!listingId || !otherUserId) fail('listingId and otherUserId are required');
      if (otherUserId === me!.id) fail('You cannot start a thread with yourself');
      const listing = db.listings.find((l) => l.id === listingId) ?? fail('Listing not found', 404);
      if (!db.users.some((u) => u.id === otherUserId)) fail('User not found', 404);
      if (listing.sellerId !== me!.id && listing.sellerId !== otherUserId) {
        fail('Threads can only be started about a listing with its seller', 403);
      }
      const thread = getOrCreateThread(db, {
        listingId,
        type: 'listing',
        dedupeKey: listingThreadKey(me!.id, otherUserId, listingId),
        participants: [me!.id, otherUserId],
      });
      return { thread: toThread(thread) };
    }, { write: true });
  }

  static sendMessage(threadId: string, content: string): Promise<{ message: Message }> {
    return call((db, me) => {
      const text = sanitizeInput(content ?? '').trim();
      if (!text) fail('Message is empty');
      if (text.length > 2000) fail('Messages can be up to 2,000 characters');
      const thread = db.threads.find((t) => t.id === threadId) ?? fail('Thread not found', 404);
      if (!thread.participants.includes(me!.id)) fail('Unauthorized', 403);
      const message = insertMessage(db, threadId, me!.id, text);
      scheduleBotReply(db, thread, me!.id, text);
      return { message };
    }, { write: true });
  }

  static getThreads(): Promise<{ threads: Thread[] }> {
    return call((db, me) => ({
      threads: db.threads
        .filter((t) => t.participants.includes(me!.id))
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
        .map(toThread),
    }));
  }

  static getMessages(threadId: string): Promise<{ messages: Message[] }> {
    return call((db, me) => {
      const thread = db.threads.find((t) => t.id === threadId) ?? fail('Thread not found', 404);
      if (!thread.participants.includes(me!.id)) fail('Unauthorized', 403);
      return {
        messages: db.messages.filter((m) => m.threadId === threadId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      };
    });
  }

  static deleteMessage(messageId: string): Promise<{ success: boolean }> {
    return call((db, me) => {
      const m = db.messages.find((x) => x.id === messageId) ?? fail('Message not found', 404);
      if (m.senderId !== me!.id && me!.role !== 'admin') fail('Forbidden', 403);
      db.messages = db.messages.filter((x) => x.id !== messageId);
      return { success: true };
    }, { write: true });
  }

  // Ratings
  static createRating(offerId: string, rating: number, comment?: string): Promise<{ rating: Rating }> {
    return call((db, me) => {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail('Rating must be between 1 and 5');
      const o = db.offers.find((x) => x.id === offerId) ?? fail('Offer not found', 404);
      if (o.status !== 'completed') fail('Can only rate completed exchanges');
      if (me!.id !== o.buyerId && me!.id !== o.sellerId) fail('You can only rate exchanges you were part of', 403);
      if (db.ratings.some((r) => r.offerId === offerId && r.raterUserId === me!.id)) fail('You have already rated this exchange');
      const l = db.listings.find((x) => x.id === o.listingId);
      const r: Rating = {
        id: uid(),
        offerId,
        ratedUserId: o.sellerId === me!.id ? o.buyerId : o.sellerId,
        raterUserId: me!.id,
        rating,
        comment: sanitizeInput(comment ?? '').trim(),
        listingSnapshot: l ? { id: l.id, title: l.title, photoUrl: l.photos?.[0] ?? null } : undefined,
        createdAt: new Date().toISOString(),
      };
      db.ratings.push(r);
      return { rating: r };
    }, { write: true });
  }

  static getUserRatings(userId: string): Promise<{ ratings: Rating[] }> {
    return call((db) => ({
      ratings: db.ratings.filter((r) => r.ratedUserId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }));
  }

  static deleteRating(ratingId: string): Promise<{ success: boolean }> {
    return call((db, me) => {
      const r = db.ratings.find((x) => x.id === ratingId) ?? fail('Rating not found', 404);
      if (r.raterUserId !== me!.id && me!.role !== 'admin') fail('Forbidden', 403);
      db.ratings = db.ratings.filter((x) => x.id !== ratingId);
      return { success: true };
    }, { write: true });
  }

  // Profile
  static updateProfile(data: { name?: string; bio?: string; socialUrl?: string; profilePhotoUrl?: string }): Promise<{ user: User }> {
    return call((db, me) => {
      const u = me!;
      if (data.name !== undefined) {
        const n = sanitizeInput(data.name).trim();
        if (!n || n.length > 80) fail('Name must be 1-80 characters');
        u.name = n;
      }
      if (data.bio !== undefined) u.bio = sanitizeInput(data.bio).trim().slice(0, 500);
      if (data.socialUrl !== undefined) {
        const s = data.socialUrl.trim();
        if (s && !/^https:\/\//i.test(s)) fail('Social link must start with https://');
        u.socialUrl = s;
      }
      if (data.profilePhotoUrl !== undefined) u.profilePhotoUrl = data.profilePhotoUrl;
      return { user: toUser(db, u) };
    }, { write: true });
  }

  static getProfile(userId: string): Promise<{ profile: User }> {
    return call((db) => ({ profile: userById(db, userId) ?? fail('Profile not found', 404) }));
  }

  // Trending: active listings ranked by how many offers they've drawn.
  private static trending(filter: (l: StoredListing) => boolean, limit?: number) {
    return call((db) => {
      const items = db.listings
        .filter((l) => l.status === 'active' && !isExpired(l) && filter(l))
        .map((l) => ({ listing: toListing(db, l), offerCount: db.offers.filter((o) => o.listingId === l.id).length }))
        .filter((i) => i.offerCount > 0)
        .sort((a, b) => b.offerCount - a.offerCount || b.listing.createdAt.localeCompare(a.listing.createdAt));
      return { items: limit ? items.slice(0, limit) : items };
    });
  }

  static getTrendingByZip(zipCode: string) {
    return this.trending((l) => l.zipCode === zipCode, 5);
  }

  static getTrendingByCommunity(communityId: string) {
    return this.trending((l) => l.communityId === communityId);
  }

  // Upload: photos stay in this browser as downscaled data URLs.
  static async uploadPhoto(file: File): Promise<{ url: string }> {
    await call(() => null);
    return { url: await readImage(file) };
  }

  // Push: the demo has no push server, so this only records the permission.
  static registerPushToken(_token: string): Promise<{ success: boolean }> {
    return call(() => ({ success: true }));
  }
}
