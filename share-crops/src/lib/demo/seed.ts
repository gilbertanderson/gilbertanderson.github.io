// Seed data for the static demo. Mirrors the Las Cimas mock listings migration
// from share-crops-v2 (supabase/migrations/20260627120000_las_cimas_mock_listings.sql),
// plus two more Austin communities so "find a community" has something to find.
// Every timestamp is relative to the moment the demo is first opened, so the
// listings never show up already expired.

import type { DemoDb, StoredUser } from './types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const LAS_CIMAS = '737f5af2-89ac-4392-bfdf-5a666d516311';
export const MUELLER = 'c2000000-0000-4000-8000-000000000002';
export const HYDE_PARK = 'c3000000-0000-4000-8000-000000000003';
export const TEAM_ID = 'share-crops-team';

// The Las Cimas photos are the same Unsplash images the production app uses.
const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop&q=70`;

// Newer demo listings get a generated tile instead of a guessed stock photo.
export function produceArt(emoji: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><radialGradient id="g" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="800" height="600" fill="${bg}"/><rect width="800" height="600" fill="url(#g)"/><text x="400" y="330" font-size="260" text-anchor="middle" dominant-baseline="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
const photoFor = (photo: string) => (photo.startsWith('art:') ? (() => { const [, e, bg] = photo.split(':'); return produceArt(e, bg); })() : unsplash(photo));

export function buildSeed(now = Date.now()): DemoDb {
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const ahead = (ms: number) => new Date(now + ms).toISOString();

  const users: StoredUser[] = [
    { id: TEAM_ID, email: 'team@sharecrops.example', name: 'Share Crops Team', bio: 'Here to help neighbors trade what they grow.', socialUrl: '', profilePhotoUrl: '', role: 'admin', createdAt: ago(200 * DAY), bot: true },
    { id: 'seller-mock-1', email: 'john@sharecrops.example', name: "John's Garden", bio: 'Fresh organic vegetables from our Las Cimas garden.', socialUrl: '', profilePhotoUrl: '', role: 'general', createdAt: ago(90 * DAY), bot: true },
    { id: 'seller-mock-2', email: 'alice@sharecrops.example', name: "Alice's Farmers Market", bio: 'Seasonal produce, always fresh from the neighborhood.', socialUrl: '', profilePhotoUrl: '', role: 'general', createdAt: ago(88 * DAY), bot: true },
    { id: 'seller-mock-3', email: 'bob@sharecrops.example', name: "Bob's Community Farm", bio: 'Supporting local agriculture in Las Cimas.', socialUrl: '', profilePhotoUrl: '', role: 'general', createdAt: ago(85 * DAY), bot: true },
    { id: 'seller-mock-4', email: 'maria@sharecrops.example', name: 'Maria Delgado', bio: 'Raised beds, two beehives and too much basil.', socialUrl: '', profilePhotoUrl: '', role: 'general', createdAt: ago(60 * DAY), bot: true },
    { id: 'seller-mock-5', email: 'dev@sharecrops.example', name: 'Dev Patel', bio: 'Balcony gardener. Chilies and microgreens.', socialUrl: '', profilePhotoUrl: '', role: 'general', createdAt: ago(40 * DAY), bot: true },
  ];

  const communities = [
    { id: LAS_CIMAS, name: 'Las Cimas', zipCode: '78724', createdBy: 'seller-mock-1', createdAt: ago(90 * DAY) },
    { id: MUELLER, name: 'Mueller Neighbors', zipCode: '78723', createdBy: 'seller-mock-4', createdAt: ago(60 * DAY) },
    { id: HYDE_PARK, name: 'Hyde Park Growers', zipCode: '78751', createdBy: 'seller-mock-5', createdAt: ago(40 * DAY) },
  ];

  const memberships = [
    ['seller-mock-1', LAS_CIMAS], ['seller-mock-2', LAS_CIMAS], ['seller-mock-3', LAS_CIMAS], ['seller-mock-4', LAS_CIMAS],
    ['seller-mock-4', MUELLER], ['seller-mock-5', MUELLER],
    ['seller-mock-5', HYDE_PARK], ['seller-mock-2', HYDE_PARK],
  ].map(([userId, communityId], i) => ({ userId, communityId, joinedAt: ago((80 - i) * DAY) }));

  type L = [id: string, seller: string, title: string, desc: string, qty: string, photo: string, lookingFor: string, community: string, zip: string, hoursAgo: number];
  const rows: L[] = [
    ['b1000001-0000-4000-8000-000000000001', 'seller-mock-1', 'Heirloom Tomatoes', 'Sweet, low-acid tomatoes picked this morning from our backyard vines.', '6 lbs', 'photo-1592924357228-91a4daadcfea', 'Fresh eggs', LAS_CIMAS, '78724', 3],
    ['b1000001-0000-4000-8000-000000000002', 'seller-mock-1', 'Jalapeño Peppers', 'Medium heat, great for salsa and pickling.', '2 lbs', 'photo-1583454110551-21f2fa2afe61', 'Cilantro', LAS_CIMAS, '78724', 20],
    ['b1000001-0000-4000-8000-000000000003', 'seller-mock-1', 'Okra', 'Tender pods, perfect for gumbo or roasting.', '3 lbs', 'photo-1607301405206-8f0f2ed006d2', '', LAS_CIMAS, '78724', 44],
    ['b1000001-0000-4000-8000-000000000004', 'seller-mock-1', 'Bell Peppers', 'Mixed red, yellow, and green. Crisp and sweet.', '8 ct', 'photo-1563565375-f3fdfdbefa83', 'Onions', LAS_CIMAS, '78724', 70],
    ['b1000002-0000-4000-8000-000000000001', 'seller-mock-2', 'Pasture-Raised Eggs', 'A dozen mixed brown and blue eggs from happy hens.', '1 dozen', 'photo-1582722872405-44c2f0049493', 'Sourdough', LAS_CIMAS, '78724', 5],
    ['b1000002-0000-4000-8000-000000000002', 'seller-mock-2', 'Blackberries', 'Wild-picked along the greenbelt. Sweet and juicy.', '3 pints', 'photo-1498557850523-fd3d118b963e', 'Peaches', LAS_CIMAS, '78724', 26],
    ['b1000002-0000-4000-8000-000000000003', 'seller-mock-2', 'Herb Bundle', 'Rosemary, thyme, and oregano bundled fresh.', '3 bunches', 'photo-1618375569909-3c8616cf7733', 'Tomatoes', LAS_CIMAS, '78724', 50],
    ['b1000002-0000-4000-8000-000000000004', 'seller-mock-2', 'Figs', 'Brown Turkey figs, tree-ripened and delicate.', '2 lbs', 'photo-1615485290382-441e4d049cb5', '', LAS_CIMAS, '78724', 96],
    ['b1000003-0000-4000-8000-000000000001', 'seller-mock-3', 'Sweet Potatoes', 'Orange-fleshed, cured and ready to roast.', '10 lbs', 'photo-1518977676601-b53f82aba655', 'Collard greens', LAS_CIMAS, '78724', 8],
    ['b1000003-0000-4000-8000-000000000002', 'seller-mock-3', 'Watermelon', 'Seedless Charleston Gray. Cold and sweet.', '2 melons', 'photo-1587049352846-4a222e784422', 'Cantaloupe', LAS_CIMAS, '78724', 30],
    ['b1000004-0000-4000-8000-000000000001', 'seller-mock-4', 'Wildflower Honey', 'Raw, unfiltered honey from two backyard hives.', '2 jars', 'art:🍯:#f3dfa2', 'Tomatoes or peppers', MUELLER, '78723', 12],
    ['b1000004-0000-4000-8000-000000000002', 'seller-mock-4', 'Genovese Basil', 'Big leafy bunches. Pesto season is here.', '4 bunches', 'art:🌿:#cfe5c4', 'Garlic', MUELLER, '78723', 15],
    ['b1000005-0000-4000-8000-000000000001', 'seller-mock-5', 'Thai Chilies', 'Small and fiery. Dry them or freeze them.', '1 pint', 'art:🌶️:#f4c7bd', 'Limes', MUELLER, '78723', 9],
    ['b1000005-0000-4000-8000-000000000002', 'seller-mock-5', 'Pea Shoots', 'Microgreens cut today, great on everything.', '2 clamshells', 'art:🌱:#d7ebcf', 'Herbs', HYDE_PARK, '78751', 6],
  ];

  const listings = rows.map(([id, sellerId, title, description, quantity, photo, lookingFor, communityId, zipCode, hoursAgo]) => ({
    id, sellerId, title, description, quantity, photos: [photoFor(photo)], lookingFor, communityId, zipCode,
    status: 'active' as const,
    createdAt: ago(hoursAgo * HOUR),
    expiresAt: ahead(14 * DAY - hoursAgo * HOUR),
  }));

  // A completed swap that already happened, so profiles open with real ratings
  // and the eggs/tomatoes listings rank as "most requested".
  const pastListing = {
    id: 'b1000009-0000-4000-8000-000000000009', sellerId: 'seller-mock-2', title: 'Meyer Lemons',
    description: 'Fragrant, thin-skinned lemons from a potted tree.', quantity: '12 ct',
    photos: [produceArt('🍋', '#f7efb0')], lookingFor: 'Herbs', communityId: LAS_CIMAS,
    zipCode: '78724', status: 'completed' as const, createdAt: ago(20 * DAY), expiresAt: ago(6 * DAY),
  };

  const offers = [
    { id: 'o-seed-1', listingId: rows[0][0], buyerId: 'seller-mock-2', sellerId: 'seller-mock-1', offeredProduce: 'Half dozen eggs', message: 'Would love a few for a salad!', status: 'pending' as const, createdAt: ago(2 * HOUR) },
    { id: 'o-seed-2', listingId: rows[0][0], buyerId: 'seller-mock-3', sellerId: 'seller-mock-1', offeredProduce: '2 lbs sweet potatoes', message: '', status: 'pending' as const, createdAt: ago(1 * HOUR) },
    { id: 'o-seed-3', listingId: rows[0][0], buyerId: 'seller-mock-4', sellerId: 'seller-mock-1', offeredProduce: 'A jar of honey', message: '', status: 'pending' as const, createdAt: ago(40 * 60 * 1000) },
    { id: 'o-seed-4', listingId: rows[4][0], buyerId: 'seller-mock-1', sellerId: 'seller-mock-2', offeredProduce: '1 lb jalapeños', message: '', status: 'pending' as const, createdAt: ago(4 * HOUR) },
    { id: 'o-seed-5', listingId: rows[4][0], buyerId: 'seller-mock-3', sellerId: 'seller-mock-2', offeredProduce: 'One watermelon', message: '', status: 'pending' as const, createdAt: ago(3 * HOUR) },
    { id: 'o-seed-6', listingId: rows[10][0], buyerId: 'seller-mock-5', sellerId: 'seller-mock-4', offeredProduce: '3 lbs tomatoes', message: '', status: 'pending' as const, createdAt: ago(6 * HOUR) },
    { id: 'o-seed-7', listingId: pastListing.id, buyerId: 'seller-mock-1', sellerId: 'seller-mock-2', offeredProduce: 'Herb bundle', message: '', status: 'completed' as const, createdAt: ago(19 * DAY), acceptedAt: ago(19 * DAY), completedAt: ago(18 * DAY) },
  ];

  const ratings = [
    { id: 'r-seed-1', offerId: 'o-seed-7', ratedUserId: 'seller-mock-2', raterUserId: 'seller-mock-1', rating: 5, comment: 'Lemons were perfect, and she threw in extra.', listingSnapshot: { id: pastListing.id, title: pastListing.title, photoUrl: pastListing.photos[0] }, createdAt: ago(18 * DAY) },
    { id: 'r-seed-2', offerId: 'o-seed-7', ratedUserId: 'seller-mock-1', raterUserId: 'seller-mock-2', rating: 4, comment: 'Easy pickup, great herbs.', listingSnapshot: { id: pastListing.id, title: pastListing.title, photoUrl: pastListing.photos[0] }, createdAt: ago(18 * DAY) },
  ];

  return {
    version: 1,
    users,
    passwords: {},
    communities,
    memberships,
    activeCommunity: {},
    listings: [...listings, pastListing],
    offers,
    threads: [],
    messages: [],
    ratings,
    events: [],
  };
}
