import { db } from '../db/connection.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Failures allowed per (email, source IP) pair inside the attempt window. */
const MAX_FAILED_ATTEMPTS = 5;
/**
 * Email-wide failure ceiling across ALL IPs inside the window (SEC-4).
 * A distributed brute-force still locks, but a hostile actor cannot take an
 * account down with a handful of spray attempts — and a legitimate user's
 * own IP retains its independent 5-attempt budget until the global cap hits.
 */
const MAX_EMAIL_GLOBAL_ATTEMPTS = 20;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // Look back 15 minutes for attempts

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LoginAttemptRow {
  id: number;
  email: string;
  ip_address: string | null;
  success: number;
  attempted_at: string;
}

export interface LockoutStatus {
  locked: boolean;
  remainingMinutes: number;
  attemptsRemaining: number;
}

// ---------------------------------------------------------------------------
// Prepared Statements (cached for performance)
// ---------------------------------------------------------------------------

const insertAttempt = db.prepare(
  'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)'
);

const countFailedAttempts = db.prepare(
  `SELECT COUNT(*) as count FROM login_attempts
   WHERE email = ? AND success = 0 AND attempted_at > datetime('now', ?)`
);

// SEC-4: per-(email, ip) dimension — `IS` matches NULL ips too.
const countFailedAttemptsForIp = db.prepare(
  `SELECT COUNT(*) as count FROM login_attempts
   WHERE email = ? AND ip_address IS ? AND success = 0
     AND attempted_at > datetime('now', ?)`
);

const getLastFailedAttempt = db.prepare(
  `SELECT attempted_at FROM login_attempts
   WHERE email = ? AND success = 0
   ORDER BY attempted_at DESC LIMIT 1`
);

const getLastFailedAttemptForIp = db.prepare(
  `SELECT attempted_at FROM login_attempts
   WHERE email = ? AND ip_address IS ? AND success = 0
   ORDER BY attempted_at DESC LIMIT 1`
);

const clearAttempts = db.prepare('DELETE FROM login_attempts WHERE email = ?');

// Clears only the (email, ip) pair's failures that are outside the window.
const clearExpiredForIp = db.prepare(
  `DELETE FROM login_attempts
   WHERE email = ? AND ip_address IS ? AND success = 0
     AND attempted_at < datetime('now', ?)`
);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Remaining lockout minutes for the newest failed attempt row, or 0 when the
 * window has already expired (attempts are cleared on expiry).
 */
function remainingMinutesIfLocked(lastAttempt: LoginAttemptRow | undefined): number {
  if (!lastAttempt) return 0;
  // SQLite CURRENT_TIMESTAMP returns UTC without timezone indicator.
  // Append 'Z' so JavaScript parses it as UTC, not local time.
  const lastAttemptTime = new Date(`${lastAttempt.attempted_at}Z`).getTime();
  const lockoutExpiry = lastAttemptTime + LOCKOUT_DURATION_MS;
  const now = Date.now();
  if (now >= lockoutExpiry) return -1; // expired
  return Math.ceil((lockoutExpiry - now) / 60000);
}

const unlocked = (attemptsRemaining: number): LockoutStatus => ({
  locked: false,
  remainingMinutes: 0,
  attemptsRemaining,
});

/**
 * Check if a login is currently locked due to too many failed attempts.
 *
 * SEC-4 two-dimension model:
 *   - per-(email, ip): MAX_FAILED_ATTEMPTS (5) — one hostile source cannot
 *     lock the pair beyond its own budget;
 *   - email-global across all IPs: MAX_EMAIL_GLOBAL_ATTEMPTS (20) — a wide
 *     brute-force still locks, but targeted single-victim DoS needs 20+
 *     attempts instead of 5.
 *
 * When `ipAddress` is provided the caller gets pair-scoped enforcement plus
 * the email-global ceiling. Without it, only the email-global ceiling applies
 * (callers that know the request IP should always pass it).
 */
export function checkAccountLockout(email: string, ipAddress?: string | null): LockoutStatus {
  const windowMinutes = `-${ATTEMPT_WINDOW_MS / 60000} minutes`;
  const hasIp = ipAddress !== undefined;

  if (hasIp) {
    const pairRow = countFailedAttemptsForIp.get(email, ipAddress ?? null, windowMinutes) as {
      count: number;
    };
    if (pairRow.count >= MAX_FAILED_ATTEMPTS) {
      const remaining = remainingMinutesIfLocked(
        getLastFailedAttemptForIp.get(email, ipAddress ?? null) as LoginAttemptRow | undefined
      );
      if (remaining > 0) return { locked: true, remainingMinutes: remaining, attemptsRemaining: 0 };
      if (remaining === -1) {
        clearExpiredForIp.run(email, ipAddress ?? null, windowMinutes);
        return unlocked(MAX_FAILED_ATTEMPTS);
      }
    }

    const emailRow = countFailedAttempts.get(email, windowMinutes) as { count: number };
    if (emailRow.count >= MAX_EMAIL_GLOBAL_ATTEMPTS) {
      const remaining = remainingMinutesIfLocked(
        getLastFailedAttempt.get(email) as LoginAttemptRow | undefined
      );
      if (remaining > 0) return { locked: true, remainingMinutes: remaining, attemptsRemaining: 0 };
      if (remaining === -1) {
        clearAttempts.run(email);
        return unlocked(MAX_FAILED_ATTEMPTS);
      }
    }

    return unlocked(Math.max(0, MAX_FAILED_ATTEMPTS - pairRow.count));
  }

  // Legacy no-IP path: email-global ceiling only.
  const row = countFailedAttempts.get(email, windowMinutes) as { count: number };
  if (row.count < MAX_EMAIL_GLOBAL_ATTEMPTS) {
    return unlocked(Math.max(0, MAX_EMAIL_GLOBAL_ATTEMPTS - row.count));
  }

  const remaining = remainingMinutesIfLocked(
    getLastFailedAttempt.get(email) as LoginAttemptRow | undefined
  );
  if (remaining === -1) {
    clearAttempts.run(email);
    return unlocked(MAX_EMAIL_GLOBAL_ATTEMPTS);
  }
  if (remaining === 0) return unlocked(MAX_EMAIL_GLOBAL_ATTEMPTS);

  return { locked: true, remainingMinutes: remaining, attemptsRemaining: 0 };
}

/**
 * Record a login attempt (success or failure).
 * On success, clears all previous failed attempts for the email.
 */
export function recordLoginAttempt(
  email: string,
  ipAddress: string | null,
  success: boolean
): void {
  insertAttempt.run(email, ipAddress, success ? 1 : 0);

  if (success) {
    // Clear failed attempts on successful login
    clearAttempts.run(email);
  }
}

/**
 * Get the number of recent failed attempts for an email.
 * Useful for logging and monitoring.
 */
export function getFailedAttemptCount(email: string): number {
  const windowMinutes = `-${ATTEMPT_WINDOW_MS / 60000} minutes`;
  const row = countFailedAttempts.get(email, windowMinutes) as { count: number };
  return row.count;
}
