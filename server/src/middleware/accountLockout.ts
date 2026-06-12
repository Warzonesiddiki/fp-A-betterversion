import { db } from '../db/connection.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MAX_FAILED_ATTEMPTS = 5;
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

const getLastFailedAttempt = db.prepare(
  `SELECT attempted_at FROM login_attempts
   WHERE email = ? AND success = 0
   ORDER BY attempted_at DESC LIMIT 1`
);

const clearAttempts = db.prepare('DELETE FROM login_attempts WHERE email = ?');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if an account is currently locked due to too many failed login attempts.
 * Returns lockout status including remaining time and attempts left.
 */
export function checkAccountLockout(email: string): LockoutStatus {
  const windowMinutes = `-${ATTEMPT_WINDOW_MS / 60000} minutes`;
  const row = countFailedAttempts.get(email, windowMinutes) as { count: number };
  const failedCount = row.count;

  if (failedCount < MAX_FAILED_ATTEMPTS) {
    return {
      locked: false,
      remainingMinutes: 0,
      attemptsRemaining: MAX_FAILED_ATTEMPTS - failedCount,
    };
  }

  // Account is locked — calculate remaining lockout time
  const lastAttempt = getLastFailedAttempt.get(email) as LoginAttemptRow | undefined;
  if (!lastAttempt) {
    return { locked: false, remainingMinutes: 0, attemptsRemaining: MAX_FAILED_ATTEMPTS };
  }

  // SQLite CURRENT_TIMESTAMP returns UTC without timezone indicator.
  // Append 'Z' so JavaScript parses it as UTC, not local time.
  const lastAttemptTime = new Date(`${lastAttempt.attempted_at}Z`).getTime();
  const lockoutExpiry = lastAttemptTime + LOCKOUT_DURATION_MS;
  const now = Date.now();

  if (now >= lockoutExpiry) {
    // Lockout has expired — clear old attempts
    clearAttempts.run(email);
    return { locked: false, remainingMinutes: 0, attemptsRemaining: MAX_FAILED_ATTEMPTS };
  }

  const remainingMs = lockoutExpiry - now;
  const remainingMinutes = Math.ceil(remainingMs / 60000);

  return {
    locked: true,
    remainingMinutes,
    attemptsRemaining: 0,
  };
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
