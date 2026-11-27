import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API, AuthManager, setUnauthorizedHandler } from '@/lib/api';
import { onAuthChange, logout as localLogout, currentUserId } from '@/lib/auth';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes, same as production

interface AuthState {
  isAuthenticated: boolean;
  hasCompletedSetup: boolean;
  communityCount: number;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
}

interface AuthContextValue extends AuthState {
  refreshAuth: () => Promise<void>;
  clearAuthError: () => void;
  logout: () => void;
}

const UNAUTH: AuthState = {
  isAuthenticated: false,
  hasCompletedSetup: false,
  communityCount: 0,
  isAdmin: false,
  loading: false,
  authError: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ ...UNAUTH, loading: true });
  const qc = useQueryClient();

  // Resolve app-level auth for the signed-in local user: profile + communities.
  const applyUser = useCallback(async (userId: string | null) => {
    if (!userId) {
      setState((prev) => ({ ...UNAUTH, authError: prev.authError }));
      return;
    }
    setState((prev) => ({ ...prev, loading: true, authError: null }));
    try {
      const { user: profile } = await API.getMe();
      const { communities } = await API.getMyCommunities();
      const communityCount = communities?.length ?? 0;
      setState({
        isAuthenticated: true,
        hasCompletedSetup: communityCount > 0,
        communityCount,
        isAdmin: profile?.role === 'admin',
        loading: false,
        authError: null,
      });
    } catch (err) {
      setState({ ...UNAUTH, authError: (err as Error)?.message || 'Could not load your profile.' });
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await applyUser(currentUserId());
  }, [applyUser]);

  const clearAuthError = useCallback(() => {
    setState((prev) => ({ ...prev, authError: null }));
  }, []);

  const logout = useCallback(() => {
    AuthManager.clearToken();
    localLogout(); // fires onAuthChange(null)
    qc.clear(); // don't show the last user's cached data to the next one
  }, [qc]);

  useEffect(() => onAuthChange((id) => void applyUser(id)), [applyUser]);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Inactivity auto-logout, carried over from production.
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!state.isAuthenticated) return;
    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(logout, INACTIVITY_TIMEOUT_MS);
    };
    const events = ['mousemove', 'keydown', 'touchstart', 'pointerdown', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [state.isAuthenticated, logout]);

  return (
    <AuthContext.Provider value={{ ...state, refreshAuth, clearAuthError, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
