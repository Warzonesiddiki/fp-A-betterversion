import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';

describe('Period Close (F-0013) & Server-Side Enforcement', () => {
  let adminToken: string;
  let viewerToken: string;
  let testPeriodId: string;

  beforeAll(() => {
    adminToken = jwt.sign(
      { id: 'admin-id', email: 'admin@finplan.test', role: 'Admin' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    viewerToken = jwt.sign(
      { id: 'viewer-id', email: 'viewer@finplan.test', role: 'Viewer' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Ensure a test period exists in DB
    testPeriodId = 'period-' + Date.now();
    db.prepare(
      `INSERT OR REPLACE INTO fiscal_periods (id, year, period_number, name, start_date, end_date, period_type, is_closed, close_state)
       VALUES (?, 2026, 1, '2026-01', '2026-01-01', '2026-01-31', 'Monthly', 0, 'open')`
    ).run(testPeriodId);
  });

  it('lists fiscal periods', async () => {
    const res = await request(app).get('/api/periods').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('denies closing period without reason or insufficient role', async () => {
    const resViewer = await request(app)
      .post(`/api/periods/${testPeriodId}/close`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ reason: 'Audit close' });
    expect(resViewer.status).toBe(403);

    const resNoReason = await request(app)
      .post(`/api/periods/${testPeriodId}/close`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(resNoReason.status).toBe(400);
  });

  it('closes fiscal period with reason and audit log (soft then hard)', async () => {
    // Legacy /close defaults to soft-close. Under the GAP-4 product decision
    // (2026-08-03) a soft-close keeps is_closed = 0 so adjusting entries stay
    // possible; the books only lock on hard-close/locked.
    const soft = await request(app)
      .post(`/api/periods/${testPeriodId}/close`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'SOX monthly close requirement' });
    expect(soft.status).toBe(200);
    expect(soft.body.is_closed).toBe(0);

    const hard = await request(app)
      .post(`/api/periods/${testPeriodId}/transition`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ targetState: 'hard-close', reason: 'Books final' });
    expect(hard.status).toBe(200);
    expect(hard.body.is_closed).toBe(1);
  });

  it('prevents posting GL entries to a closed period', async () => {
    const res = await request(app)
      .post('/api/gl/entries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        account_id: '10000000-0000-0000-0000-000000000001',
        entity_id: '20000000-0000-0000-0000-000000000001',
        post_date: '2026-01-15',
        amount: 1000,
        debit: 1000,
        credit: 0,
        description: 'Test closed period posting',
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Period closed');
  });

  it('successfully reopens fiscal period with admin role and reason', async () => {
    const res = await request(app)
      .post(`/api/periods/${testPeriodId}/reopen`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Adjusting journal entry required' });
    expect(res.status).toBe(200);
    expect(res.body.is_closed).toBe(0);
  });

  it('gets period close state', async () => {
    const res = await request(app)
      .get(`/api/periods/${testPeriodId}/state`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.closeState).toBe('open');
    expect(res.body.canPost).toBe(true);
    expect(res.body.validTransitions).toContain('soft-close');
  });

  it('gets period close audit trail', async () => {
    const res = await request(app)
      .get(`/api/periods/${testPeriodId}/audit`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('rejects invalid state transitions', async () => {
    // Try to go from open directly to locked (invalid)
    const res = await request(app)
      .post(`/api/periods/${testPeriodId}/transition`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ targetState: 'locked', reason: 'Invalid jump' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid transition');
  });

  it('rejects non-Manager role for transition endpoint', async () => {
    const res = await request(app)
      .post(`/api/periods/${testPeriodId}/transition`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ targetState: 'soft-close', reason: 'Should not work' });
    expect(res.status).toBe(403);
  });
});
