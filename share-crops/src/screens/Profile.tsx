import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '@/lib/api';
import type { Rating } from '@/types';
import { useMe } from '@/hooks/useMe';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/atoms/Toast';
import { Avatar } from '@/components/atoms/Avatar';
import { TomatoRow } from '@/components/atoms/Tomato';
import { TomatoLoader } from '@/components/atoms/TomatoLoader';
import { ImageWithFallback } from '@/components/atoms/ImageWithFallback';
import { EditProfileSheet } from '@/components/modals/EditProfileSheet';
import { PushTokenError, requestPushToken } from '@/lib/firebaseMessaging';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { resetDemo } from '@/lib/demo/store';

function RatingCard({ rating }: { rating: Rating }) {
  const { data: rater } = useQuery({
    queryKey: ['profile', rating.raterUserId],
    queryFn: () => API.getProfile(rating.raterUserId).then((r) => r.profile),
    staleTime: 5 * 60_000,
  });
  return (
    <div className="card" style={{ padding: 14, display: 'flex', gap: 12 }}>
      <Avatar src={rater?.profilePhotoUrl} name={rater?.name} size={36} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{rater?.name ?? 'A neighbor'}</div>
        </div>
        <TomatoRow rating={rating.rating} size={12} />
        {rating.comment && (
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4, lineHeight: 1.45 }}>“{rating.comment}”</div>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const { data: me, isLoading } = useMe();
  const [showEdit, setShowEdit] = useState(false);
  const { isInstalled, canInstall, showIosInstructions } = usePwaInstall();

  const communitiesQuery = useQuery({ queryKey: ['my-communities'], queryFn: () => API.getMyCommunities() });
  const communities = communitiesQuery.data?.communities ?? [];
  const activeCommunityId = communitiesQuery.data?.activeCommunityId ?? null;

  // One member-preview query per community (avatars shown on each card).
  const memberPreviews = useQueries({
    queries: communities.map((c) => ({
      queryKey: ['community-members-preview', c.id],
      queryFn: () => API.getCommunityMembersPreview(c.id),
      staleTime: 60_000,
    })),
  });
  const membersByCommunity = Object.fromEntries(
    communities.map((c, i) => [c.id, memberPreviews[i]?.data?.members ?? []])
  );

  const leave = useMutation({
    mutationFn: (id: string) => API.leaveCommunity(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-communities'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
      showToast('Left community');
    },
    onError: (e: Error) => showToast(e.message || 'Could not leave community'),
  });

  const enablePush = useMutation({
    mutationFn: async () => {
      const token = await requestPushToken();
      await API.registerPushToken(token);
    },
    onSuccess: () => showToast('Notifications enabled'),
    onError: (e: Error) => {
      const message =
        e instanceof PushTokenError
          ? e.message
          : e.message || 'Could not enable notifications';
      showToast(message);
    },
  });

  const listingsQuery = useQuery({
    queryKey: ['my-listings', me?.id],
    queryFn: () => API.getUserListings(me!.id).then((r) => r.listings),
    enabled: !!me,
  });
  const ratingsQuery = useQuery({
    queryKey: ['my-ratings', me?.id],
    queryFn: () => API.getUserRatings(me!.id).then((r) => r.ratings),
    enabled: !!me,
  });
  const sellerOffers = useQuery({ queryKey: ['offers', 'seller'], queryFn: () => API.getMyOffers('seller') });
  const buyerOffers = useQuery({ queryKey: ['offers', 'buyer'], queryFn: () => API.getMyOffers('buyer') });

  if (isLoading || !me) {
    return <div className="center-fill" style={{ flex: 1 }}><TomatoLoader /></div>;
  }

  const listings = listingsQuery.data ?? [];
  const ratings = ratingsQuery.data ?? [];
  const exchanges =
    [...(sellerOffers.data?.offers ?? []), ...(buyerOffers.data?.offers ?? [])].filter((o) => o.status === 'completed').length;

  return (
    <>
      <div className="profile-hero">
        <Avatar src={me.profilePhotoUrl} name={me.name} size={88} />
        <div className="name">{me.name}</div>
        {me.ratingCount > 0 ? <TomatoRow rating={me.rating} count={me.ratingCount} size={16} /> : <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>No ratings yet</div>}
        {me.bio && <p className="bio">{me.bio}</p>}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setShowEdit(true)}>Edit Profile</button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat"><div className="num">{listings.length}</div><div className="lbl">Listings</div></div>
        <div className="stat"><div className="num">{exchanges}</div><div className="lbl">Exchanges</div></div>
        <div className="stat"><div className="num">{me.rating.toFixed(1)}</div><div className="lbl">Rating</div></div>
      </div>

      <div className="section-head"><h2>My Listings</h2></div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {listingsQuery.isLoading ? (
          <TomatoLoader size="sm" label="" className="loader-center" />
        ) : listings.length === 0 ? (
          <div className="empty-state"><div className="desc">You haven’t listed anything yet.</div></div>
        ) : (
          listings.map((l) => (
            <div key={l.id} className="listing-card density-list" style={{ cursor: 'pointer' }} onClick={() => navigate(`/listing/${l.id}`)}>
              <div className="photo"><ImageWithFallback src={l.photos?.[0]} alt={l.title} style={{ width: '100%', height: '100%' }} /></div>
              <div className="body">
                <div className="listing-title">{l.title}</div>
                <div className="listing-desc">{l.description}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 6, fontWeight: 600 }}>{l.status}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="section-head"><h2>My Communities</h2></div>
      <div style={{ padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {communitiesQuery.isLoading ? (
          <TomatoLoader size="sm" label="" className="loader-center" />
        ) : communities.length === 0 ? (
          <div className="empty-state"><div className="desc">You’re not in any communities yet.</div></div>
        ) : (
          communities.map((c) => {
            const members = membersByCommunity[c.id] ?? [];
            const visible = members.slice(0, 8);
            const overflow = c.memberCount - visible.length;
            return (
              <div key={c.id} className="card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                      ZIP {c.zipCode} · {c.memberCount} {c.memberCount === 1 ? 'member' : 'members'}
                    </div>
                    {activeCommunityId === c.id && (
                      <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginTop: 3 }}>Active community</div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-error-outline btn-sm"
                    disabled={leave.isPending}
                    onClick={() => { if (window.confirm(`Leave ${c.name}?`)) leave.mutate(c.id); }}
                  >
                    Leave
                  </button>
                </div>
                {visible.length > 0 && (
                  <div className="avatar-stack" style={{ marginTop: 12 }}>
                    {visible.map((m) => (
                      <Avatar key={m.id} src={m.profilePhotoUrl} name={m.name} size={32} />
                    ))}
                    {overflow > 0 && <div className="avatar-stack-more">+{overflow}</div>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="section-head"><h2>Recent Ratings</h2></div>
      <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ratings.length === 0 ? (
          <div className="empty-state"><div className="desc">No ratings yet.</div></div>
        ) : (
          ratings.map((r) => <RatingCard key={r.id} rating={r} />)
        )}
      </div>

      {!isInstalled && (canInstall || showIosInstructions) && (
        <div style={{ padding: '0 16px 16px' }}>
          <InstallPrompt variant="card" />
        </div>
      )}

      <div style={{ padding: '0 16px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 'fit-content', alignSelf: 'center' }}>
        <button
          className="btn btn-outline btn-sm"
          disabled={enablePush.isPending}
          onClick={() => enablePush.mutate()}
        >
          {enablePush.isPending ? 'Enabling…' : 'Enable notifications'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--muted-foreground)' }}
          onClick={() => {
            if (window.confirm('Reset the demo? This erases your account, listings and messages in this browser and restores the sample neighborhood.')) {
              resetDemo();
              window.location.reload();
            }
          }}
        >
          Reset demo data
        </button>
      </div>

      {showEdit && <EditProfileSheet user={me} onClose={() => setShowEdit(false)} />}
    </>
  );
}
