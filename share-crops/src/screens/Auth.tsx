import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validatePassword, LoginAttemptTracker } from '@/lib/security';
import { TomatoMark } from '@/components/atoms/TomatoMark';
import { signUpWithEmail, signInWithEmail, continueAsGuest, friendlyAuthError } from '@/lib/auth';

type Mode = 'login' | 'signup';

export default function Auth() {
  const { refreshAuth, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearAuthError();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (mode === 'login' && LoginAttemptTracker.isLockedOut(email)) {
      setError(`Too many attempts. Try again in ${LoginAttemptTracker.getRetryAfterSeconds(email)}s.`);
      return;
    }
    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }
      const pw = validatePassword(password);
      if (!pw.valid) {
        setError(pw.errors[0]);
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name.trim());
      } else {
        await signInWithEmail(email, password);
        LoginAttemptTracker.clear(email);
      }
      await refreshAuth();
    } catch (err) {
      if (mode === 'login') LoginAttemptTracker.record(email);
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const guest = async () => {
    setError(null);
    clearAuthError();
    setBusy(true);
    try {
      await continueAsGuest();
      await refreshAuth();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="auth-brand">
          <div className="auth-logo"><TomatoMark size={64} /></div>
          <h1 className="serif">Share Crops</h1>
          <p>Trade what you grow with your community.</p>
        </div>

        <div className="demo-note" role="note">
          <strong>Demo.</strong> Everything stays in this browser. Neighbors are simulated and answer in a few seconds.
        </div>

        <button type="button" className="btn btn-primary btn-block" onClick={guest} disabled={busy}>
          {busy ? 'Please wait…' : 'Try it as a guest'}
        </button>

        <div className="divider">OR</div>

        {error && <div className="auth-error" role="alert">{error}</div>}
        {authError && <div className="auth-error" role="alert">{authError}</div>}

        <div className="auth-fields">
          {mode === 'signup' && (
            <div className="auth-field">
              <label className="field-label" htmlFor="auth-name">Name</label>
              <input id="auth-name" className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
          )}
          <div className="auth-field">
            <label className="field-label" htmlFor="auth-email">Email</label>
            <input id="auth-email" className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="auth-field">
            <label className="field-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          <button className="btn btn-outline btn-block" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </div>

        <div className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </form>
    </div>
  );
}
