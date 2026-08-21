import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from './index.js';
import { JWT_SECRET } from './config/env.js';
import { db } from './db/connection.js';

/**
 * SEC-5: POST /api/incidents must enforce a strict zod contract via the
 * shared validate() middleware — 400 with structured details on bad input,
 * 201 on valid input. Also covers SEC-3 indirectly: the app must boot with
 * TRUST_PROXY unset (Express default) without error.
 */

const ADMIN_ID = 'sec-admin-id';

describe('SEC-5: incident creation validation', () => {
  let adminToken: string;

  beforeAll(() => {
    db.prepare(
      `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
       VALUES (?, 'sec-inc@finplan.test', 'not-a-real-hash', 'Sec', 'Incident', 'Admin', 1)`
    ).run(ADMIN_ID);
    adminToken = jwt.sign(
      { id: ADMIN_ID, email: 'sec-inc@finplan.test', role: 'Admin' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  it('rejects unauthenticated incident creation', async () => {
    const res = await request(app).post('/api/incidents').send({ title: 'x' });
    expect(res.status).toBe(401);
  });

  it('returns 400 with structured field errors for an invalid payload', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: '',
        severity: 'APOCALYPTIC',
        affectedUsers: -3,
        tags: [42],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    const fields = (res.body.details as Array<{ field: string }>).map((d) => d.field);
    expect(fields).toContain('title');
    expect(fields).toContain('severity');
    expect(fields).toContain('affectedUsers');
    expect(fields).toContain('tags.0');
  });

  it('rejects oversized titles and descriptions', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'x'.repeat(201), description: 'y'.repeat(2001) });

    expect(res.status).toBe(400);
    const fields = (res.body.details as Array<{ field: string }>).map((d) => d.field);
    expect(fields).toContain('title');
    expect(fields).toContain('description');
  });

  it('creates a valid incident with defaults applied', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'SEC-5 probe incident',
        description: 'Validated payload',
        severity: 'LOW',
        affectedSystems: ['api'],
        affectedUsers: 0,
        tags: ['test'],
      });

    expect(res.status).toBe(201);
    expect((res.body as { incident: { title: string; severity: string } }).incident.title).toBe(
      'SEC-5 probe incident'
    );
    expect((res.body as { incident: { severity: string } }).incident.severity).toBe('LOW');
  });
});
