import React, { useState } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from '@/components/atoms/Icon';

/**
 * Image wrapper that shows a shimmer skeleton until the image loads (or a
 * neutral produce placeholder if it fails). Lazy-loads by default.
 *
 * The <img> is rendered first so the skeleton/placeholder paint *over* it —
 * this hides the browser's broken-image alt text while loading or on error.
 */
export function ImageWithFallback({
  src,
  alt,
  className,
  frameClassName,
  style,
  rounded,
}: {
  src?: string;
  alt?: string;
  className?: string;
  frameClassName?: string;
  style?: React.CSSProperties;
  rounded?: number | string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <span className={cn('img-frame', frameClassName)} style={{ borderRadius: rounded, ...style }}>
      {src && (
        <img
          src={src}
          alt={alt || ''}
          loading="lazy"
          className={cn(className, loaded && 'loaded')}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
      {!loaded && !errored && src && <span className="img-skeleton skeleton" />}
      {(errored || !src) && (
        <span className="img-placeholder" aria-hidden>
          {Icon.leaf(26)}
        </span>
      )}
    </span>
  );
}
