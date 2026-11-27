export type UserRole = 'admin' | 'general';

export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  socialUrl?: string;
  profilePhotoUrl?: string;
  rating: number;
  ratingCount: number;
  role: UserRole;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  zipCode: string;
  createdBy: string;
  memberCount: number;
  createdAt: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  quantity?: string;
  photos: string[];
  lookingFor?: string;
  communityId?: string;
  zipCode: string;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string | null;
  seller?: User;
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  offeredProduce: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  completedAt?: string;
  listing?: Listing;
  buyer?: User;
  seller?: User;
}

export interface Thread {
  id: string;
  listingId: string;
  type?: 'listing' | 'support';
  title?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  offerId: string;
  ratedUserId: string;
  raterUserId: string;
  rating: number;
  comment?: string;
  listingSnapshot?: {
    id: string;
    title: string;
    photoUrl?: string | null;
  };
  createdAt: string;
}
