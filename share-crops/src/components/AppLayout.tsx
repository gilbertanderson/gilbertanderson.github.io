import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomNav } from '@/components/BottomNav';
import { TomatoLoader } from '@/components/atoms/TomatoLoader';
import { AppUpdatePrompt } from '@/components/pwa/AppUpdatePrompt';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';

// Routes that take over the full screen and hide the tab bar (they provide
// their own back button + bottom action bar), mirroring the prototype's stack.
function hidesTabBar(pathname: string): boolean {
  return /^\/listing\/[^/]+$/.test(pathname) || /^\/messages\/[^/]+$/.test(pathname);
}

export function AppLayout() {
  const location = useLocation();
  const showTabBar = !hidesTabBar(location.pathname);

  return (
    <div className="app">
      <OfflineBanner />
      <AppUpdatePrompt />
      <div className="screen-body">
        <Suspense fallback={<TomatoLoader className="loader-center" />}>
          <Outlet />
        </Suspense>
      </div>
      {showTabBar && (
        <div className="app-dock">
          <InstallPrompt />
          <BottomNav />
        </div>
      )}
    </div>
  );
}
