import { useCallback, useEffect, useState } from 'react';
import {
  type BeforeInstallPromptEvent,
  dismissInstallPrompt,
  isIosSafari,
  isStandalonePwa,
  wasInstallPromptDismissed,
} from '@/lib/pwa';

export type PwaInstallState = {
  /** User can tap Install (Chrome/Edge/Android). */
  canInstall: boolean;
  /** Show iOS “Add to Home Screen” instructions instead of a native prompt. */
  showIosInstructions: boolean;
  /** Already running as an installed PWA. */
  isInstalled: boolean;
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  dismiss: () => void;
};

export function usePwaInstall(): PwaInstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalonePwa);
  const [dismissed, setDismissed] = useState(wasInstallPromptDismissed);

  useEffect(() => {
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferred) return 'unavailable';
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') {
      setDeferred(null);
      setInstalled(true);
    }
    return outcome;
  }, [deferred]);

  const dismiss = useCallback(() => {
    dismissInstallPrompt();
    setDismissed(true);
  }, []);

  const showIosInstructions = !installed && !dismissed && isIosSafari() && !deferred;
  const canInstall = !installed && !dismissed && !!deferred;

  return {
    canInstall,
    showIosInstructions,
    isInstalled: installed,
    install,
    dismiss,
  };
}
