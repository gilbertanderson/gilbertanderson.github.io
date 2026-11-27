import React from 'react';
import { cn } from '@/lib/cn';

/** Plain-CSS shimmer skeleton block. Size via inline style or className. */
export function Skeleton({
  className,
  width,
  height,
  radius,
  style,
}: {
  className?: string;
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn('skeleton', className)}
      style={{ display: 'block', width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

/** Listing card skeleton — matches the gallery ListingCard footprint. */
export function ListingCardSkeleton({ density = 'grid' }: { density?: 'grid' | 'list' }) {
  if (density === 'list') {
    return (
      <div className="listing-card density-list" aria-hidden="true">
        <Skeleton className="sk-photo" width={96} height={96} radius={0} />
        <div className="body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="95%" height={11} />
          <Skeleton width="40%" height={11} />
        </div>
      </div>
    );
  }
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton className="sk-photo" radius={0} />
      <div className="sk-body">
        <Skeleton width="75%" height={14} />
        <Skeleton width="100%" height={11} />
        <Skeleton width="55%" height={11} />
      </div>
    </div>
  );
}

/** Grid of listing skeletons for the Marketplace loading state. */
export function ListingGridSkeleton({ count = 6, density = 'grid' }: { count?: number; density?: 'grid' | 'list' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: density === 'list' ? '1fr' : '1fr 1fr', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} density={density} />
      ))}
    </div>
  );
}

/** Chat thread-row skeletons for the Messages list loading state. */
export function ThreadRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="thread-row" style={{ cursor: 'default' }}>
          <Skeleton width={44} height={44} radius={9999} />
          <div className="info" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width="45%" height={13} />
            <Skeleton width="80%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}
