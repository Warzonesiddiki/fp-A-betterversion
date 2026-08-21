import { beforeAll, describe, expect, it } from 'vitest';
import { auditService } from '../services/AuditService.js';
import { db } from '../db/connection.js';

/**
 * W0.2d cross-tenant assertions for the shared AuditService.
 *
 * audit_log is a TENANT_SCOPED_TABLES member; these tests prove the newly
 * threaded tenantId parameter actually isolates reads: a scoped query,
 * getById, resource history, user activity, stats and both exports never
 * return another tenant's rows.
 */

const TENANT_A = 'tenant-w02d-a';
const TENANT_B = 'tenant-w02d-b';

function seedAuditRow(id: string, tenantId: string, userId: string): void {
  db.prepare(
    `INSERT OR REPLACE INTO audit_log (
       id, timestamp, category, action, severity, tenant_id,
       user_id, user_name, user_role, ip_address, user_agent, session_id,
       resource_type, resource_id, resource_name,
       old_value, new_value, change_summary,
       details, metadata, request_method, request_path, response_status, duration_ms,
       checksum
     ) VALUES (
       ?, datetime('now'), 'user_action', 'test_action', 'info', ?,
       ?, 'W02D Probe', 'Admin', NULL, NULL, NULL,
       'budget', 'res-w02d', 'W02D Resource',
       NULL, NULL, NULL,
       NULL, NULL, NULL, NULL, NULL, NULL,
       'w02d-checksum'
     )`
  ).run(id, tenantId, userId);
}

describe('W0.2d AuditService tenant threading (cross-tenant assertion)', () => {
  beforeAll(() => {
    // Real-SQLite FK enforcement: audit_log.user_id references users.
    for (const [id, email] of [
      ['user-w02d-a', 'w02d-a@finplan.test'],
      ['user-w02d-b', 'w02d-b@finplan.test'],
    ]) {
      db.prepare(
        `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, 'not-a-real-hash', 'W02D', 'Probe', 'Admin', 1)`
      ).run(id, email);
    }
    seedAuditRow('w02d-a-1', TENANT_A, 'user-w02d-a');
    seedAuditRow('w02d-a-2', TENANT_A, 'user-w02d-a');
    seedAuditRow('w02d-b-1', TENANT_B, 'user-w02d-b');
  });

  it('query() with tenantId returns only that tenant rows', () => {
    const a = auditService.query({ tenantId: TENANT_A });
    expect(a.total).toBe(2);
    expect(a.entries.map((e) => e.id).sort()).toEqual(['w02d-a-1', 'w02d-a-2']);

    const b = auditService.query({ tenantId: TENANT_B });
    expect(b.total).toBe(1);
    expect(b.entries[0]!.id).toBe('w02d-b-1');
  });

  it('getById() hides cross-tenant ids behind not-found', () => {
    expect(auditService.getById('w02d-b-1', TENANT_A)).toBeNull();
    expect(auditService.getById('w02d-b-1', TENANT_B)).not.toBeNull();
  });

  it('getResourceHistory() is tenant-scoped', () => {
    const a = auditService.getResourceHistory('budget', 'res-w02d', TENANT_A);
    expect(a.map((e) => e.id).sort()).toEqual(['w02d-a-1', 'w02d-a-2']);
    const b = auditService.getResourceHistory('budget', 'res-w02d', TENANT_B);
    expect(b.map((e) => e.id)).toEqual(['w02d-b-1']);
  });

  it('getUserActivity() is tenant-scoped', () => {
    // Tenant A asks about B's user id: sees nothing of B's rows.
    const cross = auditService.getUserActivity('user-w02d-b', 100, TENANT_A);
    expect(cross).toHaveLength(0);
    const own = auditService.getUserActivity('user-w02d-b', 100, TENANT_B);
    expect(own.map((e) => e.id)).toEqual(['w02d-b-1']);
  });

  it('getStats() counts only the caller tenant audit_log rows', () => {
    const statsA = auditService.getStats(undefined, TENANT_A);
    expect(statsA.total).toBe(2);
    const statsB = auditService.getStats(undefined, TENANT_B);
    expect(statsB.total).toBe(1);
  });

  it('exports honour the tenant filter', () => {
    const csv = auditService.exportCSV({ tenantId: TENANT_A });
    expect(csv).toContain('w02d-a-1');
    expect(csv).not.toContain('w02d-b-1');

    const json = JSON.parse(auditService.exportJSON({ tenantId: TENANT_B })) as { id: string }[];
    expect(json.map((e) => e.id)).toEqual(['w02d-b-1']);
  });
});
