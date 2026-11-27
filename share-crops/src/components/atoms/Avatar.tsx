import React, { useState } from 'react';

export function Avatar({ src, name, size = 36 }: { src?: string | null; name?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {showImg ? (
        <img src={src} alt={name || ''} onError={() => setFailed(true)} />
      ) : (
        (name || '?').charAt(0).toUpperCase()
      )}
    </div>
  );
}
