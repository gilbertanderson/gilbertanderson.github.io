import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { TomatoLoader } from '@/components/atoms/TomatoLoader';

const FullScreenLoader = (
  <div className="app">
    <div className="center-fill">
      <TomatoLoader size="lg" label="Share Crops" />
    </div>
  </div>
);

// Route-level code splitting — each screen is its own chunk.
const Auth = lazy(() => import('@/screens/Auth'));
const CommunitySetup = lazy(() => import('@/screens/CommunitySetup'));
const Marketplace = lazy(() => import('@/screens/Marketplace'));
const ListingDetail = lazy(() => import('@/screens/ListingDetail'));
const Offers = lazy(() => import('@/screens/Offers'));
const Messages = lazy(() => import('@/screens/Messages'));
const ChatThread = lazy(() => import('@/screens/ChatThread'));
const Profile = lazy(() => import('@/screens/Profile'));

export default function App() {
  const { isAuthenticated, hasCompletedSetup, loading } = useAuth();

  if (loading) {
    return FullScreenLoader;
  }

  // Unauthenticated → only the auth screen is reachable. The lazy screens need a
  // Suspense boundary while their chunk loads.
  if (!isAuthenticated) {
    return (
      <Suspense fallback={FullScreenLoader}>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Authenticated but no community yet → force setup.
  if (!hasCompletedSetup) {
    return (
      <Suspense fallback={FullScreenLoader}>
        <Routes>
          <Route path="/community-setup" element={<CommunitySetup />} />
          <Route path="*" element={<Navigate to="/community-setup" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Authenticated + set up → the full app shell with the bottom nav.
  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:threadId" element={<ChatThread />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/marketplace" replace />} />
      </Routes>
    </>
  );
}
