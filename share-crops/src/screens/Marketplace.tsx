import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { API } from '@/lib/api';
import type { Listing } from '@/types';
import { isProduceInSeason } from '@/lib/seasonalProduce';
import { Icon } from '@/components/atoms/Icon';
import { ListingCard } from '@/components/ListingCard';
import { ListingGridSkeleton, Skeleton } from '@/components/atoms/Skeleton';
import { CreateListingSheet } from '@/components/modals/CreateListingSheet';
import { FindCommunitySheet } from '@/components/modals/FindCommunitySheet';
import { useAuth } from '@/context/AuthContext';

type SortKey = 'newest' | 'az' | 'trending';
type Density = 'grid' | 'list';
type Filter = 'community' | 'all' | 'global';

const SORT_LABEL: Record<SortKey, string> = { newest: 'Newest', az: 'A–Z', trending: 'Trending' };

function TrendingPanel({ items, communityName }: { items: Array<{ title: string; offers: number }>; communityName?: string }) {
  const top = items.filter((i) => i.offers > 0).slice(0, 3);
  if (top.length === 0) return null;
  return (
    <div className="trending">
      <div className="trending-header">
        {Icon.bolt(13)} MOST REQUESTED{communityName ? ` IN ${communityName.toUpperCase()}` : ''}
      </div>
      <div className="trending-list">
        {top.map((item, idx) => (
          <div key={item.title + idx} className="trending-item">
            <span className="num">{idx + 1}.</span>
            <span className="name">{item.title}</span>
            <span className="count">{item.offers} {item.offers === 1 ? 'offer' : 'offers'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [filter, setFilter] = useState<Filter>('community');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [density, setDensity] = useState<Density>('grid');
  const [showCreate, setShowCreate] = useState(false);
  const [showFindCommunity, setShowFindCommunity] = useState(false);

  const communitiesQuery = useQuery({
    queryKey: ['my-communities'],
    queryFn: () => API.getMyCommunities(),
  });
  const communities = communitiesQuery.data?.communities ?? [];
  const activeId = communitiesQuery.data?.activeCommunityId ?? communities[0]?.id ?? null;
  const community = communities.find((c) => c.id === activeId) ?? communities[0] ?? null;

  const listingsQuery = useInfiniteQuery({
    queryKey: ['listings', filter, activeId, community?.zipCode],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const base = { cursor: pageParam } as { communityId?: string; zipCode?: string; cursor?: string };
      if (filter === 'global') return API.getListings(base); // every community
      if (filter === 'community' && activeId) return API.getListings({ ...base, communityId: activeId });
      return API.getListings({ ...base, zipCode: community?.zipCode });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: filter === 'global' || !!community,
  });

  const trendingQuery = useQuery({
    queryKey: ['trending', activeId],
    queryFn: () => API.getTrendingByCommunity(activeId as string),
    enabled: !!activeId,
    staleTime: 60_000,
  });

  // listingId → { rank, offers } from the trending endpoint.
  const trendingMap = useMemo(() => {
    const m = new Map<string, { rank: number; offers: number }>();
    (trendingQuery.data?.items ?? []).forEach((it, idx) => {
      m.set(it.listing.id, { rank: idx + 1, offers: it.offerCount });
    });
    return m;
  }, [trendingQuery.data]);

  const listings = useMemo(
    () => (listingsQuery.data?.pages ?? []).flatMap((p) => p.listings),
    [listingsQuery.data]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = listings.filter(
      (l) => !q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
    );
    const sorters: Record<SortKey, (a: Listing, b: Listing) => number> = {
      newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      az: (a, b) => a.title.localeCompare(b.title),
      trending: (a, b) => (trendingMap.get(b.id)?.offers ?? 0) - (trendingMap.get(a.id)?.offers ?? 0),
    };
    return [...filtered].sort(sorters[sort]);
  }, [listings, search, sort, trendingMap]);

  const trendingItems = (trendingQuery.data?.items ?? []).map((it) => ({ title: it.listing.title, offers: it.offerCount }));

  const loading = communitiesQuery.isLoading || (!!community && listingsQuery.isLoading);

  return (
    <>
      <div className="app-header">
        <h1>Marketplace</h1>
        {community ? (
          <div className="subtitle">{community.name} · ZIP {community.zipCode} · {community.memberCount} members</div>
        ) : (
          <Skeleton width="60%" height={12} style={{ marginTop: 4 }} />
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className={`chip ${filter === 'community' ? 'active' : ''}`} onClick={() => setFilter('community')}>
            {community?.name ?? 'Community'}
          </button>
          <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ZIP {community?.zipCode ?? ''}
          </button>
          <button
            className={`chip ${filter === 'global' ? 'active' : ''}`}
            onClick={() => setShowFindCommunity(true)}
            style={{ marginLeft: 'auto' }}
          >
            {Icon.users(13)} {filter === 'global' ? 'All communities' : 'Community'}
          </button>
        </div>

        <div className="search-wrap" style={{ marginTop: 10 }}>
          {Icon.search}
          <input className="input" placeholder="Search produce…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 8 }}>
          <div className="segmented">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
              <button key={key} className={sort === key ? 'active' : ''} onClick={() => setSort(key)}>
                {SORT_LABEL[key]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-outline btn-icon"
              aria-label={density === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              title={density === 'grid' ? 'List view' : 'Grid view'}
              onClick={() => setDensity((d) => (d === 'grid' ? 'list' : 'grid'))}
            >
              {density === 'grid' ? Icon.list(16) : Icon.grid(16)}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>{Icon.plus(14)} List</button>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 24px' }}>
        {loading ? (
          <ListingGridSkeleton count={6} density={density} />
        ) : (
          <>
            <TrendingPanel items={trendingItems} communityName={community?.name} />
            {visible.length === 0 ? (
              <div className="empty-state">
                <div className="title">{search.trim() ? 'No matches' : 'No listings yet'}</div>
                <div className="desc">{search.trim() ? 'Try a different search.' : 'Be the first to list produce.'}</div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: density === 'list' ? '1fr' : 'repeat(auto-fill, minmax(175px, 1fr))',
                  gap: 10,
                }}
              >
                {visible.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    density={density}
                    inSeason={isProduceInSeason(l.title, l.description)}
                    rank={trendingMap.get(l.id)?.rank ?? null}
                    onClick={() => navigate(`/listing/${l.id}`)}
                  />
                ))}
              </div>
            )}
            {listingsQuery.hasNextPage && !search.trim() && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <button
                  className="btn btn-outline"
                  disabled={listingsQuery.isFetchingNextPage}
                  onClick={() => listingsQuery.fetchNextPage()}
                >
                  {listingsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && <CreateListingSheet onClose={() => setShowCreate(false)} />}
      {showFindCommunity && (
        <FindCommunitySheet
          onClose={() => setShowFindCommunity(false)}
          isAdmin={isAdmin}
          onViewAllCommunities={() => setFilter('global')}
        />
      )}
    </>
  );
}
