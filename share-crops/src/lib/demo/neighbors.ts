// Simulated neighbors. A marketplace demo with nobody on the other side is a
// dead end, so the seeded neighbors act on a short delay: they accept your
// offers, reply to your messages, make offers on what you list and rate you
// back after a trade. Each action is queued as a timed event in the db, so it
// still happens if you reload or switch tabs in the meantime.

import type { DemoDb, DemoEvent, StoredListing, StoredOffer, StoredThread } from './types';
import { TEAM_ID } from './seed';
import { getOrCreateThread, insertMessage, listingThreadKey } from '@/lib/api';
import { load, save, notifyChanged, uid } from './store';

const isBot = (db: DemoDb, id: string) => !!db.users.find((u) => u.id === id)?.bot;
const firstName = (db: DemoDb, id: string) => (db.users.find((u) => u.id === id)?.name ?? 'Neighbor').split(/[ ']/)[0];
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

function queue(db: DemoDb, e: DemoEvent) {
  db.events.push(e);
}

export function scheduleOfferAnswer(db: DemoDb, offer: StoredOffer) {
  if (!isBot(db, offer.sellerId)) return;
  queue(db, { at: Date.now() + 4000, kind: 'answer-offer', offerId: offer.id, accept: true });
}

export function scheduleBotReply(db: DemoDb, thread: StoredThread, senderId: string, text: string) {
  const bot = thread.participants.find((p) => p !== senderId && isBot(db, p));
  if (!bot) return;
  // One pending reply per thread is plenty.
  if (db.events.some((e) => e.kind === 'reply' && e.threadId === thread.id)) return;
  queue(db, { at: Date.now() + 2500, kind: 'reply', threadId: thread.id, fromId: bot, text: replyTo(db, thread, text) });
}

export function scheduleNeighborOffer(db: DemoDb, listing: StoredListing, ownerId: string) {
  const neighbors = db.memberships
    .filter((m) => m.communityId === listing.communityId && m.userId !== ownerId && isBot(db, m.userId))
    .map((m) => m.userId);
  // A brand-new community has nobody in it yet; someone from Las Cimas wanders by.
  const from = neighbors.length ? pick(neighbors) : 'seller-mock-2';
  const produce = pick(['Half dozen eggs', 'A bunch of basil', '2 lbs sweet potatoes', 'A jar of honey', 'A pint of blackberries']);
  queue(db, {
    at: Date.now() + 8000,
    kind: 'neighbor-offer',
    listingId: listing.id,
    fromId: from,
    produce,
    message: `Hi! Your ${listing.title.toLowerCase()} look great. Would you trade for ${produce.toLowerCase()}?`,
  });
}

export function scheduleRateBack(db: DemoDb, offer: StoredOffer, actorId: string) {
  const other = offer.buyerId === actorId ? offer.sellerId : offer.buyerId;
  if (!isBot(db, other)) return;
  queue(db, { at: Date.now() + 3000, kind: 'rate-back', offerId: offer.id, fromId: other });
}

function replyTo(db: DemoDb, thread: StoredThread, text: string): string {
  const t = text.toLowerCase();
  if (thread.type === 'support') {
    return "Thanks for reaching out! This is the demo version of Share Crops, so everything you do stays in your browser. Try making an offer on a listing; the seller usually answers within a few seconds.";
  }
  const listing = db.listings.find((l) => l.id === thread.listingId);
  const item = listing?.title.toLowerCase() ?? 'them';
  if (/\b(when|time|today|tomorrow|pick ?up|meet)\b/.test(t)) {
    return pick([
      'I’m around after 5 most days. Porch pickup works too, just text when you’re close.',
      'Tomorrow morning works! I’ll leave them on the porch in a cooler.',
    ]);
  }
  if (/\b(where|address|location)\b/.test(t)) return 'We’re near the community garden on the north side. I’ll send the exact spot once we pick a time.';
  if (/\b(thank|thanks|thx)\b/.test(t)) return 'Anytime! Enjoy, and let me know how they turn out.';
  if (/\b(still|available|left)\b/.test(t)) return `Yep, still have the ${item}. Want me to hold some for you?`;
  return pick([
    `Hi ${firstName(db, thread.participants.find((p) => !isBot(db, p)) ?? '')}! Happy to trade. The ${item} are fresh this week.`,
    'Sounds good to me! Make an offer on the listing and I’ll accept it.',
    'Great, that works. What time is good for you?',
  ]);
}

/** Apply every queued event that's due. Returns true if anything changed. */
export function runDueEvents(db: DemoDb, now = Date.now()): boolean {
  const due = db.events.filter((e) => e.at <= now);
  if (due.length === 0) return false;
  db.events = db.events.filter((e) => e.at > now);

  for (const e of due) {
    switch (e.kind) {
      case 'reply': {
        if (db.threads.some((t) => t.id === e.threadId)) insertMessage(db, e.threadId, e.fromId, e.text);
        break;
      }
      case 'answer-offer': {
        const o = db.offers.find((x) => x.id === e.offerId);
        if (!o || o.status !== 'pending') break;
        o.status = e.accept ? 'accepted' : 'declined';
        o[e.accept ? 'acceptedAt' : 'declinedAt'] = new Date(now).toISOString();
        const listing = db.listings.find((l) => l.id === o.listingId);
        const thread = getOrCreateThread(db, {
          listingId: o.listingId,
          type: 'listing',
          dedupeKey: listingThreadKey(o.buyerId, o.sellerId, o.listingId),
          participants: [o.buyerId, o.sellerId],
        });
        insertMessage(
          db,
          thread.id,
          o.sellerId,
          `Accepted! ${o.offeredProduce} for the ${listing?.title.toLowerCase() ?? 'produce'} sounds fair. When works for pickup? Once we've swapped, mark it completed under Offers.`,
        );
        break;
      }
      case 'neighbor-offer': {
        const listing = db.listings.find((l) => l.id === e.listingId);
        if (!listing || listing.status !== 'active') break;
        db.offers.push({
          id: uid(),
          listingId: listing.id,
          buyerId: e.fromId,
          sellerId: listing.sellerId,
          offeredProduce: e.produce,
          message: e.message,
          status: 'pending',
          createdAt: new Date(now).toISOString(),
        });
        break;
      }
      case 'rate-back': {
        const o = db.offers.find((x) => x.id === e.offerId);
        if (!o || db.ratings.some((r) => r.offerId === o.id && r.raterUserId === e.fromId)) break;
        const l = db.listings.find((x) => x.id === o.listingId);
        db.ratings.push({
          id: uid(),
          offerId: o.id,
          ratedUserId: o.buyerId === e.fromId ? o.sellerId : o.buyerId,
          raterUserId: e.fromId,
          rating: 5,
          comment: pick(['Smooth trade, would swap again!', 'Friendly and on time. Thanks, neighbor!', 'Great produce and easy pickup.']),
          listingSnapshot: l ? { id: l.id, title: l.title, photoUrl: l.photos?.[0] ?? null } : undefined,
          createdAt: new Date(now).toISOString(),
        });
        break;
      }
    }
  }
  return true;
}

/** Welcome message from the team the first time someone joins. */
export function welcome(db: DemoDb, userId: string) {
  const thread = getOrCreateThread(db, {
    listingId: '',
    type: 'support',
    title: 'Support Team',
    dedupeKey: `support:${userId}`,
    participants: [userId, TEAM_ID],
  });
  if (!db.messages.some((m) => m.threadId === thread.id)) {
    insertMessage(
      db,
      thread.id,
      TEAM_ID,
      'Welcome to Share Crops! This demo runs entirely in your browser. Browse the market, make an offer, and the neighbors will answer in a few seconds. You can reset everything from your profile.',
    );
  }
}

/** Polls for due events while the app is open so replies show up on their own. */
export function startNeighborClock() {
  setInterval(() => {
    const db = load();
    if (runDueEvents(db)) {
      save(db);
      notifyChanged();
    }
  }, 1000);
}

/** Offline stand-in for the production app's Claude-drafted description. */
export function draftDescription(title: string, notes?: string): string {
  const qty = notes?.match(/Quantity:\s*([^.]+)/i)?.[1]?.trim();
  const want = notes?.match(/Looking for:\s*([^.]+)/i)?.[1]?.trim();
  const item = title.trim();
  const lead = pick([
    `Fresh ${item.toLowerCase()} from my garden, picked this week.`,
    `Homegrown ${item.toLowerCase()}, grown without synthetic sprays.`,
    `Backyard ${item.toLowerCase()}, ready to share with neighbors.`,
  ]);
  const parts = [lead];
  if (qty) parts.push(`About ${qty} available.`);
  parts.push(want ? `Happy to trade for ${want.toLowerCase()}.` : 'Open to trades. Make me an offer!');
  return parts.join(' ').slice(0, 200);
}
