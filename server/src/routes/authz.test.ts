import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { auditService } from '../services/AuditService.js';
import { db } from '../db/connection.js';

describe('Server-Side Authorization (F-0016) and Keyed Audit Hash Chain (F-0015)', () => {
  let adminToken: string;
  let viewerToken: string;
  let testUserId: string;

  beforeAll(() => {
    // Generate valid tokens with different roles
    testUserId = 'test-user-uuid-' + Date.now();
    adminToken = jwt.sign(
      { id: testUserId, email: 'admin@finplan.test', role: 'Admin' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    viewerToken = jwt.sign(
      { id: 'viewer-uuid', email: 'viewer@finplan.test', role: 'Viewer' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  describe('F-0016: Server-side RBAC and Tenant Isolation', () => {
    it('denies unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/audit');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('denies requests with invalid or expired token with 401', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', 'Bearer invalid.jwt.token');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('denies insufficient role requests with 403 (wrong-role denied)', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    it('allows correct-role requests (Admin token for audit)', async () => {
      const res = await request(app).get('/api/audit').set('Authorization', `Bearer ${adminToken}`);
      // Admin role is allowed access to /api/audit (returns entries array)
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('entries');
    });

    it('proves devtools/client-side auth mutation cannot bypass server authorization', async () => {
      // Even if a client edits their local Zustand authStore to say role: 'Admin',
      // if they don't have a valid JWT signed by JWT_SECRET (or valid server DB session),
      // the server rejects them with 401.
      const forgedToken = jwt.sign(
        { id: 'viewer-uuid', email: 'viewer@finplan.test', role: 'Admin' },
        'wrong-secret-key',
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${forgedToken}`);
      expect(res.status).toBe(401);
    });
  });

  describe('F-0015 (Second Half): Keyed HMAC Audit Hash Chain', () => {
    it('generates a keyed checksum for audit log entries using AuditService', () => {
      const entry = auditService.log({
        category: 'system_event',
        action: 'config_change',
        severity: 'info',
        userId: 'admin-1',
        userName: 'Admin',
        details: 'Testing keyed audit hash chain',
      });

      expect(entry).toHaveProperty('checksum');
      expect(typeof entry.checksum).toBe('string');
      expect(entry.checksum.length).toBeGreaterThan(0);

      // Verify the entry in DB has the checksum
      const row = db.prepare('SELECT checksum FROM audit_log WHERE id = ?').get(entry.id) as {
        checksum: string;
      };
      expect(row).toBeDefined();
      expect(row.checksum).toBe(entry.checksum);
    });
  });
});
