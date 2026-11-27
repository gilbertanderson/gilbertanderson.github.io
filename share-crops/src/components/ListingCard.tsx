import React from 'react';
import type { Listing } from '@/types';
import { Icon } from '@/components/atoms/Icon';
import { TomatoRow, type RatingVariant } from '@/components/atoms/Tomato';
import { ImageWithFallback } from '@/components/atoms/ImageWithFallback';

export function ListingCard({
  listing,
  density = 'grid',
  ratingVariant = 'tomato',
  inSeason = false,
  rank = null,
  onClick,
}: {
  listing: Listing;
  density?: 'grid' | 'list';
  ratingVariant?: RatingVariant;
  inSeason?: boolean;
  rank?: number | null;
  onClick?: () => void;
}) {
  const seller = listing.seller;
  const completed = listing.status === 'completed';
  const klass = `listing-card density-${density}${inSeason ? ' in-season-card' : ''}`;

  return (
    <div className={klass} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className={`photo${completed ? ' completed' : ''}`}>
        <ImageWithFallback src={listing.photos?.[0]} alt={listing.title} className="" frameClassName="" style={{ width: '100%', height: '100%' }} />
        {inSeason && <span className="photo-badge badge-in-season">{Icon.check(11)} In Season</span>}
        {rank && <span className="photo-badge badge-rank">{Icon.bolt(12)} #{rank}</span>}
        {completed && <span className="photo-badge badge-completed">{Icon.check(11)} Exchanged</span>}
      </div>
      <div className="body">
        <div className="listing-title-row">
          <div className="listing-title">{listing.title}</div>
          <span className="zip-badge">{listing.zipCode}</span>
        </div>
        {rank && <div className="listing-rank-line">{Icon.bolt(11)} Community Rank #{rank}</div>}
        {listing.quantity && density !== 'list' && <div className="listing-qty">Qty: {listing.quantity}</div>}
        <div className="listing-desc">{listing.description}</div>
        {seller && <TomatoRow rating={seller.rating} count={seller.ratingCount} variant={ratingVariant} />}
      </div>
    </div>
  );
}
