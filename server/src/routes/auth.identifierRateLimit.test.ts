import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { db } from '../db/connection.js';
import { resetAuthRateLimiter } from './auth.js';

/**
 * Lane R41 (wave 3) — per-identifier (email) fixed-window brute-force
 * limiting on POST /api/auth/login and POST /api/auth/refresh.
 *
 * Pinned semantics (mirrors the gl.entries.env harness style):
 *   - AUTH_RATE_LIMIT_MAX attempts per 15-minute window per lowercased email
 *     (default 10); over-budget requests get 429 BEFORE password verification,
 *     lockout evaluation, or token issuance.
 *   - A SUCCESSFUL login resets that identifier's budget.
 *   - Different identifiers have independent budgets.
 *   - Refresh gating sits AFTER the revoked/expired checks: replaying a
 *     revoked token must always reach SEC-2 reuse detection, never a 429.
 *
 * RESET & WINDOW SEMANTICS (normative, wave 5 agent 4/29):
 *   - The window OPENS at the FIRST consuming attempt for an identifier
 *     (windowStart = that request's time), NOT at the most recent one.
 *   - Every LOGIN attempt consumes exactly one slot, success or failure.
 *     Every REFRESH consumes one slot. Blocked (429) responses consume
 *     NOTHING extra and never move windowStart.
 *   - resetIdentifier() runs ONLY on successful login and DELETES the whole
 *     bucket — including the successful attempt's own slot. Consequence
 *     (pinned below): consecutive CORRECT logins never gate at any threshold;
 *     the budget re-bites from zero on the first subsequent failure.
 *   - Expiry is lazy: a bucket is replaced (not swept) when the next attempt
 *     arrives after windowStart + 15min, so recovery needs no timer.
 *   - retryAfterSeconds = ceil((windowStart + 15min − now) / 1000), floored
 *     at 1 — anchored to the window's first consuming attempt, so it shrinks
 *     toward expiry regardless of how many blocked calls arrive meanwhile.
 *
 * Harness note: the IP-level authLimiter (middleware/rateLimit.ts) reads
 * RATE_LIMIT_AUTH_MAX once at module init. It is raised below BEFORE the app
 * import so this suite's ~30 auth requests are gated ONLY by the
 * per-identifier limiter under test. Other suites keep the default 10/IP.
 */

vi.stubEnv('RATE_LIMIT_AUTH_MAX', '100000');
const { default: app } = await import('../index.js');

const PASSWORD = 'correct-horse-1';

async function register(email: string): Promise<{ refreshToken: string }> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: PASSWORD,
      firstName: 'R41',
      lastName: 'RateLimit',
    });
  expect(res.status, `register ${email} should succeed`).toBe(201);
  return res.body as { refreshToken: string };
}

function login(email: string, password: string): Promise<request.Response> {
  return request(app).post('/api/auth/login').send({ email, password });
}

function refresh(refreshToken: string): Promise<request.Response> {
  return request(app).post('/api/auth/refresh').send({ refreshToken });
}

function refreshTokenRows(email: string): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id WHERE u.email = ?`
    )
    .get(email) as { count: number };
  return row.count;
}

describe('per-identifier brute-force limiting on /api/auth (lane R41)', () => {
  const RUN = Date.now();

  beforeAll(() => {
    // Real-SQLite FK enforcement: audit_log.user_id references users; every
    // JWT actor produced by register() must exist (register inserts it).
    db.prepare("DELETE FROM refresh_tokens WHERE user_id LIKE 'r41-%'").run();
  });

  beforeEach(() => {
    resetAuthRateLimiter();
  });

  it('429s after AUTH_RATE_LIMIT_MAX failed logins, before lockout/password verification', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '3');
    const email = `r41-threshold-${RUN}@finplan.test`;
    await register(email);

    // Three wrong-password attempts burn the budget (401 from credential
    // check — NOT 423, because three failures stay under the account-lockout
    // threshold); the fourth is rejected by the identifier limiter.
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await login(email, 'wrong-password');
      statuses.push(res.status);
    }
    expect(statuses).toEqual([401, 401, 401, 429]);

    // The 429 response never leaks lockout state and carries retry info.
    // (No request in this sequence may return 423.)
    expect(statuses).not.toContain(423);
  });

  it('a successful login resets the identifier budget', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '3');
    const email = `r41-reset-${RUN}@finplan.test`;
    await register(email);

    expect((await login(email, 'wrong')).status).toBe(401);
    expect((await login(email, 'wrong')).status).toBe(401);
    // Success clears the attacker's consumed slots…
    expect((await login(email, PASSWORD)).status).toBe(200);
    // …so the next three failures pass the gate again…
    expect((await login(email, 'wrong')).status).toBe(401);
    expect((await login(email, 'wrong')).status).toBe(401);
    expect((await login(email, 'wrong')).status).toBe(401);
    // …and only the fourth post-reset failure is limited.
    const limited = await login(email, 'wrong');
    expect(limited.status).toBe(429);
    expect(
      (limited.body as { retryAfterSeconds?: number }).retryAfterSeconds
    ).toBeGreaterThan(0);
  });

  it('different identifiers have isolated budgets', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '2');
    const emailC = `r41-iso-c-${RUN}@finplan.test`;
    const emailD = `r41-iso-d-${RUN}@finplan.test`;
    await register(emailC);
    await register(emailD);

    // Exhaust C's budget entirely…
    expect((await login(emailC, 'wrong')).status).toBe(401);
    expect((await login(emailC, 'wrong')).status).toBe(401);
    expect((await login(emailC, 'wrong')).status).toBe(429);

    // …while D still has a full budget of its own.
    expect((await login(emailD, 'wrong')).status).toBe(401);
  });

  it('limits refresh per identifier BEFORE minting another token pair', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '1');
    const email = `r41-refresh-${RUN}@finplan.test`;
    const { refreshToken } = await register(email);

    // First refresh passes the gate and rotates normally.
    const first = await refresh(refreshToken);
    expect(first.status).toBe(200);
    const rowsAfterFirst = refreshTokenRows(email);

    // Second refresh for the same identifier is gated BEFORE the rotation
    // transaction: no additional token pair is issued.
    const second = await refresh((first.body as { refreshToken: string }).refreshToken);
    expect(second.status).toBe(429);
    expect(refreshTokenRows(email)).toBe(rowsAfterFirst);
  });

  it('PINNED ordering: a revoked-token replay reaches SEC-2 reuse detection, never the 429', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '1');
    const email = `r41-replay-${RUN}@finplan.test`;
    const { refreshToken: original } = await register(email);

    // Rotate once: original is now revoked, budget fully consumed.
    const rotated = await refresh(original);
    expect(rotated.status).toBe(200);

    // Replaying the REVOKED original must trigger family revocation (SEC-2)
    // rather than being masked by the identifier limiter.
    const replay = await refresh(original);
    expect(replay.status).toBe(401);
    expect((replay.body as { error: string }).error).toMatch(/reuse detected/i);

    // The legitimately issued successor was revoked with the family — also
    // surfacing as reuse detection, not 429.
    const successor = (rotated.body as { refreshToken: string }).refreshToken;
    const afterFamilyRevoke = await refresh(successor);
    expect(afterFamilyRevoke.status).toBe(401);
    expect((afterFamilyRevoke.body as { error: string }).error).toMatch(/reuse detected/i);
  });

  // ── Boundary expansion (wave 5, agent 2/29) ─────────────────────────────

  it('AUTH_RATE_LIMIT_MAX=1: exactly ONE attempt passes the gate per window', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '1');
    const email = `r41w5-one-${RUN}@finplan.test`;
    await register(email);

    // Attempt #1 consumes the only slot (401 from credential verification)…
    expect((await login(email, 'wrong')).status).toBe(401);
    // …attempt #2 is already gated — the threshold is exact, not "N+1".
    expect((await login(email, 'wrong')).status).toBe(429);
  });

  it('AUTH_RATE_LIMIT_MAX=1: success resets the slot — consecutive correct logins never gate (pinned)', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '1');
    const email = `r41w5-one-ok-${RUN}@finplan.test`;
    await register(email);

    // BEHAVIOR SURPRISE pinned deliberately: the success path resets the
    // identifier's bucket INCLUDING the successful attempt's own slot, so
    // back-to-back CORRECT logins always pass regardless of the threshold.
    expect((await login(email, PASSWORD)).status).toBe(200);
    expect((await login(email, PASSWORD)).status).toBe(200);
    // The budget still bites the moment real failures appear: one wrong
    // password consumes the fresh slot…
    expect((await login(email, 'wrong')).status).toBe(401);
    // …and the very next attempt is gated.
    expect((await login(email, 'wrong')).status).toBe(429);
  });

  it('email keying is case-insensitive: mixed-case spellings share one budget', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '2');
    // Registered with mixed case; the limiter normalizes every submitted
    // spelling to one identifier regardless of what the users row holds.
    const email = `r41w5-case-${RUN}@FinPlan.Test`;
    await register(email);

    expect((await login(`R41W5-CASE-${RUN}@FINPLAN.TEST`, 'wrong')).status).toBe(401);
    expect((await login(`r41w5-case-${RUN}@finplan.test`, 'wrong')).status).toBe(401);
    // Third spelling variant hits the SAME exhausted budget — proof the
    // variants never opened independent buckets. (Budget consumption happens
    // before any user lookup, so raw-spelling mismatches still count.)
    expect((await login(`R41w5-case-${RUN}@finplan.TEST`, 'wrong')).status).toBe(429);
  });

  it('refresh 429s carry retryAfterSeconds > 0 (bounded by the window)', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '1');
    const { refreshToken } = await register(`r41w5-retry-${RUN}@finplan.test`);

    // First refresh consumes the single slot and rotates normally.
    const first = await refresh(refreshToken);
    expect(first.status).toBe(200);
    const v2 = (first.body as { refreshToken: string }).refreshToken;

    const gated = await refresh(v2);
    expect(gated.status).toBe(429);
    const secs = (gated.body as { retryAfterSeconds?: number }).retryAfterSeconds;
    expect(typeof secs).toBe('number');
    expect(secs as number).toBeGreaterThan(0);
    expect(secs as number).toBeLessThanOrEqual(15 * 60); // never exceeds the window
  });

  it('PINNED keying: the identifier is the submitted email string only — no tenant dimension', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '2');
    const email = `r41w5-tenant-${RUN}@finplan.test`;
    await register(email);

    const noisyLogin = (tenantTag: string): Promise<request.Response> =>
      request(app)
        .post('/api/auth/login')
        .set('x-tenant-id', tenantTag)
        .send({ email, password: 'wrong', tenantId: tenantTag });

    // Tenant-flavored noise on UNAUTHENTICATED requests must not open a
    // second budget: before credential verification there IS no tenant
    // identity, and users.email is UNIQUE in Phase 0 (one account per email),
    // so the limiter keys on the submitted email alone.
    expect((await noisyLogin('tenant-noise-a')).status).toBe(401);
    expect((await noisyLogin('tenant-noise-b')).status).toBe(401);
    expect((await noisyLogin('tenant-noise-c')).status).toBe(429);
  });
});

// ── Observability & window-edge arithmetic (wave 5, agent 4/29) ────────────
//
// retryAfterSeconds arithmetic is pinned at exact window edges using a fake
// Date ONLY (toFake: ['Date']) — real timers keep the supertest round-trips
// alive while Date.now() is fully deterministic inside the limiter.
describe('limiter observability: retryAfterSeconds edges & slot accounting', () => {
  const T0 = new Date('2026-08-23T00:00:00.000Z').getTime();
  const WINDOW = 15 * 60;

  const secondsOf = (res: request.Response): number =>
    (res.body as { retryAfterSeconds?: number }).retryAfterSeconds ?? -1;

  beforeEach(() => {
    resetAuthRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('first blocked request reports the FULL window; the last gasp reports ~1 minute; rollover recovers', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '2');
    const email = `r41w4-edge-${Date.now()}@finplan.test`;
    await register(email);

    vi.useFakeTimers({ toFake: ['Date'], now: T0 });
    // Slots 1 and 2 open AND consume the window at exactly T0.
    expect((await login(email, 'wrong')).status).toBe(401);
    expect((await login(email, 'wrong')).status).toBe(401);

    // FIRST blocked request: window started this instant -> ceil(900000/1000).
    const firstBlocked = await login(email, 'wrong');
    expect(firstBlocked.status).toBe(429);
    expect(secondsOf(firstBlocked)).toBe(WINDOW);

    // LAST gasps before expiry (T0 + 14min): exactly one minute left.
    vi.setSystemTime(T0 + 14 * 60 * 1000);
    const nearExpiry = await login(email, 'wrong');
    expect(nearExpiry.status).toBe(429);
    expect(secondsOf(nearExpiry)).toBe(60);

    // Rollover is lazy and exact: one millisecond past the horizon the bucket
    // is replaced on touch — the attempt passes the gate again (401 from
    // credential verification, consuming slot 1 of a FRESH window).
    vi.setSystemTime(T0 + WINDOW * 1000 + 1);
    expect((await login(email, 'wrong')).status).toBe(401);
  });

  it('window anchors to the FIRST consuming attempt; blocked calls consume no extra slots', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '2');
    const email = `r41w4-anchor-${Date.now()}@finplan.test`;
    await register(email);

    vi.useFakeTimers({ toFake: ['Date'], now: T0 });
    // Slot 1 OPENS the window at T0…
    expect((await login(email, 'wrong')).status).toBe(401);
    // …then the clock jumps: slot 2 is consumed 10 minutes INTO that same
    // window. If the window anchored to the most recent attempt instead,
    // remaining would be ~900s, not 300s.
    vi.setSystemTime(T0 + 10 * 60 * 1000);
    expect((await login(email, 'wrong')).status).toBe(401);

    const firstBlocked = await login(email, 'wrong');
    expect(firstBlocked.status).toBe(429);
    expect(secondsOf(firstBlocked)).toBe(300); // 15min − 10min elapsed

    // Blocked attempts must be FREE: three further rejections at the same
    // instant neither extend the window nor change the remaining hint —
    // identical arithmetic, zero additional consumption.
    const repeats: number[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await login(email, 'wrong');
      expect(res.status).toBe(429);
      repeats.push(secondsOf(res));
    }
    expect(repeats).toEqual([300, 300, 300]);
  });
});
