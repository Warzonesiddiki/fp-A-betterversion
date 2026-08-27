import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';

/**
 * SEC-4 wiring test: the login route must pass req.ip into
 * checkAccountLockout so per-(email, ip) buckets engage on real login
 * failures (the middleware's own pair-scoping is unit-tested in
 * accountLockout.test.ts; this pins the route-level handoff).
 */

const mocks = vi.hoisted(() => ({
  checkAccountLockout: vi.fn(() => ({ locked: false, remainingMinutes: 0, attemptsRemaining: 5 })),
  recordLoginAttempt: vi.fn(),
}));

vi.mock('../middleware/accountLockout.js', () => ({
  checkAccountLockout: mocks.checkAccountLockout,
  recordLoginAttempt: mocks.recordLoginAttempt,
}));

// bcrypt compare must succeed for the failure-recording path to be reached.
vi.mock('bcryptjs', () => ({
  default: {
    genSalt: vi.fn(async () => 'salt'),
    hash: vi.fn(async () => 'hash'),
    compare: vi.fn(async () => false), // force a failed login
  },
}));

import app from '../index.js';

describe('login lockout wiring (SEC-4)', () => {
  beforeEach(() => {
    mocks.checkAccountLockout.mockClear();
    mocks.recordLoginAttempt.mockClear();
  });

  it('passes req.ip into checkAccountLockout and records failures against that IP', async () => {
    const email = `sec4-${Date.now()}@finplan.test`;

    await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });

    expect(mocks.checkAccountLockout).toHaveBeenCalledWith(email, expect.any(String));
    const seenIp = mocks.checkAccountLockout.mock.calls[0][1] as string;
    expect(seenIp.length).toBeGreaterThan(0);

    // Failure recorded against the same IP bucket.
    expect(mocks.recordLoginAttempt).toHaveBeenCalledWith(email, seenIp, false);
  });
});
