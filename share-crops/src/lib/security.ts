/**
 * Frontend Security Module — client-side helpers for Share Crops.
 * Ported from the original app; trimmed to what this rebuild uses.
 */

/** Validate email format */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/** Validate password strength */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password should contain a special character for extra security');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Client-side login attempt tracker with lockout.
 * Stored in sessionStorage (tab-scoped). Mirrors the server rule:
 * 5 failures within the window → 5-minute lockout. The server enforces
 * authoritatively; this provides immediate UI feedback.
 */
export class LoginAttemptTracker {
  private static readonly KEY_PREFIX = 'sc_login_attempts:';
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly LOCKOUT_MS = 5 * 60 * 1000; // 5 minute lockout

  static record(email: string): void {
    const key = this.KEY_PREFIX + email.toLowerCase();
    const data = this.getData(email);
    const now = Date.now();
    data.attempts = data.attempts.filter((ts) => ts > now - this.WINDOW_MS);
    data.attempts.push(now);
    if (data.attempts.length >= this.MAX_ATTEMPTS) {
      data.lockedUntil = now + this.LOCKOUT_MS;
    }
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch {
      // sessionStorage quota exceeded — ignore; server-side lockout still applies
    }
  }

  static isLockedOut(email: string): boolean {
    const data = this.getData(email);
    return data.lockedUntil > Date.now();
  }

  static getRetryAfterSeconds(email: string): number {
    const data = this.getData(email);
    return Math.max(0, Math.ceil((data.lockedUntil - Date.now()) / 1000));
  }

  static clear(email: string): void {
    try {
      sessionStorage.removeItem(this.KEY_PREFIX + email.toLowerCase());
    } catch {
      // ignore
    }
  }

  private static getData(email: string): { attempts: number[]; lockedUntil: number } {
    try {
      const raw = sessionStorage.getItem(this.KEY_PREFIX + email.toLowerCase());
      return raw ? JSON.parse(raw) : { attempts: [], lockedUntil: 0 };
    } catch {
      return { attempts: [], lockedUntil: 0 };
    }
  }
}

/** Strip control characters and angle brackets from free text before it is
 *  stored. React escapes on render too; this keeps stored data clean. */
export const sanitizeInput = (value: string): string =>
  String(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '');
