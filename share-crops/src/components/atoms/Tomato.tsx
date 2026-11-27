import React, { useState } from 'react';

export type RatingVariant = 'tomato' | 'dot' | 'bar';

export function Tomato({ filled, size = 14, hover = false }: { filled: boolean; size?: number; hover?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>
      <path
        d="M12 22C16.4183 22 20 18.4183 20 14C20 9.58172 16.4183 6 12 6C7.58172 6 4 9.58172 4 14C4 18.4183 7.58172 22 12 22Z"
        fill={filled ? (hover ? '#FF4655' : 'var(--tomato-filled)') : 'var(--tomato-empty)'}
      />
      <path
        d="M12 6V3M10 4.5C10 4.5 10.5 5.5 12 5.5C13.5 5.5 14 4.5 14 4.5M9 3C9 3 9.5 4 10.5 4.5M15 3C15 3 14.5 4 13.5 4.5"
        stroke="var(--stem-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        opacity={filled ? 1 : 0.5} fill="none"
      />
    </svg>
  );
}

export function RottenTomato({ filled, size = 14 }: { filled: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>
      <circle cx="12" cy="14" r="8" fill={filled ? 'var(--tomato-rotten)' : 'var(--tomato-empty)'} />
      {filled && (
        <>
          <path d="M9 11 Q10 12 11 11" stroke="rgba(0,0,0,.3)" strokeWidth=".6" strokeLinecap="round" fill="none" />
          <path d="M13 11 Q14 12 15 11" stroke="rgba(0,0,0,.3)" strokeWidth=".6" strokeLinecap="round" fill="none" />
          <path d="M8 14 Q9 15 10 14" stroke="rgba(0,0,0,.25)" strokeWidth=".6" strokeLinecap="round" fill="none" />
          <path d="M14 14 Q15 15 16 14" stroke="rgba(0,0,0,.25)" strokeWidth=".6" strokeLinecap="round" fill="none" />
        </>
      )}
      <path
        d="M12 6V3M10 4.5C10 4.5 10.5 5.5 12 5.5C13.5 5.5 14 4.5 14 4.5M9 3C9 3 9.5 4 10.5 4.5M15 3C15 3 14.5 4 13.5 4.5"
        stroke="var(--stem-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        opacity={filled ? 1 : 0.5} fill="none"
      />
    </svg>
  );
}

export function TomatoRow({
  rating,
  count,
  size = 14,
  variant = 'tomato',
}: {
  rating: number;
  count?: number;
  size?: number;
  variant?: RatingVariant;
}) {
  const r = Math.round(rating);
  return (
    <div className="tomato-row">
      <div className="tomatoes">
        {[1, 2, 3, 4, 5].map((v) => {
          if (variant === 'dot') {
            return (
              <span
                key={v}
                style={{
                  width: size * 0.7,
                  height: size * 0.7,
                  borderRadius: '50%',
                  background: v <= r ? 'var(--tomato-filled)' : 'var(--tomato-empty)',
                  display: 'inline-block',
                  marginRight: 2,
                }}
              />
            );
          }
          if (variant === 'bar') {
            return (
              <span
                key={v}
                style={{
                  width: size,
                  height: 4,
                  borderRadius: 2,
                  background: v <= r ? 'var(--primary)' : 'var(--border)',
                  display: 'inline-block',
                  marginRight: 2,
                }}
              />
            );
          }
          return v === 1 && r === 1 ? (
            <RottenTomato key={v} filled size={size} />
          ) : (
            <Tomato key={v} filled={v <= r} size={size} />
          );
        })}
      </div>
      <span className="text">
        {rating.toFixed(1)}
        {count !== undefined && ` · ${count}`}
      </span>
    </div>
  );
}

export function TomatoPicker({
  value,
  onChange,
  size = 36,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((v) => {
          const filled = v <= display;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              onMouseEnter={() => setHover(v)}
              onMouseLeave={() => setHover(0)}
              style={{ transition: 'transform .15s ease', transform: filled && v === display ? 'scale(1.1)' : 'scale(1)' }}
            >
              {v === 1 ? <RottenTomato filled={filled} size={size} /> : <Tomato filled={filled} size={size} />}
            </button>
          );
        })}
      </div>
      <div style={{ height: 18, fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)' }}>
        {display > 0 ? labels[display - 1] : 'Tap a tomato'}
      </div>
    </div>
  );
}
