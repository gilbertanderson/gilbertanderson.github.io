import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/** Thin banner when the device loses network — API calls will fail until back online. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="pwa-offline-banner" role="status" aria-live="polite">
      You&apos;re offline — browsing cached pages works, but listings and messages need a connection.
    </div>
  );
}
