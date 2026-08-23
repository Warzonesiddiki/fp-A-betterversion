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
});
