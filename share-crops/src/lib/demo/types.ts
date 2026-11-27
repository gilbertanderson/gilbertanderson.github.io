import type { User, Community, Listing, Offer, Rating } from '@/types';

export type StoredUser = Omit<User, 'rating' | 'ratingCount'> & {
  /** Simulated neighbor: replies to messages and answers offers on its own. */
  bot?: boolean;
};

export type StoredCommunity = Omit<Community, 'memberCount'>;
export type StoredListing = Omit<Listing, 'seller'>;
export type StoredOffer = Omit<Offer, 'listing' | 'buyer' | 'seller'>;

export interface StoredThread {
  id: string;
  listingId: string;
  type: 'listing' | 'support';
  title?: string;
  dedupeKey: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface StoredMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

/** Something a simulated neighbor will do a few seconds from now. */
export type DemoEvent =
  | { at: number; kind: 'reply'; threadId: string; fromId: string; text: string }
  | { at: number; kind: 'answer-offer'; offerId: string; accept: boolean }
  | { at: number; kind: 'neighbor-offer'; listingId: string; fromId: string; produce: string; message: string }
  | { at: number; kind: 'rate-back'; offerId: string; fromId: string };

export interface DemoDb {
  version: 1;
  users: StoredUser[];
  /** userId → SHA-256 of "share-crops:" + password. Local only, never sent anywhere. */
  passwords: Record<string, string>;
  communities: StoredCommunity[];
  memberships: Array<{ userId: string; communityId: string; joinedAt: string }>;
  activeCommunity: Record<string, string | null>;
  listings: StoredListing[];
  offers: StoredOffer[];
  threads: StoredThread[];
  messages: StoredMessage[];
  ratings: Rating[];
  events: DemoEvent[];
}
