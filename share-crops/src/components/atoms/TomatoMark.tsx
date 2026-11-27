import React from 'react';

// The "brand" tomato — a fuller, leafy-crowned glyph (ported from the older
// Share Crops app). Used for the login logo and the bottom-nav badge so the
// two read as the same mark at different sizes.
export function TomatoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none" style={{ display: 'block' }}>
      <circle cx="24" cy="28" r="16" fill="var(--tomato-filled)" />
      <path
        d="M24 12V8M20 10.5C20 10.5 21 12 24 12C27 12 28 10.5 28 10.5M18 8C18 8 19 10 22 11M30 8C30 8 29 10 26 11"
        stroke="var(--stem-green)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
