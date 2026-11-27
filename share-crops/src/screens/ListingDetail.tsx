import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API } from '@/lib/api';
import { useMe } from '@/hooks/useMe';
import { useAuth } from '@/context/AuthContext';
import { isProduceInSeason } from '@/lib/seasonalProduce';
import { Icon } from '@/components/atoms/Icon';
import { Avatar } from '@/components/atoms/Avatar';
import { TomatoRow } from '@/components/atoms/Tomato';
import { TomatoLoader } from '@/components/atoms/TomatoLoader';
import { ImageWithFallback } from '@/components/atoms/ImageWithFallback';
import { MakeOfferSheet } from '@/components/modals/MakeOfferSheet';
import { useToast } from '@/components/atoms/Toast';

function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [showOffer, setShowOffer] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => API.getListing(id as string),
    enabled: !!id,
  });
  const listing = data?.listing;

  const startThread = useMutation({
    mutationFn: () => API.createThread(listing!.id, listing!.sellerId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['threads'] });
      navigate(`/messages/${res.thread.id}`);
    },
    onError: (e: Error) => showToast(e.message || 'Could not start chat'),
  });

  const remove = useMutation({
    mutationFn: () => API.deleteListing(listing!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      showToast('Listing deleted');
      navigate('/marketplace', { replace: true });
    },
    onError: (e: Error) => showToast(e.message || 'Could not delete listing'),
  });

  if (isLoading) {
    return <div className="center-fill" style={{ flex: 1 }}><TomatoLoader /></div>;
  }
  if (!listing) {
    return (
      <div className="empty-state" style={{ marginTop: 40 }}>
        <div className="title">Listing not found</div>
        <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/marketplace')}>Back to market</button>
      </div>
    );
  }

  const isMine = me?.id === listing.sellerId;
  const canDelete = isMine || isAdmin;
  const canTransact = !isMine && listing.status === 'active';
  const inSeason = isProduceInSeason(listing.title, listing.description);
  const seller = listing.seller;

  return (
    <>
      <div className="app-header">
        <button className="detail-back" onClick={() => navigate(-1)}>{Icon.back} Back</button>
      </div>
      <div className="scroll-area" tabIndex={0} role="region" aria-label="Listing details" style={{ padding: '16px 16px 0' }}>
        <div className="detail-photo">
          <ImageWithFallback src={listing.photos?.[0]} alt={listing.title} style={{ width: '100%', height: '100%' }} />
        </div>
        <div style={{ marginTop: 18 }}>
          <h1 className="detail-title">{listing.title}</h1>
          <div className="tag-row">
            {inSeason && <span className="tag tag-primary">{Icon.check(11)} In Season</span>}
            {listing.status === 'completed' && <span className="tag tag-success">{Icon.check(11)} Exchanged</span>}
            <span className="tag" style={{ background: 'var(--success)', color: 'white' }}>ZIP {listing.zipCode}</span>
          </div>
          {listing.quantity && (
            <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginTop: 12, fontWeight: 500 }}>Quantity: {listing.quantity}</p>
          )}
          {listing.lookingFor && (
            <div className="looking-for" style={{ marginTop: 14 }}>
              <div className="label">Looking for</div>
              <div className="value">{listing.lookingFor}</div>
            </div>
          )}
          <p style={{ fontSize: 14, lineHeight: 1.55, marginTop: 14 }}>{listing.description}</p>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 14 }}>
            {listing.expiresAt
              ? `Expires in ${daysLeft(listing.expiresAt)} days`
              : 'Does not expire'}
          </p>

          {seller && (
            <div className="seller-card">
              <Avatar src={seller.profilePhotoUrl} name={seller.name} size={44} />
              <div style={{ flex: 1 }}>
                <div className="name">{seller.name}</div>
                <TomatoRow rating={seller.rating} count={seller.ratingCount} />
              </div>
            </div>
          )}
          <div style={{ height: 80 }} />
        </div>
      </div>

      {(canDelete || canTransact) && (
        <div className="action-bar">
          {canTransact && (
            <>
              <button className="btn btn-outline" disabled={startThread.isPending} onClick={() => startThread.mutate()}>
                {Icon.message} Message
              </button>
              <button className="btn btn-primary" onClick={() => setShowOffer(true)}>Make Offer</button>
            </>
          )}
          {canDelete && (
            <button
              className="btn btn-error-outline"
              style={{ flex: canTransact ? undefined : 1 }}
              disabled={remove.isPending}
              onClick={() => {
                const prompt = isAdmin && !isMine
                  ? `Remove "${listing.title}" by ${seller?.name ?? 'this neighbor'}? This cannot be undone.`
                  : 'Delete this listing? This cannot be undone.';
                if (window.confirm(prompt)) remove.mutate();
              }}
            >
              {remove.isPending ? 'Deleting…' : isAdmin && !isMine ? 'Delete (admin)' : 'Delete Listing'}
            </button>
          )}
        </div>
      )}

      {showOffer && <MakeOfferSheet listing={listing} onClose={() => setShowOffer(false)} />}
    </>
  );
}
