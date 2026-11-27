type UpdateListener = () => void;

let updateListener: UpdateListener | null = null;

/** Register the app-shell service worker and notify when a new version is ready. */
export function registerAppServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              updateListener?.();
            }
          });
        });
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
  });
}

export function onServiceWorkerUpdate(listener: UpdateListener): () => void {
  updateListener = listener;
  return () => {
    if (updateListener === listener) updateListener = null;
  };
}

export function applyServiceWorkerUpdate(): void {
  navigator.serviceWorker.getRegistration().then((reg) => {
    if (!reg?.waiting) {
      window.location.reload();
      return;
    }
    const onController = () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onController);
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onController);
    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  });
}
