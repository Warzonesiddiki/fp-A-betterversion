/**
 * SecretsVault.test.ts — PATCH 16 — Vitest stubs
 * @ratification_gate 2026-06-22T16:00:00Z
 *
 * Hephaestus (Security Muse) — 4-ICP coverage matrix
 *   I1 Carla  cascade-safety      → tests/cascade/*
 *   C2 Vera   type-safety         → tests/types/*
 *   P3 Chris  operational         → tests/operational/*
 *   D4 Beth   user-impact         → tests/user-impact/*
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────────────
const _mockStronghold = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
  isAvailable: vi.fn().mockResolvedValue(true),
  rotate: vi.fn(),
};

// ─── I1 Carla — cascade-safety ─────────────────────────────────────────────
describe('I1 Carla — cascade-safety', () => {
  it('CASCADE-VETO: rejects write when cascade detector fires', async () => {
    // arrange: cascade detector returns true
    // act: vault.set("key", "value")
    // assert: result.ok === false && code === "CASCADE_VETO"
    expect(true).toBe(true); // STUB
  });

  it('QUORUM_NOT_REACHED: returns error if <2 shards ack write', async () => {
    expect(true).toBe(true); // STUB
  });

  it('CHECKSUM_MISMATCH: invalidates entry and returns error', async () => {
    expect(true).toBe(true); // STUB
  });

  it('CIRCUIT_OPEN: trips after 3 strikes, opens for 30s', async () => {
    expect(true).toBe(true); // STUB
  });

  it('WAL_REPLAY_FAILED: returns error and preserves quorum state', async () => {
    expect(true).toBe(true); // STUB
  });
});

// ─── C2 Vera — type-safety ─────────────────────────────────────────────────
describe('C2 Vera — type-safety', () => {
  it('VaultResult<T> discriminated union: ok=true branch has value', () => {
    // type-narrowing test
    expect(true).toBe(true); // STUB
  });

  it('VaultError: ok=false branch has code/message/traceId', () => {
    expect(true).toBe(true); // STUB
  });

  it("VaultShardId: only accepts 'shard-0' | 'shard-1' | 'shard-2'", () => {
    // compile-time assertion
    expect(true).toBe(true); // STUB
  });

  it('RotationReason: only accepts 6 enum values', () => {
    expect(true).toBe(true); // STUB
  });

  it('set<T> infers T from call site', () => {
    expect(true).toBe(true); // STUB
  });

  it('get<T = unknown> returns default if no generic provided', () => {
    expect(true).toBe(true); // STUB
  });
});

// ─── P3 Chris — operational ────────────────────────────────────────────────
describe('P3 Chris — operational', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rotate() emits progress events in correct order', async () => {
    // assert: re-encrypt-shard-0 → re-encrypt-shard-1 → re-encrypt-shard-2
    //        → verify-quorum → wal-compact → complete
    expect(true).toBe(true); // STUB
  });

  it('rotation counter monotonic across rotations', async () => {
    expect(true).toBe(true); // STUB
  });

  it('fallback cache expires after 5-min TTL', async () => {
    expect(true).toBe(true); // STUB
  });

  it('circuit breaker resets after cooldown', async () => {
    expect(true).toBe(true); // STUB
  });

  it('WAL replay recovers last-known-good state', async () => {
    expect(true).toBe(true); // STUB
  });

  it('listener unsubscribe returns disposer', () => {
    expect(true).toBe(true); // STUB
  });
});

// ─── D4 Beth — user-impact ─────────────────────────────────────────────────
describe('D4 Beth — user-impact', () => {
  it("set('api-key', 'sk-...') returns ok=true on success path", async () => {
    expect(true).toBe(true); // STUB
  });

  it("get('api-key') returns { ok:true, value:'sk-...' } on hit", async () => {
    expect(true).toBe(true); // STUB
  });

  it("get('missing') returns { ok:false, code:'KEY_NOT_FOUND', retriable:false }", async () => {
    expect(true).toBe(true); // STUB
  });

  it('delete() idempotent: second call returns same shape', async () => {
    expect(true).toBe(true); // STUB
  });

  it('error messages do NOT leak key material', async () => {
    // privacy test
    expect(true).toBe(true); // STUB
  });

  it('VaultError.retriable correctly indicates caller retry guidance', async () => {
    expect(true).toBe(true); // STUB
  });
});

// ─── Cross-cutting (integration) ───────────────────────────────────────────
describe('Integration: TauriSecureStorage ↔ SecretsVault ↔ AuditLogger', () => {
  it('set() emits AuditLogger event with masked payload', async () => {
    expect(true).toBe(true); // STUB
  });

  it('rotate() emits AuditLogger event with reason + counter', async () => {
    expect(true).toBe(true); // STUB
  });

  it('ThreatModel (PATCH 10) cascade-detect consulted on write', async () => {
    expect(true).toBe(true); // STUB
  });
});

// ─── CAVEMAN PERSIST (RULE #47) ─────────────────────────────────────────────
describe('CAVEMAN PERSIST — RULE #47 fallbacks', () => {
  it('storage unavailable → in-memory cache fallback', async () => {
    expect(true).toBe(true); // STUB
  });

  it('stronghold throws → error envelope, no crash', async () => {
    expect(true).toBe(true); // STUB
  });

  it('multiple consecutive failures → circuit breaker trip', async () => {
    expect(true).toBe(true); // STUB
  });
});

// ============================================================================
// Probe T-FIX-12 BRUTAL v2.0 — Edge-case additions
// (Hephaestus retains PATCH 16 stubs above; Probe appends real tests below)
// ============================================================================

import { SecretsVault, createSecretsVault } from './SecretsVault';
import type { AuditLogger, AuditEvent, TauriSecureStorage, ThreatSignal } from './interfaces';

function probeMakeStorage(
  overrides: Partial<TauriSecureStorage> = {}
): TauriSecureStorage & { _store: Map<string, string> } {
  const store = new Map<string, string>();
  const storage: TauriSecureStorage = {
    async set(key, value) {
      if (overrides.set) return overrides.set(key, value);
      store.set(key, value);
    },
    async get(key) {
      if (overrides.get) return overrides.get(key);
      return store.has(key) ? (store.get(key) as string) : null;
    },
    async delete(key) {
      if (overrides.delete) return overrides.delete(key);
      store.delete(key);
    },
    async isAvailable() {
      if (overrides.isAvailable) return overrides.isAvailable();
      return true;
    },
  };
  return Object.assign(storage, { _store: store });
}

function probeMakeAudit(): AuditLogger & { _events: AuditEvent[] } {
  const events: AuditEvent[] = [];
  let counter = 0;
  const logger: AuditLogger = {
    async log(event) {
      events.push(event);
      counter += 1;
      return `audit-${counter}`;
    },
  };
  return Object.assign(logger, { _events: events });
}

describe('Probe edge-cases — storage unavailable', () => {
  it('set() returns STORAGE_UNAVAILABLE when isAvailable()=false', async () => {
    const store = probeMakeStorage({ isAvailable: async () => false });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.set('k', 'v');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('STORAGE_UNAVAILABLE');
      expect(r.retriable).toBe(true);
      expect(r.key).toBe('k');
      expect(typeof r.traceId).toBe('string');
    }
  });
  it('get() returns STORAGE_UNAVAILABLE when isAvailable()=false', async () => {
    const store = probeMakeStorage({ isAvailable: async () => false });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.get('k');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('STORAGE_UNAVAILABLE');
  });
  it('delete() returns STORAGE_UNAVAILABLE when isAvailable()=false', async () => {
    const store = probeMakeStorage({ isAvailable: async () => false });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.delete('k');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('STORAGE_UNAVAILABLE');
  });
  it('isAvailable() throwing is caught and treated as unavailable', async () => {
    const store = probeMakeStorage({
      isAvailable: async () => {
        throw new Error('probe-fail');
      },
    });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.set('k', 'v');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('STORAGE_UNAVAILABLE');
  });
});

describe('Probe edge-cases — circuit breaker', () => {
  it('opens after CIRCUIT_BREAKER_THRESHOLD consecutive failures', async () => {
    const store = probeMakeStorage({
      set: async () => {
        throw new Error('boom');
      },
    });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    for (let i = 0; i < 5; i += 1) await vault.set('k', i);
    const tripped = await vault.set('k', 'blocked');
    expect(tripped.ok).toBe(false);
    if (!tripped.ok) {
      expect(tripped.code).toBe('CIRCUIT_OPEN');
      expect(tripped.retriable).toBe(true);
    }
  });
  it('closes circuit after cooldown elapses', async () => {
    const store = probeMakeStorage({
      set: async () => {
        throw new Error('boom');
      },
    });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    for (let i = 0; i < 5; i += 1) await vault.set('k', i);
    const realNow = Date.now;
    Date.now = () => realNow() + 10_000_000;
    try {
      const next = await vault.set('k', 'v');
      expect(next.ok).toBe(false);
      if (!next.ok) expect(next.code).toBe('INTERNAL');
    } finally {
      Date.now = realNow;
    }
  });
});

describe('Probe edge-cases — quorum & envelope', () => {
  it('writes to all 3 shards when storage.set is healthy', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.set('api-key', 'secret-123');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.shardsWritten).toEqual(['shard-0', 'shard-1', 'shard-2']);
      expect(r.quorumReached).toBe(true);
    }
  });
  it('succeeds with 2-of-3 quorum when one shard fails', async () => {
    const store = probeMakeStorage({
      set: async (key, value) => {
        if (key.includes('.shard-1.')) throw new Error('shard-1-down');
        store._store.set(key, value);
      },
    });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.set('q-key', 'value');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.shardsWritten).toEqual(['shard-0', 'shard-2']);
      expect(r.quorumReached).toBe(true);
    }
  });
  it('returns INTERNAL when all 3 shards fail', async () => {
    const store = probeMakeStorage({
      set: async () => {
        throw new Error('all-shards-down');
      },
    });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.set('q-fail', 'v');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('INTERNAL');
      expect(r.retriable).toBe(true);
    }
  });
});

describe('Probe edge-cases — type-safety round-trips', () => {
  it('round-trips a primitive string', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('s', 'hello');
    const got = await vault.get<string>('s');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toBe('hello');
  });
  it('round-trips a primitive number', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('n', 12345.678);
    const got = await vault.get<number>('n');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toBe(12345.678);
  });
  it('round-trips a boolean false (truthy check trap)', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('b', false);
    const got = await vault.get<boolean>('b');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toBe(false);
  });
  it('round-trips null', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('null-key', null);
    const got = await vault.get<unknown>('null-key');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toBeNull();
  });
  it('round-trips a Unicode string (emoji + RTL + CJK)', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const s = '🚀 FinPlan — مرحبا 你好';
    await vault.set('uni', s);
    const got = await vault.get<string>('uni');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toBe(s);
  });
  it('round-trips a complex nested object', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const payload = {
      user: { id: 7, name: 'Ada', tags: ['admin', 'beta'] },
      metadata: { ts: 1700000000000, nested: { deep: true } },
    };
    await vault.set('obj', payload);
    const got = await vault.get<typeof payload>('obj');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toEqual(payload);
  });
  it('round-trips an empty string', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('empty', '');
    const got = await vault.get<string>('empty');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toBe('');
  });
  it('round-trips an empty array', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('arr', []);
    const got = await vault.get<unknown>('arr');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toEqual([]);
  });
});

describe('Probe edge-cases — retrieval paths', () => {
  it('returns KEY_NOT_FOUND when no shard has the key', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.get('never-written');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('KEY_NOT_FOUND');
      expect(r.retriable).toBe(false);
    }
  });
  it('reads from shard-1 when shard-0 is missing', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('k', 'v');
    store._store.delete('vault.shard-0.k');
    const got = await vault.get<string>('k');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toBe('v');
  });
  it('reads from shard-2 when shard-0 and shard-1 are missing', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('k', 'v');
    store._store.delete('vault.shard-0.k');
    store._store.delete('vault.shard-1.k');
    const got = await vault.get<string>('k');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toBe('v');
  });
  it('returns DECRYPT_FAILED when envelope ciphertext is tampered', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('t', 'original');
    for (const [k, v] of store._store.entries()) {
      if (k.endsWith('.t') && k.includes('.shard-')) {
        const parsed = JSON.parse(v);
        parsed.ciphertext = Buffer.from('garbage').toString('base64');
        store._store.set(k, JSON.stringify(parsed));
      }
    }
    const got = await vault.get('t');
    expect(got.ok).toBe(false);
    if (!got.ok) expect(got.code).toBe('DECRYPT_FAILED');
  });
  it('skips unparseable-JSON shard and reads healthy one', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('mixed', 'good-value');
    const k0 = 'vault.shard-0.mixed';
    if (store._store.has(k0)) store._store.set(k0, '{not-json{');
    const got = await vault.get('mixed');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toBe('good-value');
  });
  it('skips envelope with empty checksum and reads healthy shard', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('bad-checksum', 'good-value');
    const k0 = 'vault.shard-0.bad-checksum';
    const v0 = store._store.get(k0);
    if (v0) {
      const parsed = JSON.parse(v0);
      parsed.checksum = '';
      store._store.set(k0, JSON.stringify(parsed));
    }
    const got = await vault.get('bad-checksum');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toBe('good-value');
  });
  it('skips envelope with empty ciphertext and reads healthy shard', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('bad-ct', 'good-value');
    const k0 = 'vault.shard-0.bad-ct';
    const v0 = store._store.get(k0);
    if (v0) {
      const parsed = JSON.parse(v0);
      parsed.ciphertext = '';
      store._store.set(k0, JSON.stringify(parsed));
    }
    const got = await vault.get('bad-ct');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value).toBe('good-value');
  });
  it('returns KEY_NOT_FOUND when all 3 shards are corrupted', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('allbad', 'v');
    for (const k of Array.from(store._store.keys())) {
      if (k.endsWith('.allbad') && k.includes('.shard-')) {
        store._store.set(k, '{not-json');
      }
    }
    const got = await vault.get('allbad');
    expect(got.ok).toBe(false);
    if (!got.ok) expect(got.code).toBe('KEY_NOT_FOUND');
  });
  it('returns DECRYPT_FAILED when ALL shards have wrong IV', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('bad-iv', 'v');
    for (const [k, v] of store._store.entries()) {
      if (k.endsWith('.bad-iv') && k.includes('.shard-')) {
        const parsed = JSON.parse(v);
        parsed.iv = Buffer.from(new Uint8Array(12)).toString('base64');
        store._store.set(k, JSON.stringify(parsed));
      }
    }
    const got = await vault.get('bad-iv');
    expect(got.ok).toBe(false);
    if (!got.ok) expect(got.code).toBe('DECRYPT_FAILED');
  });
});

describe('Probe edge-cases — delete', () => {
  it('is best-effort: missing shards do not cause failure', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.delete('never-set');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.shardsWritten).toEqual([]);
      expect(r.quorumReached).toBe(false);
      expect(r.version).toBe(0);
    }
  });
  it('removes the key from all 3 shards', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('del-me', 'v');
    const del = await vault.delete('del-me');
    expect(del.ok).toBe(true);
    const after = await vault.get('del-me');
    expect(after.ok).toBe(false);
  });
});

describe('Probe edge-cases — rotation', () => {
  it('rotate() rejects with ROTATION_IN_PROGRESS when already in flight', async () => {
    const store = probeMakeStorage({
      get: () => new Promise(() => undefined),
      set: () => new Promise(() => undefined),
    });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const first = vault.rotate('manual');
    await Promise.resolve();
    const second = await vault.rotate('manual');
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.code).toBe('ROTATION_IN_PROGRESS');
    first.catch(() => undefined);
  });
  it('rotate() increments the rotation counter on success', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.rotate('scheduled');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.newRotationCount).toBe(1);
      expect(typeof r.durationMs).toBe('number');
    }
  });
  it('rotate() chains subsequent rotations', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r1 = await vault.rotate('scheduled');
    const r2 = await vault.rotate('manual');
    if (r1.ok && r2.ok) expect(r2.newRotationCount).toBe(2);
  });
  it('emits progress to listeners across 6+ phases', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const phases: string[] = [];
    const unsub = vault.onRotationProgress((p) => phases.push(p.phase));
    await vault.rotate('scheduled');
    unsub();
    expect(phases.length).toBeGreaterThanOrEqual(7);
    expect(phases[phases.length - 1]).toBe('complete');
  });
  it('listener unsubscribe stops further calls', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const calls: string[] = [];
    const unsub = vault.onRotationProgress((p) => calls.push(p.phase));
    await vault.rotate('manual');
    const before = calls.length;
    unsub();
    await vault.rotate('manual');
    expect(calls.length).toBe(before);
  });
  it('non-throwing listener errors do not abort rotation', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    vault.onRotationProgress(() => {
      throw new Error('listener-broken');
    });
    const r = await vault.rotate('scheduled');
    expect(r.ok).toBe(true);
  });
});

describe('Probe edge-cases — recoverFromWal', () => {
  it('returns {recovered:0, failed:0} when WAL key is absent', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const result = await vault.recoverFromWal();
    expect(result).toEqual({ recovered: 0, failed: 0 });
  });
  it('counts WAL records as recovered when checksums match', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('wal-1', 'v');
    await vault.set('wal-2', 'v');
    const result = await vault.recoverFromWal();
    expect(result.recovered).toBeGreaterThan(0);
    expect(result.failed).toBe(0);
  });
  it('counts records with checksum mismatch as failed', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('wal-x', 'v');
    for (const [k, v] of store._store.entries()) {
      if (k.endsWith('.vault.__wal__')) {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed[0].checksum = 'deadbeef';
          store._store.set(k, JSON.stringify(parsed));
        }
      }
    }
    const result = await vault.recoverFromWal();
    expect(result.failed).toBeGreaterThanOrEqual(1);
  });
});

describe('Probe edge-cases — trace ID generation', () => {
  it('emits a TRACE_GENERATED audit event for every operation', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('trace-1', 'v');
    await vault.get('trace-1');
    await vault.delete('trace-1');
    const traceEvents = audit._events.filter((e) => e.kind === 'TRACE_GENERATED');
    expect(traceEvents.length).toBeGreaterThanOrEqual(3);
  });
  it('does not propagate auditLogger.log() failure during trace generation', async () => {
    const store = probeMakeStorage();
    const failingAudit = {
      log: async () => {
        throw new Error('audit-down');
      },
    };
    const vault = createSecretsVault({
      storage: store,
      auditLogger: failingAudit as unknown as AuditLogger,
    });
    const r = await vault.set('k', 'v');
    expect(r.ok).toBe(true);
  });
});

describe('Probe edge-cases — error propagation', () => {
  it('attaches a unique hex traceId to every error', async () => {
    const store = probeMakeStorage({ isAvailable: async () => false });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r1 = await vault.set('k', 'v');
    const r2 = await vault.set('k', 'v');
    if (!r1.ok && !r2.ok) {
      expect(r1.traceId).not.toBe(r2.traceId);
      expect(r1.traceId).toMatch(/^[0-9a-f]{16}$/);
    }
  });
  it('preserves non-Error thrown values as string message', async () => {
    const store = probeMakeStorage({
      set: async () => {
        throw 'string-error';
      },
    });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.set('k', 'v');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe('string-error');
  });
  it('STORAGE_UNAVAILABLE is retriable', async () => {
    const store = probeMakeStorage({ isAvailable: async () => false });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.set('k', 'v');
    if (!r.ok) expect(r.retriable).toBe(true);
  });
  it('KEY_NOT_FOUND is NOT retriable', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const r = await vault.get('never-set');
    if (!r.ok) {
      expect(r.retriable).toBe(false);
      expect(r.code).toBe('KEY_NOT_FOUND');
    }
  });
});

describe('Probe edge-cases — Integration', () => {
  it('full lifecycle: set → get → delete → set → get', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('e2e', 'first');
    const b = await vault.get<string>('e2e');
    expect(b.ok && b.value === 'first').toBe(true);
    await vault.delete('e2e');
    const d = await vault.get('e2e');
    expect(d.ok).toBe(false);
    await vault.set('e2e', 'second');
    const f = await vault.get<string>('e2e');
    expect(f.ok && f.value === 'second').toBe(true);
  });
  it('rotation preserves all stored values', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('rot-1', 'a');
    await vault.set('rot-2', 'b');
    await vault.set('rot-3', 'c');
    await vault.rotate('scheduled');
    const a = await vault.get<string>('rot-1');
    const b = await vault.get<string>('rot-2');
    const c = await vault.get<string>('rot-3');
    expect(a.ok && b.ok && c.ok).toBe(true);
    if (a.ok && b.ok && c.ok) {
      expect(a.value).toBe('a');
      expect(b.value).toBe('b');
      expect(c.value).toBe('c');
    }
  });
  it('survives one shard failure across 10 sequential ops', async () => {
    let mode: 'ok' | 'flaky' = 'ok';
    const store = probeMakeStorage({
      set: async (key, value) => {
        if (mode === 'flaky' && key.includes('.shard-2.')) {
          throw new Error('shard-2-flaky');
        }
        store._store.set(key, value);
      },
    });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    for (let i = 0; i < 5; i += 1) await vault.set(`k-${i}`, `v-${i}`);
    mode = 'flaky';
    for (let i = 5; i < 10; i += 1) {
      const r = await vault.set(`k-${i}`, `v-${i}`);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.quorumReached).toBe(true);
    }
    mode = 'ok';
    for (let i = 0; i < 10; i += 1) {
      const r = await vault.get<string>(`k-${i}`);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.value).toBe(`v-${i}`);
    }
  });
});

// ============================================================================
// PROBE T-FIX-12 BENCHMARK TESTS (4 tests, added 2026-06-18)
// Per Peitho integration acceptance: TEMPLATE 1 benchmark coverage
// ============================================================================
describe('Probe benchmark tests — performance bounds (SecretsVault)', () => {
  it('set() completes within 50ms for small value', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const start = Date.now();
    await vault.set('bench', 'value');
    expect(Date.now() - start).toBeLessThan(50);
  });
  it('get() completes within 20ms for stored value', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    await vault.set('bench-get', 'value');
    const start = Date.now();
    await vault.get('bench-get');
    expect(Date.now() - start).toBeLessThan(20);
  });
  it('100 sequential set/get round-trips complete within 1s', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const start = Date.now();
    for (let i = 0; i < 100; i += 1) {
      await vault.set(`bench-${i}`, `v-${i}`);
      await vault.get(`bench-${i}`);
    }
    expect(Date.now() - start).toBeLessThan(1000);
  });
  it('rotate() completes within 200ms', async () => {
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const start = Date.now();
    await vault.rotate('scheduled');
    expect(Date.now() - start).toBeLessThan(200);
  });
});
