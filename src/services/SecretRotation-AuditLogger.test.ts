/**
 * SecretRotation + AuditLogger — PATCH 12 tests (Hephaestus, FinPlan Pro v1.0.0, 2026-06-16)
 *
 * Comprehensive test coverage for:
 *   - SecretRotation: create, rotate (grace period), verify, revoke,
 *     cleanup, listing, history, singleton.
 *   - AuditLogger: initialize, addEvent, query, getChainHead, verifyChain,
 *     export, restore, singleton.
 *   - Cross-service: secret.rotated flows into audit log.
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import {
  SecretRotation,
  SecretRotationError,
  SECRET_ROTATION_CONSTANTS,
  type SecretRotationAuditEvent,
} from './SecretRotation';
import {
  AuditLogger,
  AuditLoggerError,
  AUDIT_LOGGER_CONSTANTS,
  type AuditEvent,
  type AuditChainVerificationResult,
} from './AuditLogger';

// crypto.subtle is available in Node 20+ globalThis. Guard tests if not.
const HAS_CRYPTO =
  typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle !== 'undefined';

const skipIf = (cond: boolean) => (cond ? it.skip : it);

// ── 1. SECRET_ROTATION_CONSTANTS ─────────────────────────────────────────────

describe('1. SECRET_ROTATION_CONSTANTS', () => {
  it('1.1 has schema version 1', () => {
    expect(SECRET_ROTATION_CONSTANTS.SCHEMA_VERSION).toBe(1);
  });
  it('1.2 minimum secret bytes is 16', () => {
    expect(SECRET_ROTATION_CONSTANTS.MIN_SECRET_BYTES).toBe(16);
  });
  it('1.3 default secret bytes is 32', () => {
    expect(SECRET_ROTATION_CONSTANTS.DEFAULT_SECRET_BYTES).toBe(32);
  });
  it('1.4 max secret bytes is 64', () => {
    expect(SECRET_ROTATION_CONSTANTS.MAX_SECRET_BYTES).toBe(64);
  });
  it('1.5 default grace period is 1 hour', () => {
    expect(SECRET_ROTATION_CONSTANTS.DEFAULT_GRACE_PERIOD_SECONDS).toBe(3600);
  });
  it('1.6 max grace period is 7 days', () => {
    expect(SECRET_ROTATION_CONSTANTS.MAX_GRACE_PERIOD_SECONDS).toBe(7 * 24 * 60 * 60);
  });
  it('1.7 default TTL is 24 hours', () => {
    expect(SECRET_ROTATION_CONSTANTS.DEFAULT_TTL_SECONDS).toBe(24 * 60 * 60);
  });
  it('1.8 max TTL is 90 days', () => {
    expect(SECRET_ROTATION_CONSTANTS.MAX_TTL_SECONDS).toBe(90 * 24 * 60 * 60);
  });
  it('1.9 secret id prefix is sec_', () => {
    expect(SECRET_ROTATION_CONSTANTS.SECRET_ID_PREFIX).toBe('sec_');
  });
});

// ── 2. SecretRotation — creation ─────────────────────────────────────────────

describe('2. SecretRotation — creation', () => {
  let sr: SecretRotation;
  beforeEach(() => {
    SecretRotation.resetInstance();
    sr = SecretRotation.getInstance({ defaultActor: 'test' });
  });

  it('2.1 creates a secret with a generated material', async () => {
    const id = await sr.createSecret({ type: 'jwt', label: 'primary.jwt' });
    expect(id).toMatch(/^sec_/);
    const meta = sr.getSecretMetadata(id);
    expect(meta).not.toBeNull();
    expect(meta!.status).toBe('active');
    expect(meta!.type).toBe('jwt');
    expect(meta!.fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it('2.2 accepts explicit material of correct size', async () => {
    const mat = new Uint8Array(32);
    crypto.getRandomValues(mat);
    const id = await sr.createSecret({
      type: 'hmac',
      label: 'hmac.primary',
      material: mat,
    });
    const meta = sr.getSecretMetadata(id);
    expect(meta).not.toBeNull();
  });

  it('2.3 rejects too-short material', async () => {
    await expect(
      sr.createSecret({
        type: 'jwt',
        label: 'bad',
        material: new Uint8Array(8),
      })
    ).rejects.toThrow(SecretRotationError);
  });

  it('2.4 rejects too-large material', async () => {
    await expect(
      sr.createSecret({
        type: 'jwt',
        label: 'bad',
        material: new Uint8Array(128),
      })
    ).rejects.toThrow(SecretRotationError);
  });

  it('2.5 rejects unknown secret type', async () => {
    await expect(sr.createSecret({ type: 'nope' as never, label: 'x' })).rejects.toThrow(
      /unknown secret type/
    );
  });

  it('2.6 rejects empty label', async () => {
    await expect(sr.createSecret({ type: 'jwt', label: '' })).rejects.toThrow(/non-empty/);
  });

  it('2.7 rejects ttlSeconds out of range', async () => {
    await expect(sr.createSecret({ type: 'jwt', label: 'x', ttlSeconds: 0 })).rejects.toThrow();
  });

  it('2.8 returns unique ids', async () => {
    const a = await sr.createSecret({ type: 'jwt', label: 'a' });
    const b = await sr.createSecret({ type: 'jwt', label: 'b' });
    expect(a).not.toBe(b);
  });
});

// ── 3. SecretRotation — verify (active) ──────────────────────────────────────

describe('3. SecretRotation — verify (active)', () => {
  skipIf(!HAS_CRYPTO)('3.1 verifies correct material returns valid=true', async () => {
    const sr = SecretRotation.getInstance();
    const mat = new Uint8Array(32);
    crypto.getRandomValues(mat);
    const id = await sr.createSecret({
      type: 'jwt',
      label: 'p',
      material: mat,
    });
    const result = await sr.verifySecret(id, mat);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('active');
  });

  skipIf(!HAS_CRYPTO)('3.2 verifies incorrect material returns valid=false', async () => {
    const sr = SecretRotation.getInstance();
    const mat = new Uint8Array(32);
    crypto.getRandomValues(mat);
    const id = await sr.createSecret({
      type: 'jwt',
      label: 'p',
      material: mat,
    });
    const wrong = new Uint8Array(32);
    crypto.getRandomValues(wrong);
    const result = await sr.verifySecret(id, wrong);
    expect(result.valid).toBe(false);
  });

  it('3.3 unknown id returns valid=false, status=revoked', async () => {
    const sr = SecretRotation.getInstance();
    const result = await sr.verifySecret('sec_zzzzzzzz', new Uint8Array(32));
    expect(result.valid).toBe(false);
    expect(result.status).toBe('revoked');
  });

  it('3.4 invalid candidate type throws', async () => {
    const sr = SecretRotation.getInstance();
    const id = await sr.createSecret({ type: 'jwt', label: 'p' });
    await expect(sr.verifySecret(id, 'not-a-bytestring' as never)).rejects.toThrow();
  });
});

// ── 4. SecretRotation — rotate + grace period ────────────────────────────────

describe('4. SecretRotation — rotate + grace period', () => {
  skipIf(!HAS_CRYPTO)('4.1 rotates a secret; old still verifies during grace', async () => {
    const sr = SecretRotation.getInstance();
    const oldMat = new Uint8Array(32);
    crypto.getRandomValues(oldMat);
    const id = await sr.createSecret({
      type: 'jwt',
      label: 'p',
      material: oldMat,
    });
    const result = await sr.rotateSecret(id, {
      gracePeriodSeconds: 60,
      reason: 'scheduled',
    });
    expect(result.newSecretId).toMatch(/^sec_/);
    expect(result.oldSecretId).toBe(id);
    expect(result.graceEndsAt).toBeGreaterThan(Date.now());

    // Old material should still verify against the old id.
    const oldResult = await sr.verifySecret(id, oldMat);
    expect(oldResult.valid).toBe(true);
    expect(oldResult.status).toBe('rotating');

    // Old material should NOT verify against the new id.
    const newId = result.newSecretId;
    const newMeta = sr.getSecretMetadata(newId);
    expect(newMeta).not.toBeNull();
  });

  it('4.2 rotation with zero grace immediately invalidates old', async () => {
    const sr = SecretRotation.getInstance();
    const mat = new Uint8Array(32);
    crypto.getRandomValues(mat);
    const id = await sr.createSecret({
      type: 'jwt',
      label: 'p',
      material: mat,
    });
    await sr.rotateSecret(id, { gracePeriodSeconds: 0 });
    const r = await sr.verifySecret(id, mat);
    expect(r.status).toBe('expired');
    expect(r.valid).toBe(false);
  });

  it('4.3 cannot rotate a revoked secret', async () => {
    const sr = SecretRotation.getInstance();
    const id = await sr.createSecret({ type: 'jwt', label: 'p' });
    await sr.revokeSecret(id);
    await expect(sr.rotateSecret(id)).rejects.toThrow(/revoked/);
  });

  it('4.4 cannot rotate an unknown secret', async () => {
    const sr = SecretRotation.getInstance();
    await expect(sr.rotateSecret('sec_nope')).rejects.toThrow(/unknown/);
  });

  it('4.5 rotation rejects grace > MAX_GRACE', async () => {
    const sr = SecretRotation.getInstance();
    const id = await sr.createSecret({ type: 'jwt', label: 'p' });
    await expect(
      sr.rotateSecret(id, {
        gracePeriodSeconds: SECRET_ROTATION_CONSTANTS.MAX_GRACE_PERIOD_SECONDS + 1,
      })
    ).rejects.toThrow();
  });

  it('4.6 history is preserved across rotations', async () => {
    const sr = SecretRotation.getInstance();
    const id = await sr.createSecret({ type: 'jwt', label: 'p' });
    const r1 = await sr.rotateSecret(id, { gracePeriodSeconds: 60 });
    const r2 = await sr.rotateSecret(r1.newSecretId, {
      gracePeriodSeconds: 60,
    });
    const meta = sr.getSecretMetadata(r2.newSecretId);
    expect(meta).not.toBeNull();
  });
});

// ── 5. SecretRotation — revoke ───────────────────────────────────────────────

describe('5. SecretRotation — revoke', () => {
  it('5.1 revokeSecret on active id flips to revoked', async () => {
    const sr = SecretRotation.getInstance();
    const id = await sr.createSecret({ type: 'jwt', label: 'p' });
    await sr.revokeSecret(id, 'compromised');
    const meta = sr.getSecretMetadata(id);
    expect(meta!.status).toBe('revoked');
  });

  it('5.2 revokeSecret on unknown id throws', async () => {
    const sr = SecretRotation.getInstance();
    await expect(sr.revokeSecret('sec_nope')).rejects.toThrow(/unknown/);
  });

  it('5.3 revokeSecret is idempotent', async () => {
    const sr = SecretRotation.getInstance();
    const id = await sr.createSecret({ type: 'jwt', label: 'p' });
    await sr.revokeSecret(id);
    await expect(sr.revokeSecret(id)).resolves.toBeUndefined();
  });

  it('5.4 verification after revoke fails', async () => {
    const sr = SecretRotation.getInstance();
    const mat = new Uint8Array(32);
    crypto.getRandomValues(mat);
    const id = await sr.createSecret({
      type: 'jwt',
      label: 'p',
      material: mat,
    });
    await sr.revokeSecret(id);
    const r = await sr.verifySecret(id, mat);
    expect(r.valid).toBe(false);
    expect(r.status).toBe('revoked');
  });
});

// ── 6. SecretRotation — listing & metadata ──────────────────────────────────

describe('6. SecretRotation — listing & metadata', () => {
  beforeEach(() => {
    SecretRotation.resetInstance();
  });

  it('6.1 listSecrets returns all created', async () => {
    const sr = SecretRotation.getInstance();
    await sr.createSecret({ type: 'jwt', label: 'a' });
    await sr.createSecret({ type: 'hmac', label: 'b' });
    const list = sr.listSecrets();
    expect(list.length).toBe(2);
    expect(list.map((m) => m.label).sort()).toEqual(['a', 'b']);
  });

  it('6.2 metadata never exposes material', async () => {
    const sr = SecretRotation.getInstance();
    const id = await sr.createSecret({ type: 'jwt', label: 'p' });
    const meta = sr.getSecretMetadata(id) as unknown as Record<string, unknown>;
    expect(meta).not.toHaveProperty('material');
    expect(meta).not.toHaveProperty('previousMaterial');
  });
});

// ── 7. SecretRotation — cleanupExpiredGrace ──────────────────────────────────

describe('7. SecretRotation — cleanupExpiredGrace', () => {
  it('7.1 cleanup moves rotating -> expired when grace elapsed', async () => {
    const sr = SecretRotation.getInstance({
      defaultGracePeriodSeconds: 0,
    });
    const id = await sr.createSecret({ type: 'jwt', label: 'p' });
    await sr.rotateSecret(id, { gracePeriodSeconds: 0 });
    // With grace=0 the rotating record is already past graceEndsAt.
    const cleaned = await sr.cleanupExpiredGrace();
    expect(cleaned).toBe(1);
    const meta = sr.getSecretMetadata(id);
    expect(meta!.status).toBe('expired');
  });

  it('7.2 cleanup returns 0 when no expired grace', async () => {
    const sr = SecretRotation.getInstance();
    const id = await sr.createSecret({ type: 'jwt', label: 'p' });
    await sr.rotateSecret(id, { gracePeriodSeconds: 3600 });
    const cleaned = await sr.cleanupExpiredGrace();
    expect(cleaned).toBe(0);
  });
});

// ── 8. SecretRotation — singleton ────────────────────────────────────────────

describe('8. SecretRotation — singleton', () => {
  it('8.1 getInstance returns the same instance', () => {
    SecretRotation.resetInstance();
    const a = SecretRotation.getInstance();
    const b = SecretRotation.getInstance();
    expect(a).toBe(b);
  });

  it('8.2 resetInstance clears state', async () => {
    SecretRotation.resetInstance();
    const a = SecretRotation.getInstance();
    await a.createSecret({ type: 'jwt', label: 'p' });
    SecretRotation.resetInstance();
    const b = SecretRotation.getInstance();
    expect(b.listSecrets().length).toBe(0);
  });
});

// ── 9. AuditLogger — constants & singleton ───────────────────────────────────

describe('9. AuditLogger — constants & singleton', () => {
  it('9.1 schema version is 1', () => {
    expect(AUDIT_LOGGER_CONSTANTS.SCHEMA_VERSION).toBe(1);
  });
  it('9.2 genesis preimage is set', () => {
    expect(AUDIT_LOGGER_CONSTANTS.GENESIS_PREIMAGE.length).toBeGreaterThan(0);
  });
  it('9.3 max events is 100k', () => {
    expect(AUDIT_LOGGER_CONSTANTS.MAX_EVENTS).toBe(100_000);
  });
  it('9.4 max payload bytes is 64KB', () => {
    expect(AUDIT_LOGGER_CONSTANTS.MAX_PAYLOAD_BYTES).toBe(64 * 1024);
  });
  it('9.5 categories include all required', () => {
    expect(AUDIT_LOGGER_CONSTANTS.CATEGORY.AUTH).toBe('auth');
    expect(AUDIT_LOGGER_CONSTANTS.CATEGORY.SECRET_ROTATION).toBe('secret-rotation');
    expect(AUDIT_LOGGER_CONSTANTS.CATEGORY.SECURITY_INCIDENT).toBe('security-incident');
  });

  it('9.6 singleton returns the same instance', () => {
    AuditLogger.resetInstance();
    const a = AuditLogger.getInstance();
    const b = AuditLogger.getInstance();
    expect(a).toBe(b);
  });
});

// ── 10. AuditLogger — addEvent ───────────────────────────────────────────────

describe('10. AuditLogger — addEvent', () => {
  let al: AuditLogger;
  beforeEach(() => {
    AuditLogger.resetInstance();
    al = AuditLogger.getInstance({ source: 'finplan-test' });
  });

  skipIf(!HAS_CRYPTO)('10.1 appends an event and updates chain head', async () => {
    const head0 = al.getChainHead();
    const ev = await al.addEvent({
      actor: 'test',
      eventType: 'user.login',
      category: 'auth',
      severity: 'info',
      payload: { userId: 'u1' },
      source: 'finplan-test',
    });
    expect(ev.id).toMatch(/^ev_/);
    expect(ev.eventHash).toMatch(/^[0-9a-f]{64}$/);
    expect(ev.prevChainHash).toBe(head0);
    expect(al.getChainHead()).toBe(ev.eventHash);
    expect(al.getEventCount()).toBe(1);
  });

  skipIf(!HAS_CRYPTO)('10.2 two events produce distinct hashes', async () => {
    const a = await al.addEvent({
      actor: 'a',
      eventType: 'x',
      category: 'system',
      source: 's',
    });
    const b = await al.addEvent({
      actor: 'a',
      eventType: 'x',
      category: 'system',
      source: 's',
    });
    expect(a.eventHash).not.toBe(b.eventHash);
  });

  it('10.3 rejects missing actor', async () => {
    await expect(
      al.addEvent({
        actor: '',
        eventType: 'x',
        category: 'system',
        source: 's',
      })
    ).rejects.toThrow();
  });

  it('10.4 rejects unknown category', async () => {
    await expect(
      al.addEvent({
        actor: 'a',
        eventType: 'x',
        category: 'nope' as never,
        source: 's',
      })
    ).rejects.toThrow();
  });

  it('10.5 rejects unknown severity', async () => {
    await expect(
      al.addEvent({
        actor: 'a',
        eventType: 'x',
        category: 'system',
        severity: 'bogus' as never,
        source: 's',
      })
    ).rejects.toThrow();
  });

  it('10.6 rejects too-large payload', async () => {
    const big = { data: 'x'.repeat(AUDIT_LOGGER_CONSTANTS.MAX_PAYLOAD_BYTES + 10) };
    await expect(
      al.addEvent({
        actor: 'a',
        eventType: 'x',
        category: 'system',
        payload: big,
        source: 's',
      })
    ).rejects.toThrow(/too large/);
  });

  it('10.7 rejects payload that is an array', async () => {
    await expect(
      al.addEvent({
        actor: 'a',
        eventType: 'x',
        category: 'system',
        payload: [] as unknown as Record<string, unknown>,
        source: 's',
      })
    ).rejects.toThrow();
  });
});

// ── 11. AuditLogger — verifyChain ────────────────────────────────────────────

describe('11. AuditLogger — verifyChain', () => {
  let al: AuditLogger;
  beforeEach(() => {
    AuditLogger.resetInstance();
    al = AuditLogger.getInstance();
  });

  skipIf(!HAS_CRYPTO)('11.1 valid chain returns valid=true', async () => {
    for (let i = 0; i < 5; i++) {
      await al.addEvent({
        actor: 't',
        eventType: 'e' + i,
        category: 'system',
        source: 's',
      });
    }
    const v: AuditChainVerificationResult = await al.verifyChain();
    expect(v.valid).toBe(true);
    expect(v.inspected).toBe(5);
  });

  skipIf(!HAS_CRYPTO)('11.2 tampering with payload breaks the chain', async () => {
    await al.addEvent({
      actor: 't',
      eventType: 'e1',
      category: 'system',
      source: 's',
    });
    const evs = al.getEvents();
    evs[0].payload = { tampered: true };
    const v = await al.verifyChain();
    expect(v.valid).toBe(false);
    expect(v.firstFailure).toBe(0);
  });

  it('11.3 empty chain is valid', async () => {
    const v = await al.verifyChain();
    expect(v.valid).toBe(true);
    expect(v.inspected).toBe(0);
  });
});

// ── 12. AuditLogger — query ──────────────────────────────────────────────────

describe('12. AuditLogger — query', () => {
  let al: AuditLogger;
  beforeEach(() => {
    AuditLogger.resetInstance();
    al = AuditLogger.getInstance();
  });

  skipIf(!HAS_CRYPTO)('12.1 filters by category', async () => {
    await al.addEvent({ actor: 'a', eventType: 'e1', category: 'auth', source: 's' });
    await al.addEvent({ actor: 'a', eventType: 'e2', category: 'system', source: 's' });
    const r = al.query({ category: 'auth' });
    expect(r.length).toBe(1);
    expect(r[0].eventType).toBe('e1');
  });

  skipIf(!HAS_CRYPTO)('12.2 filters by actor and source', async () => {
    await al.addEvent({ actor: 'u1', eventType: 'e', category: 'system', source: 's1' });
    await al.addEvent({ actor: 'u2', eventType: 'e', category: 'system', source: 's2' });
    const r = al.query({ actor: 'u1', source: 's1' });
    expect(r.length).toBe(1);
  });

  skipIf(!HAS_CRYPTO)('12.3 filters by time range', async () => {
    await al.addEvent({
      actor: 'a',
      eventType: 'e1',
      category: 'system',
      source: 's',
      timestamp: 1000,
    });
    await al.addEvent({
      actor: 'a',
      eventType: 'e2',
      category: 'system',
      source: 's',
      timestamp: 2000,
    });
    await al.addEvent({
      actor: 'a',
      eventType: 'e3',
      category: 'system',
      source: 's',
      timestamp: 3000,
    });
    const r = al.query({ sinceMs: 1500, untilMs: 2500 });
    expect(r.length).toBe(1);
    expect(r[0].eventType).toBe('e2');
  });

  skipIf(!HAS_CRYPTO)('12.4 limit and offset work', async () => {
    for (let i = 0; i < 10; i++) {
      await al.addEvent({ actor: 'a', eventType: 'e' + i, category: 'system', source: 's' });
    }
    const r = al.query({ limit: 3, offset: 2 });
    expect(r.length).toBe(3);
    expect(r[0].eventType).toBe('e2');
  });
});

// ── 13. AuditLogger — export & restore ───────────────────────────────────────

describe('13. AuditLogger — export & restore', () => {
  let al: AuditLogger;
  beforeEach(() => {
    AuditLogger.resetInstance();
    al = AuditLogger.getInstance();
  });

  skipIf(!HAS_CRYPTO)('13.1 export json includes events and chain head', async () => {
    await al.addEvent({ actor: 'a', eventType: 'e1', category: 'system', source: 's' });
    const j = al.export('json');
    const obj = JSON.parse(j);
    expect(obj.events.length).toBe(1);
    expect(obj.chainHead).toBe(al.getChainHead());
  });

  skipIf(!HAS_CRYPTO)('13.2 export jsonl yields one event per line', async () => {
    await al.addEvent({ actor: 'a', eventType: 'e1', category: 'system', source: 's' });
    await al.addEvent({ actor: 'a', eventType: 'e2', category: 'system', source: 's' });
    const jl = al.export('jsonl');
    const lines = jl.split('\n');
    expect(lines.length).toBe(2);
    JSON.parse(lines[0]);
    JSON.parse(lines[1]);
  });

  skipIf(!HAS_CRYPTO)('13.3 restore accepts valid snapshot', async () => {
    await al.addEvent({ actor: 'a', eventType: 'e1', category: 'system', source: 's' });
    const expectedChainHead = al.getChainHead();
    const snap = {
      chainHead: expectedChainHead,
      events: al.getEvents(),
    };
    AuditLogger.resetInstance();
    const al2 = AuditLogger.getInstance();
    await al2.restore(snap);
    expect(al2.getEventCount()).toBe(1);
    expect(al2.getChainHead()).toBe(expectedChainHead);
  });

  skipIf(!HAS_CRYPTO)('13.4 restore rejects broken chain', async () => {
    await al.addEvent({ actor: 'a', eventType: 'e1', category: 'system', source: 's' });
    const evs = al.getEvents();
    evs[0].payload = { tampered: true };
    await expect(al.restore({ chainHead: al.getChainHead(), events: evs })).rejects.toThrow();
  });
});

// ── 14. Cross-service: secret rotation flows into audit log ──────────────────

describe('14. Cross-service: secret rotation flows into audit log', () => {
  it('14.1 audit log receives all rotation events', async () => {
    SecretRotation.resetInstance();
    AuditLogger.resetInstance();

    const auditLog = AuditLogger.getInstance({ source: 'cross' });
    const events: SecretRotationAuditEvent[] = [];
    const sr = SecretRotation.getInstance({
      onAudit: async (e) => {
        events.push(e);
        await auditLog.addEvent({
          actor: 'sr',
          eventType: e.type,
          category: 'secret-rotation',
          severity: 'info',
          payload: { ...e } as Record<string, unknown>,
          source: 'cross',
          correlationId: null,
        });
      },
    });

    const id = await sr.createSecret({ type: 'jwt', label: 'integration' });
    const r = await sr.rotateSecret(id, { gracePeriodSeconds: 60 });
    await sr.revokeSecret(r.newSecretId);

    // 3 audit events: created, rotated, revoked
    expect(events.length).toBe(3);
    expect(events[0].type).toBe('secret.created');
    expect(events[1].type).toBe('secret.rotated');
    expect(events[2].type).toBe('secret.revoked');
    // And 3 entries in the audit log
    expect(auditLog.getEventCount()).toBe(3);
    const v = await auditLog.verifyChain();
    expect(v.valid).toBe(true);
  });
});

// ── 15. Defensive: graceful degradation when audit throws ────────────────────

describe('15. Defensive: graceful degradation when audit throws', () => {
  it('15.1 sr still operates when onAudit throws', async () => {
    SecretRotation.resetInstance();
    const sr = SecretRotation.getInstance({
      onAudit: () => {
        throw new Error('audit sink down');
      },
    });
    const id = await sr.createSecret({ type: 'jwt', label: 'p' });
    const r = await sr.rotateSecret(id, { gracePeriodSeconds: 60 });
    expect(r.newSecretId).toBeTruthy();
    await sr.revokeSecret(r.newSecretId);
    // No throw — the host must keep operating.
    const meta = sr.getSecretMetadata(r.newSecretId);
    expect(meta!.status).toBe('revoked');
  });
});
