const INSTALL_DISMISS_KEY = 'sc_pwa_install_dismissed';
const INSTALL_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/** True when the app is running as an installed PWA (home-screen / standalone). */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    nav.standalone === true
  );
}

/** iOS Safari — no beforeinstallprompt; user must use Share → Add to Home Screen. */
export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return isIos && isSafari;
}

export function wasInstallPromptDismissed(): boolean {
  const raw = localStorage.getItem(INSTALL_DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  if (Date.now() - ts < INSTALL_DISMISS_MS) return true;
  localStorage.removeItem(INSTALL_DISMISS_KEY);
  return false;
}

export function dismissInstallPrompt(): void {
  localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
}

export function clearInstallPromptDismissal(): void {
  localStorage.removeItem(INSTALL_DISMISS_KEY);
}
