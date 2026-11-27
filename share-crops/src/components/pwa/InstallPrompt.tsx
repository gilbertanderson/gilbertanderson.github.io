import React, { useState } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

type Props = {
  /** Compact bar above the tab bar (default) vs full card for profile/settings. */
  variant?: 'banner' | 'card';
};

/** Native install prompt (Chrome/Android) or iOS Add-to-Home-Screen instructions. */
export function InstallPrompt({ variant = 'banner' }: Props) {
  const { canInstall, showIosInstructions, isInstalled, install, dismiss } = usePwaInstall();
  const [busy, setBusy] = useState(false);

  if (isInstalled || (!canInstall && !showIosInstructions)) return null;

  const onInstall = async () => {
    setBusy(true);
    try {
      await install();
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'card') {
    return (
      <div className="pwa-install-card card">
        <div className="pwa-install-card-title">Install Share Crops</div>
        <p className="pwa-install-card-desc">
          {showIosInstructions
            ? 'Add this app to your Home Screen for quick access and a full-screen experience.'
            : 'Install on your device for faster launch and offline access to the app shell.'}
        </p>
        {showIosInstructions ? (
          <ol className="pwa-ios-steps">
            <li>Tap the <strong>Share</strong> button in Safari</li>
            <li>Choose <strong>Add to Home Screen</strong></li>
            <li>Tap <strong>Add</strong></li>
          </ol>
        ) : (
          <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={onInstall}>
            {busy ? 'Installing…' : 'Install app'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pwa-install-banner" role="region" aria-label="Install app">
      <div className="pwa-install-banner-text">
        {showIosInstructions ? (
          <>Install Share Crops — tap Share, then <strong>Add to Home Screen</strong></>
        ) : (
          <>Install Share Crops for quick access and offline browsing</>
        )}
      </div>
      <div className="pwa-install-banner-actions">
        {!showIosInstructions && (
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={onInstall}>
            {busy ? '…' : 'Install'}
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss} aria-label="Dismiss install prompt">
          Not now
        </button>
      </div>
    </div>
  );
}
