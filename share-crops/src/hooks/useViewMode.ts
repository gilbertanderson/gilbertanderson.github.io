import { useEffect, useState } from 'react';

// Web presentation preference: 'frame' (phone mockup centered on a stage) vs
// 'full' (fullscreen responsive). Persisted per browser and applied as a class
// on <html>; the frame CSS itself only takes effect on wide viewports, so a
// phone is never framed unless it requests the desktop site.
const KEY = 'sc_view_mode';

export type ViewMode = 'frame' | 'full';

export function getViewMode(): ViewMode {
  return localStorage.getItem(KEY) === 'frame' ? 'frame' : 'full';
}

export function applyViewMode(mode: ViewMode) {
  document.documentElement.classList.toggle('framed', mode === 'frame');
}

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(getViewMode);

  useEffect(() => {
    applyViewMode(mode);
    localStorage.setItem(KEY, mode);
  }, [mode]);

  return [mode, setMode];
}
