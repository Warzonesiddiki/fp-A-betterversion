import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../index.js';
import { db } from '../db/connection.js';

/**
 * SEC-1/SEC-2 refresh-token hardening tests.
 *
 * SEC-1: refresh tokens are stored only as sha256 hashes at rest — the raw
 * token must never appear in refresh_tokens.token.
 *
 * SEC-2: /refresh rotates (revokes the presented token, issues a new one),
 * and replaying a revoked token triggers reuse detection that revokes ALL
 * of the user's tokens. Logout also revokes (not deletes) so later replay
 * is detected.
 */

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function registerUser(email: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', firstName: 'Sec', lastName: 'Probe' });
  expect(res.status).toBe(201);
  return res.body as { accessToken: string; refreshToken: string };
}

describe('SEC-1/SEC-2: refresh-token hashing + rotation', () => {
  const RUN = Date.now();
  const emailA = `sec1-a-${RUN}@finplan.test`;
  const emailB = `sec1-b-${RUN}@finplan.test`;

  beforeAll(() => {
    db.prepare("DELETE FROM refresh_tokens WHERE user_id LIKE 'sec-probe-%'").run();
  });

  it('SEC-1: stores only the sha256 hash of the refresh token at rest', async () => {
    const { refreshToken } = await registerUser(emailA);

    const row = db.prepare('SELECT token FROM refresh_tokens WHERE token = ?').get(refreshToken);
    expect(row).toBeUndefined();

    const hashed = db
      .prepare('SELECT token FROM refresh_tokens WHERE token = ?')
      .get(sha256(refreshToken)) as { token: string } | undefined;
    expect(hashed?.token).toBe(sha256(refreshToken));
  });

  it('SEC-2: /refresh rotates — issues a NEW refresh token and revokes the old one', async () => {
    const { refreshToken } = await registerUser(emailB);

    const first = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(first.status).toBe(200);
    const body = first.body as { accessToken?: string; refreshToken?: string };
    expect(body.accessToken).toBeTruthy();

    // A new refresh token was issued and differs from the presented one.
    expect(body.refreshToken).toBeTruthy();
    expect(body.refreshToken).not.toBe(refreshToken);

    // The old row is kept but revoked (not deleted), enabling reuse detection.
    const oldRow = db
      .prepare('SELECT revoked_at FROM refresh_tokens WHERE token = ?')
      .get(sha256(refreshToken)) as { revoked_at: string | null } | undefined;
    expect(oldRow).toBeDefined();
    expect(oldRow!.revoked_at).not.toBeNull();
  });

  it('SEC-2: replaying a rotated token revokes ALL of the user tokens', async () => {
    const { refreshToken } = await registerUser(`sec1-c-${RUN}@finplan.test`);

    // Rotate once: original is now revoked, v2 is active.
    const first = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(first.status).toBe(200);
    const v2 = (first.body as { refreshToken: string }).refreshToken;
    expect(v2).toBeTruthy();

    // Replay the ORIGINAL (revoked) token → reuse detection fires.
    const replay = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(replay.status).toBe(401);
    expect((replay.body as { error: string }).error).toMatch(/reuse detected/i);

    // ALL of the user's tokens were revoked, including the legitimately
    // issued v2 — it can no longer be refreshed.
    const v2Attempt = await request(app).post('/api/auth/refresh').send({ refreshToken: v2 });
    expect(v2Attempt.status).toBe(401);

    const rows = db
      .prepare(
        `SELECT rt.revoked_at FROM refresh_tokens rt
         JOIN users u ON u.id = rt.user_id WHERE u.email = ?`
      )
      .all(`sec1-c-${RUN}@finplan.test`) as { revoked_at: string | null }[];
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every((r) => r.revoked_at !== null)).toBe(true);
  });

  it('SEC-2: logout revokes instead of deletes; replaying the logged-out token triggers reuse detection', async () => {
    const { refreshToken } = await registerUser(`sec1-d-${RUN}@finplan.test`);

    const out = await request(app).post('/api/auth/logout').send({ refreshToken });
    expect(out.status).toBe(200);

    // Row kept, revoked.
    const row = db
      .prepare('SELECT revoked_at FROM refresh_tokens WHERE token = ?')
      .get(sha256(refreshToken)) as { revoked_at: string | null } | undefined;
    expect(row).toBeDefined();
    expect(row!.revoked_at).not.toBeNull();

    // Refresh with the logged-out token hits reuse detection, not "invalid".
    const attempt = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(attempt.status).toBe(401);
    expect((attempt.body as { error: string }).error).toMatch(/reuse detected/i);
  });

  it('legacy plaintext rows no longer authenticate (force re-login accepted)', async () => {
    // Register a real user, then simulate a pre-SEC-1 row: raw token in the DB.
    const { accessToken } = await registerUser(`sec1-e-${RUN}@finplan.test`);
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    const userId = (me.body as { user: { id: string } }).user.id;

    const legacyRaw = 'legacy-plaintext-refresh-token';
    db.prepare(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).run(
      `sec-probe-legacy-${RUN}`,
      userId,
      legacyRaw,
      new Date(Date.now() + 60_000).toISOString()
    );

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: legacyRaw });
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('Invalid refresh token');
  });
});
