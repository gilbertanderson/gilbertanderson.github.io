import React, { useEffect, useState } from 'react';
import { applyServiceWorkerUpdate, onServiceWorkerUpdate } from '@/lib/serviceWorker';

/** Prompts the user to reload when a new service-worker version is waiting. */
export function AppUpdatePrompt() {
  const [ready, setReady] = useState(false);

  useEffect(() => onServiceWorkerUpdate(() => setReady(true)), []);

  if (!ready) return null;

  return (
    <div className="pwa-update-banner" role="status">
      <span>A new version of Share Crops is ready.</span>
      <button type="button" className="btn btn-primary btn-sm" onClick={applyServiceWorkerUpdate}>
        Refresh
      </button>
    </div>
  );
}
