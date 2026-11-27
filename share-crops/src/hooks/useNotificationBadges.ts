import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { API } from '@/lib/api';

// Drives the bottom-nav tomato badges. A badge shows when there's a pending
// offer / chat message newer than the last time the user opened that tab, and
// clears the moment they navigate to it. Ported from the older Share Crops app.
const LS_OFFERS = 'sc_last_seen_offers';
const LS_MESSAGES = 'sc_last_seen_messages';
const EPOCH = '1970-01-01T00:00:00.000Z';

export function useNotificationBadges() {
  const location = useLocation();

  const [lastSeenOffers, setLastSeenOffers] = useState(() => localStorage.getItem(LS_OFFERS) ?? EPOCH);
  const [lastSeenMessages, setLastSeenMessages] = useState(() => localStorage.getItem(LS_MESSAGES) ?? EPOCH);

  const { data: offersData } = useQuery({
    queryKey: ['offers', 'seller'],
    queryFn: () => API.getMyOffers('seller'),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const { data: threadsData } = useQuery({
    queryKey: ['threads'],
    queryFn: () => API.getThreads(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  // Clear the relevant badge when the user lands on that tab.
  useEffect(() => {
    if (location.pathname.startsWith('/offers')) {
      const ts = new Date().toISOString();
      localStorage.setItem(LS_OFFERS, ts);
      setLastSeenOffers(ts);
    }
    if (location.pathname.startsWith('/messages')) {
      const ts = new Date().toISOString();
      localStorage.setItem(LS_MESSAGES, ts);
      setLastSeenMessages(ts);
    }
  }, [location.pathname]);

  const hasNewOffers = (offersData?.offers ?? []).some(
    (o) => o.status === 'pending' && o.createdAt > lastSeenOffers
  );
  const hasNewMessages = (threadsData?.threads ?? []).some(
    (t) => (t.lastMessageAt ?? '') > lastSeenMessages
  );

  return { hasNewOffers, hasNewMessages };
}
