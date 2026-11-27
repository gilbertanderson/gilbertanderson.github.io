import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API } from '@/lib/api';
import type { Offer } from '@/types';
import { TomatoLoader } from '@/components/atoms/TomatoLoader';
import { ImageWithFallback } from '@/components/atoms/ImageWithFallback';
import { RatingSheet } from '@/components/modals/RatingSheet';
import { useToast } from '@/components/atoms/Toast';

const STATUS_CLASS: Record<Offer['status'], string> = {
  pending: 'status-pending',
  accepted: 'status-accepted',
  completed: 'status-completed',
  declined: 'status-declined',
};

function OfferCard({
  offer,
  viewAs,
  onRate,
}: {
  offer: Offer;
  viewAs: 'buyer' | 'seller';
  onRate: (offerId: string) => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const listing = offer.listing;
  const other = viewAs === 'buyer' ? offer.seller : offer.buyer;

  const act = useMutation({
    mutationFn: (action: 'accept' | 'decline' | 'complete') =>
      action === 'accept' ? API.acceptOffer(offer.id) : action === 'decline' ? API.declineOffer(offer.id) : API.completeOffer(offer.id),
    onSuccess: (_res, action) => {
      qc.invalidateQueries({ queryKey: ['offers'] });
      showToast(action === 'accept' ? 'Offer accepted' : action === 'decline' ? 'Offer declined' : 'Marked completed');
    },
    onError: (e: Error) => showToast(e.message || 'Action failed'),
  });

  return (
    <div className="offer-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div
          style={{ display: 'flex', gap: 10, flex: 1, minWidth: 0, cursor: listing ? 'pointer' : 'default' }}
          onClick={() => listing && navigate(`/listing/${listing.id}`)}
        >
          {listing?.photos?.[0] && (
            <ImageWithFallback src={listing.photos[0]} alt="" rounded={8} style={{ width: 44, height: 44, flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {listing?.title ?? 'Listing'}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>
              {viewAs === 'buyer' ? 'Seller' : 'Buyer'}: {other?.name ?? '—'}
            </div>
          </div>
        </div>
        <span className={`status-pill ${STATUS_CLASS[offer.status]}`}>{offer.status}</span>
      </div>

      <div className="offer-bubble">
        <div className="label">{viewAs === 'buyer' ? 'Your offer' : 'Their offer'}</div>
        <div className="value">{offer.offeredProduce}</div>
        {offer.message && <div className="msg">{offer.message}</div>}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {viewAs === 'seller' && offer.status === 'pending' && (
          <>
            <button className="btn btn-success btn-sm" style={{ flex: 1 }} disabled={act.isPending} onClick={() => act.mutate('accept')}>Accept</button>
            <button className="btn btn-outline btn-sm" style={{ flex: 1 }} disabled={act.isPending} onClick={() => act.mutate('decline')}>Decline</button>
          </>
        )}
        {offer.status === 'accepted' && (
          <button className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={act.isPending} onClick={() => act.mutate('complete')}>Mark as Completed</button>
        )}
        {offer.status === 'completed' && (
          <button className="btn btn-accent btn-sm" style={{ flex: 1 }} onClick={() => onRate(offer.id)}>Rate Exchange</button>
        )}
      </div>
    </div>
  );
}

export default function Offers() {
  const [tab, setTab] = useState<'buyer' | 'seller'>('buyer');
  const [rateOfferId, setRateOfferId] = useState<string | null>(null);

  const buyerQuery = useQuery({ queryKey: ['offers', 'buyer'], queryFn: () => API.getMyOffers('buyer') });
  const sellerQuery = useQuery({ queryKey: ['offers', 'seller'], queryFn: () => API.getMyOffers('seller') });

  const buyerOffers = buyerQuery.data?.offers ?? [];
  const sellerOffers = sellerQuery.data?.offers ?? [];
  const list = tab === 'buyer' ? buyerOffers : sellerOffers;
  const loading = buyerQuery.isLoading || sellerQuery.isLoading;

  return (
    <>
      <div className="app-header">
        <h1>My Offers</h1>
        <div style={{ marginTop: 10 }}>
          <div className="segmented">
            <button className={tab === 'buyer' ? 'active' : ''} onClick={() => setTab('buyer')}>Outgoing ({buyerOffers.length})</button>
            <button className={tab === 'seller' ? 'active' : ''} onClick={() => setTab('seller')}>Incoming ({sellerOffers.length})</button>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <TomatoLoader className="loader-center" />
        ) : list.length === 0 ? (
          <div className="empty-state">
            <div className="title">No offers yet</div>
            <div className="desc">{tab === 'buyer' ? 'Make offers on listings to start bartering.' : 'Offers on your listings will appear here.'}</div>
          </div>
        ) : (
          list.map((o) => <OfferCard key={o.id} offer={o} viewAs={tab} onRate={setRateOfferId} />)
        )}
      </div>

      {rateOfferId && <RatingSheet offerId={rateOfferId} onClose={() => setRateOfferId(null)} />}
    </>
  );
}
