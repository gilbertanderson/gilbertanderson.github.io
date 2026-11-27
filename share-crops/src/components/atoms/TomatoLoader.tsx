import React, { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

type TomatoLoaderSize = 'sm' | 'md' | 'lg';

interface TomatoLoaderProps {
  label?: string;
  size?: TomatoLoaderSize;
  className?: string;
}

// SVG fill: y=44 (empty) → y=12 (full), height 0 → 32
const FILL_TOP = 12;
const FILL_BOTTOM = 44;
const FILL_RANGE = FILL_BOTTOM - FILL_TOP; // 32

/**
 * Animated tomato loader. JS-driven fill rises from empty to full, then a
 * complete-pop tomato appears. Respects prefers-reduced-motion.
 * Ported from the original app and re-styled with plain CSS.
 */
export function TomatoLoader({ label = 'Loading...', size = 'md', className }: TomatoLoaderProps) {
  const clipPathId = useId().replace(/:/g, '');
  const fillRef = useRef<SVGRectElement>(null);
  const rafRef = useRef<number>(0);
  const [showFullTomato, setShowFullTomato] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShowFullTomato(true);
      return;
    }

    const startTime = performance.now();
    const TIME_CONSTANT = 700; // ms
    const FULL_TOMATO_AT = 900; // ms

    const tick = (now: number) => {
      // In some browsers the first RAF timestamp can be fractionally earlier
      // than a freshly captured performance.now(), so clamp before deriving SVG
      // dimensions. SVG rejects negative rect heights, even tiny sub-pixel ones.
      const elapsed = Math.max(0, now - startTime);
      const progress = Math.min(1, Math.max(0, 1 - Math.exp(-elapsed / TIME_CONSTANT)));
      const y = FILL_BOTTOM - progress * FILL_RANGE;
      const height = progress * FILL_RANGE;

      if (fillRef.current) {
        fillRef.current.setAttribute('y', String(y));
        fillRef.current.setAttribute('height', String(height));
      }

      if (elapsed >= FULL_TOMATO_AT) {
        if (fillRef.current) {
          fillRef.current.setAttribute('y', String(FILL_TOP));
          fillRef.current.setAttribute('height', String(FILL_RANGE));
        }
        setShowFullTomato(true);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div role="status" aria-live="polite" className={cn('tomato-loader', `tomato-loader-${size}`, className)}>
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs>
          <clipPath id={clipPathId}>
            <circle cx="24" cy="28" r="16" />
          </clipPath>
        </defs>

        <circle cx="24" cy="28" r="16" fill="var(--tomato-empty)" />

        <g clipPath={`url(#${clipPathId})`}>
          <rect ref={fillRef} x="8" y={FILL_BOTTOM} width="32" height="0" fill="var(--tomato-filled)" />
        </g>

        <circle
          className={cn('tomato-loader-full-fill', showFullTomato && 'visible tomato-complete-pop')}
          cx="24"
          cy="28"
          r="16"
          fill="var(--tomato-filled)"
        />

        <path
          d="M24 12V8M20 10.5C20 10.5 21 12 24 12C27 12 28 10.5 28 10.5M18 8C18 8 19 10 22 11M30 8C30 8 29 10 26 11"
          stroke="#4a7c3f"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {label ? <p className="tl-label">{label}</p> : null}
    </div>
  );
}
