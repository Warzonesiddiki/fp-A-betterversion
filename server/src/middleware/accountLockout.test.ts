import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the database connection — create DB entirely inside the factory
// ---------------------------------------------------------------------------

const { testDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      ip_address TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, attempted_at);
  `);

  return { testDb: db };
});

vi.mock('../db/connection.js', () => ({
  db: testDb,
}));

// Import AFTER mock is set up
import {
  checkAccountLockout,
  recordLoginAttempt,
  getFailedAttemptCount,
} from './accountLockout.js';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Account Lockout', () => {
  const testEmail = 'test@example.com';
  const testIp = '192.168.1.1';

  beforeEach(() => {
    // Clear all login attempts before each test
    testDb.exec('DELETE FROM login_attempts');
  });

  // -------------------------------------------------------------------------
  // checkAccountLockout
  // -------------------------------------------------------------------------

  describe('checkAccountLockout', () => {
    it('should return not locked when no failed attempts exist', () => {
      const status = checkAccountLockout(testEmail, testIp);

      expect(status.locked).toBe(false);
      expect(status.remainingMinutes).toBe(0);
      expect(status.attemptsRemaining).toBe(5);
    });

    it('should return not locked with correct remaining attempts after 1 failure', () => {
      recordLoginAttempt(testEmail, testIp, false);

      const status = checkAccountLockout(testEmail, testIp);

      expect(status.locked).toBe(false);
      expect(status.attemptsRemaining).toBe(4);
    });

    it('should return not locked after 4 failures', () => {
      for (let i = 0; i < 4; i++) {
        recordLoginAttempt(testEmail, testIp, false);
      }

      const status = checkAccountLockout(testEmail, testIp);

      expect(status.locked).toBe(false);
      expect(status.attemptsRemaining).toBe(1);
    });

    it('should lock (email, ip) pair after 5 failed attempts from that IP', () => {
      for (let i = 0; i < 5; i++) {
        recordLoginAttempt(testEmail, testIp, false);
      }

      const status = checkAccountLockout(testEmail, testIp);

      expect(status.locked).toBe(true);
      expect(status.remainingMinutes).toBeGreaterThan(0);
      expect(status.remainingMinutes).toBeLessThanOrEqual(15);
      expect(status.attemptsRemaining).toBe(0);
    });

    it('should not count successful attempts toward lockout', () => {
      // 4 failures + 1 success clears them all
      for (let i = 0; i < 4; i++) {
        recordLoginAttempt(testEmail, testIp, false);
      }
      recordLoginAttempt(testEmail, testIp, true);

      const status = checkAccountLockout(testEmail, testIp);

      expect(status.locked).toBe(false);
      expect(status.attemptsRemaining).toBe(5);
    });

    it('should track attempts per email independently', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      // Lock email1
      for (let i = 0; i < 5; i++) {
        recordLoginAttempt(email1, testIp, false);
      }

      // email2 has no attempts
      const status1 = checkAccountLockout(email1, testIp);
      const status2 = checkAccountLockout(email2, testIp);

      expect(status1.locked).toBe(true);
      expect(status2.locked).toBe(false);
      expect(status2.attemptsRemaining).toBe(5);
    });

    it('should handle NULL ip addresses as their own dimension bucket', () => {
      for (let i = 0; i < 5; i++) {
        recordLoginAttempt(testEmail, null, false);
      }

      // NULL-ip pair locked...
      expect(checkAccountLockout(testEmail, null).locked).toBe(true);
      // ...while a named IP keeps its own full budget.
      expect(checkAccountLockout(testEmail, '10.0.0.9').locked).toBe(false);
      expect(checkAccountLockout(testEmail, '10.0.0.9').attemptsRemaining).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // SEC-4: per-(email, ip) dimension vs email-global ceiling
  // -------------------------------------------------------------------------

  describe('SEC-4: per-IP lockout dimension + email-global cap', () => {
    it('a hostile IP does not consume a different IP attempt budget', () => {
      for (let i = 0; i < 5; i++) {
        recordLoginAttempt(testEmail, '203.0.113.66', false);
      }
      // Attacker's pair is locked...
      expect(checkAccountLockout(testEmail, '203.0.113.66').locked).toBe(true);
      // ...but the legitimate user on another IP still gets a fresh budget.
      const victim = checkAccountLockout(testEmail, '198.51.100.7');
      expect(victim.locked).toBe(false);
      expect(victim.attemptsRemaining).toBe(5);
    });

    it('targeted DoS: 15 spray attempts across IPs do NOT lock the victim IP', () => {
      for (let i = 0; i < 15; i++) {
        recordLoginAttempt(testEmail, `203.0.113.${i}`, false);
      }
      const victim = checkAccountLockout(testEmail, '198.51.100.7');
      expect(victim.locked).toBe(false);
      expect(victim.attemptsRemaining).toBe(5);
    });

    it('email-global cap (20) locks even when every source stays under its own budget', () => {
      for (let i = 0; i < 20; i++) {
        recordLoginAttempt(testEmail, `203.0.113.${i}`, false);
      }
      // Every individual pair is at 1/5, but the wide brute-force trips the cap.
      const victim = checkAccountLockout(testEmail, '198.51.100.7');
      expect(victim.locked).toBe(true);
      expect(victim.remainingMinutes).toBeGreaterThan(0);
    });

    it('19 distributed attempts stay under the email-global cap', () => {
      for (let i = 0; i < 19; i++) {
        recordLoginAttempt(testEmail, `203.0.113.${i}`, false);
      }
      expect(checkAccountLockout(testEmail, '198.51.100.7').locked).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // recordLoginAttempt
  // -------------------------------------------------------------------------

  describe('recordLoginAttempt', () => {
    it('should record a failed attempt', () => {
      recordLoginAttempt(testEmail, testIp, false);

      const count = getFailedAttemptCount(testEmail);
      expect(count).toBe(1);
    });

    it('should record a successful attempt', () => {
      recordLoginAttempt(testEmail, testIp, true);

      // Success clears failures, so count should be 0
      const count = getFailedAttemptCount(testEmail);
      expect(count).toBe(0);
    });

    it('should clear failed attempts on successful login', () => {
      // Record 4 failures
      for (let i = 0; i < 4; i++) {
        recordLoginAttempt(testEmail, testIp, false);
      }
      expect(getFailedAttemptCount(testEmail)).toBe(4);

      // Successful login should clear them
      recordLoginAttempt(testEmail, testIp, true);
      expect(getFailedAttemptCount(testEmail)).toBe(0);
    });

    it('should handle null IP address', () => {
      recordLoginAttempt(testEmail, null, false);

      const count = getFailedAttemptCount(testEmail);
      expect(count).toBe(1);
    });

    it('should increment attempt count on repeated failures', () => {
      for (let i = 1; i <= 5; i++) {
        recordLoginAttempt(testEmail, testIp, false);
        expect(getFailedAttemptCount(testEmail)).toBe(i);
      }
    });
  });

  // -------------------------------------------------------------------------
  // getFailedAttemptCount
  // -------------------------------------------------------------------------

  describe('getFailedAttemptCount', () => {
    it('should return 0 for email with no attempts', () => {
      expect(getFailedAttemptCount('new@example.com')).toBe(0);
    });

    it('should count only failed attempts', () => {
      recordLoginAttempt(testEmail, testIp, false);
      recordLoginAttempt(testEmail, testIp, true);
      recordLoginAttempt(testEmail, testIp, false);

      expect(getFailedAttemptCount(testEmail)).toBe(1); // success cleared, then 1 more failure
    });

    it('should not count attempts from other emails', () => {
      recordLoginAttempt('other@example.com', testIp, false);
      recordLoginAttempt('other@example.com', testIp, false);

      expect(getFailedAttemptCount(testEmail)).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Lockout expiry
  // -------------------------------------------------------------------------

  describe('lockout expiry', () => {
    const isoToSqlite = (msAgo: number) =>
      new Date(Date.now() - msAgo).toISOString().replace('T', ' ').replace('Z', '').split('.')[0]; // "YYYY-MM-DD HH:MM:SS"

    it('should unlock account after lockout window expires', () => {
      // Create 5 failed attempts with old timestamps (SQLite CURRENT_TIMESTAMP format)
      const oldTime = isoToSqlite(16 * 60 * 1000);
      for (let i = 0; i < 5; i++) {
        testDb
          .prepare(
            'INSERT INTO login_attempts (email, ip_address, success, attempted_at) VALUES (?, ?, 0, ?)'
          )
          .run(testEmail, testIp, oldTime);
      }

      // Account should be unlocked because attempts are outside the window
      const status = checkAccountLockout(testEmail, testIp);
      expect(status.locked).toBe(false);
      expect(status.attemptsRemaining).toBe(5);
    });

    it('should still lock if last attempt is within window', () => {
      // 4 old failures outside window
      const oldTime = isoToSqlite(16 * 60 * 1000);
      for (let i = 0; i < 4; i++) {
        testDb
          .prepare(
            'INSERT INTO login_attempts (email, ip_address, success, attempted_at) VALUES (?, ?, 0, ?)'
          )
          .run(testEmail, testIp, oldTime);
      }

      // 1 recent failure - only 1 in the 15-min window, not enough for lockout
      recordLoginAttempt(testEmail, testIp, false);

      const status = checkAccountLockout(testEmail, testIp);
      expect(status.locked).toBe(false);
      expect(status.attemptsRemaining).toBe(4);
    });

    it('email-global expiry unlocks once all attempts age out of the window', () => {
      const oldTime = isoToSqlite(16 * 60 * 1000);
      for (let i = 0; i < 20; i++) {
        testDb
          .prepare(
            'INSERT INTO login_attempts (email, ip_address, success, attempted_at) VALUES (?, ?, 0, ?)'
          )
          .run(testEmail, `203.0.113.${i}`, oldTime);
      }
      expect(checkAccountLockout(testEmail, '198.51.100.7').locked).toBe(false);
      // Aged-out rows were cleared.
      expect(getFailedAttemptCount(testEmail)).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle case-sensitive email tracking', () => {
      // The system tracks by exact email string (case-sensitive)
      recordLoginAttempt('Test@Example.com', testIp, false);
      recordLoginAttempt('test@example.com', testIp, false);

      // These are different strings, so tracked separately
      expect(getFailedAttemptCount('Test@Example.com')).toBe(1);
      expect(getFailedAttemptCount('test@example.com')).toBe(1);
    });

    it('should handle rapid successive brute-force from one IP', () => {
      // Simulate rapid brute-force
      for (let i = 0; i < 10; i++) {
        recordLoginAttempt(testEmail, testIp, false);
      }

      const status = checkAccountLockout(testEmail, testIp);
      expect(status.locked).toBe(true);
      expect(status.remainingMinutes).toBeGreaterThan(0);
    });

    it('should allow login after lockout expires and attempts cleared', () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        recordLoginAttempt(testEmail, testIp, false);
      }
      expect(checkAccountLockout(testEmail, testIp).locked).toBe(true);

      // Clear attempts (simulates time passing and cleanup)
      testDb.prepare('DELETE FROM login_attempts WHERE email = ?').run(testEmail);

      const status = checkAccountLockout(testEmail, testIp);
      expect(status.locked).toBe(false);
      expect(status.attemptsRemaining).toBe(5);
    });
  });
});
