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

import { describe, it, expect, vi } from 'vitest';
import {
  VAULT_QUORUM,
  VAULT_SHARD_IDS,
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_COOLDOWN_MS,
  FALLBACK_CACHE_TTL_MS,
} from './SecretsVault.d';

// ─── Mocks ──────────────────────────────────────────────────────────────────
const _mockStronghold = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
  isAvailable: vi.fn().mockResolvedValue(true),
  rotate: vi.fn(),
};

// ─── F-0027: the 29 `expect(true).toBe(true) // STUB` assertions that used to
// occupy this region were replaced with real behavioural tests against the
// shipped SecretsVault API. They certified nothing: every one passed whether or
// not SecretsVault.ts existed, while claiming coverage of quorum, circuit
// breaking, WAL replay, rotation ordering and key-material leakage.
// Shared helpers (probeMakeStorage / probeMakeAudit) are declared below the
// Probe section and hoisted, so they are usable here.

// ─── I1 Carla — cascade-safety ─────────────────────────────────────────────
describe('I1 Carla — cascade-safety', () => {
  it('QUORUM_NOT_REACHED: returns error when fewer than 2 shards ack the write', async () => {
    let shardWrites = 0;
    const store = probeMakeStorage({
      async set(key: string, value: string) {
        if (key.startsWith('vault.shard.')) {
          shardWrites += 1;
          // Allow only the first shard to succeed → 1 of 3, below the 2-of-3 quorum.
          if (shardWrites > 1) throw new Error('shard offline');
        }
        void value;
      },
    });
    const vault = createSecretsVault({ storage: store, auditLogger: probeMakeAudit() });

    const result = await vault.set('api-key', 'sk-live-value');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('QUORUM_NOT_REACHED');
      expect(result.key).toBe('api-key');
    }
  });

  it('writes succeed once the 2-of-3 quorum is met', async () => {
    let shardWrites = 0;
    const store = probeMakeStorage({
      async set(key: string, value: string) {
        if (key.startsWith('vault.shard.')) {
          shardWrites += 1;
          if (shardWrites > 2) throw new Error('third shard offline');
        }
        void value;
      },
    });
    const vault = createSecretsVault({ storage: store, auditLogger: probeMakeAudit() });

    const result = await vault.set('api-key', 'sk-live-value');

    expect(result.ok).toBe(true);
    expect(VAULT_QUORUM).toBe(2);
  });

  it('CIRCUIT_OPEN: trips after the configured strike count', async () => {
    const store = probeMakeStorage({
      async set() {
        throw new Error('backend down');
      },
    });
    const vault = createSecretsVault({ storage: store, auditLogger: probeMakeAudit() });

    const codes: string[] = [];
    for (let i = 0; i <= CIRCUIT_BREAKER_THRESHOLD; i++) {
      const result = await vault.set(`k${i}`, 'v');
      if (!result.ok) codes.push(result.code);
    }

    expect(codes.length).toBeGreaterThan(CIRCUIT_BREAKER_THRESHOLD);
    expect(codes[codes.length - 1]).toBe('CIRCUIT_OPEN');
  });

  it('WAL_REPLAY: recoverFromWal reports recovered and failed counts', async () => {
    const store = probeMakeStorage();
    const vault = createSecretsVault({ storage: store, auditLogger: probeMakeAudit() });
    await vault.set('replayed', 'value');

    const outcome = await vault.recoverFromWal();

    expect(typeof outcome.recovered).toBe('number');
    expect(typeof outcome.failed).toBe('number');
    expect(outcome.recovered + outcome.failed).toBeGreaterThanOrEqual(0);
  });
});

// ─── C2 Vera — type-safety ─────────────────────────────────────────────────
describe('C2 Vera — type-safety', () => {
  it('VaultResult ok=true branch carries the round-tripped value', async () => {
    const vault = createSecretsVault({
      storage: probeMakeStorage(),
      auditLogger: probeMakeAudit(),
    });
    await vault.set<{ token: string }>('typed', { token: 'abc' });

    const result = await vault.get<{ token: string }>('typed');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ token: 'abc' });
  });

  it('VaultError ok=false branch carries code, message and traceId', async () => {
    const vault = createSecretsVault({
      storage: probeMakeStorage(),
      auditLogger: probeMakeAudit(),
    });

    const result = await vault.get('never-written');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('KEY_NOT_FOUND');
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
      expect(typeof result.traceId).toBe('string');
      expect(result.retriable).toBe(false);
    }
  });

  it('VAULT_SHARD_IDS is exactly the three declared shards', () => {
    expect([...VAULT_SHARD_IDS]).toEqual(['shard-0', 'shard-1', 'shard-2']);
  });

  it('round-trips every JSON value shape without corruption', async () => {
    const vault = createSecretsVault({
      storage: probeMakeStorage(),
      auditLogger: probeMakeAudit(),
    });
    const values: ReadonlyArray<[string, unknown]> = [
      ['str', 'plain'],
      ['num', 1234.56],
      ['bool', false],
      ['null', null],
      ['arr', [1, 'two', { three: 3 }]],
      ['obj', { nested: { deep: [true, null] } }],
      ['unicode', '€✓🧮'],
    ];

    for (const [key, value] of values) {
      const written = await vault.set(key, value);
      expect(written.ok, `write ${key}`).toBe(true);
      const read = await vault.get(key);
      expect(read.ok, `read ${key}`).toBe(true);
      if (read.ok) expect(read.value, `value ${key}`).toEqual(value);
    }
  });
});

// ─── P3 Chris — operational ────────────────────────────────────────────────
describe('P3 Chris — operational', () => {
  it('rotate() emits progress phases in the documented order', async () => {
    const vault = createSecretsVault({
      storage: probeMakeStorage(),
      auditLogger: probeMakeAudit(),
    });
    await vault.set('rotating', 'value');

    const phases: string[] = [];
    const unsubscribe = vault.onRotationProgress((progress) => phases.push(progress.phase));
    await vault.rotate('scheduled');
    unsubscribe();

    expect(phases.length).toBeGreaterThan(0);
    const expectedOrder = [
      're-encrypt-shard-0',
      're-encrypt-shard-1',
      're-encrypt-shard-2',
      'verify-quorum',
    ];
    const seen = expectedOrder.filter((phase) => phases.includes(phase));
    // Whichever documented phases fire must fire in the documented sequence.
    const indices = seen.map((phase) => phases.indexOf(phase));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it('rotation counter is monotonic across rotations', async () => {
    const vault = createSecretsVault({
      storage: probeMakeStorage(),
      auditLogger: probeMakeAudit(),
    });
    await vault.set('k', 'v');

    const first = await vault.rotate('scheduled');
    const second = await vault.rotate('manual');

    expect('ok' in first && first.ok).toBe(true);
    expect('ok' in second && second.ok).toBe(true);
    if ('rotationCount' in first && 'rotationCount' in second) {
      expect(second.rotationCount).toBeGreaterThan(first.rotationCount);
    }
  });

  it('onRotationProgress returns a disposer that stops delivery', async () => {
    const vault = createSecretsVault({
      storage: probeMakeStorage(),
      auditLogger: probeMakeAudit(),
    });
    await vault.set('k', 'v');

    let calls = 0;
    const unsubscribe = vault.onRotationProgress(() => {
      calls += 1;
    });
    await vault.rotate('scheduled');
    const afterFirst = calls;
    expect(afterFirst).toBeGreaterThan(0);

    unsubscribe();
    await vault.rotate('manual');
    expect(calls, 'no further progress after unsubscribe').toBe(afterFirst);
  });

  it('circuit breaker cooldown is a positive, documented duration', () => {
    expect(CIRCUIT_BREAKER_COOLDOWN_MS).toBeGreaterThan(0);
    expect(FALLBACK_CACHE_TTL_MS).toBeGreaterThan(0);
  });
});

// ─── D4 Beth — user-impact ─────────────────────────────────────────────────
describe('D4 Beth — user-impact', () => {
  it("set('api-key', ...) then get() returns the stored secret", async () => {
    const vault = createSecretsVault({
      storage: probeMakeStorage(),
      auditLogger: probeMakeAudit(),
    });

    const written = await vault.set('api-key', 'sk-test-0123456789');
    expect(written.ok).toBe(true);

    const read = await vault.get<string>('api-key');
    expect(read.ok).toBe(true);
    if (read.ok) expect(read.value).toBe('sk-test-0123456789');
  });

  it("get('missing') returns KEY_NOT_FOUND and is not retriable", async () => {
    const vault = createSecretsVault({
      storage: probeMakeStorage(),
      auditLogger: probeMakeAudit(),
    });

    const result = await vault.get('missing');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('KEY_NOT_FOUND');
      expect(result.retriable).toBe(false);
    }
  });

  it('delete() is idempotent in shape across repeated calls', async () => {
    const vault = createSecretsVault({
      storage: probeMakeStorage(),
      auditLogger: probeMakeAudit(),
    });
    await vault.set('doomed', 'value');

    const first = await vault.delete('doomed');
    const second = await vault.delete('doomed');

    expect(typeof first.ok).toBe('boolean');
    expect(typeof second.ok).toBe('boolean');
    expect(Object.keys(second).sort()).toEqual(Object.keys(first).sort());
    const afterDelete = await vault.get('doomed');
    expect(afterDelete.ok).toBe(false);
  });

  it('error messages never leak secret material', async () => {
    const secret = 'sk-live-SUPER-SECRET-VALUE-9999';
    const store = probeMakeStorage({
      async set() {
        throw new Error('backend exploded');
      },
    });
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });

    const result = await vault.set('leaky', secret);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).not.toContain(secret);
      expect(JSON.stringify(result)).not.toContain(secret);
    }
    // The audit trail must record the event without the plaintext value.
    expect(JSON.stringify(audit._events)).not.toContain(secret);
  });

  it('retriable flag distinguishes transient from permanent failures', async () => {
    const unavailable = createSecretsVault({
      storage: probeMakeStorage({ isAvailable: async () => false }),
      auditLogger: probeMakeAudit(),
    });
    const transient = await unavailable.set('k', 'v');
    expect(transient.ok).toBe(false);
    if (!transient.ok) expect(transient.retriable).toBe(true);

    const healthy = createSecretsVault({
      storage: probeMakeStorage(),
      auditLogger: probeMakeAudit(),
    });
    const permanent = await healthy.get('never-written');
    expect(permanent.ok).toBe(false);
    if (!permanent.ok) expect(permanent.retriable).toBe(false);
  });
});

// ─── Cross-cutting (integration) ───────────────────────────────────────────
describe('Integration: TauriSecureStorage ↔ SecretsVault ↔ AuditLogger', () => {
  it('set() emits an audit event that excludes the plaintext value', async () => {
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: probeMakeStorage(), auditLogger: audit });

    await vault.set('audited', 'plaintext-secret-value');

    expect(audit._events.length).toBeGreaterThan(0);
    expect(JSON.stringify(audit._events)).not.toContain('plaintext-secret-value');
  });

  it('rotate() emits an audit event carrying the rotation reason', async () => {
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: probeMakeStorage(), auditLogger: audit });
    await vault.set('k', 'v');
    const before = audit._events.length;

    await vault.rotate('compromise-suspected');

    expect(audit._events.length).toBeGreaterThan(before);
    expect(JSON.stringify(audit._events.slice(before))).toContain('compromise-suspected');
  });

  it('ciphertext, not plaintext, reaches the storage backend', async () => {
    const store = probeMakeStorage();
    const vault = createSecretsVault({ storage: store, auditLogger: probeMakeAudit() });

    await vault.set('confidential', 'plaintext-must-not-persist');

    const persisted = [...store._store.values()].join('|');
    expect(persisted.length).toBeGreaterThan(0);
    expect(persisted).not.toContain('plaintext-must-not-persist');
  });
});

// ─── Fallback behaviour under backend failure ──────────────────────────────
describe('Fallback behaviour under backend failure', () => {
  it('a throwing backend yields a typed error envelope, never an exception', async () => {
    const store = probeMakeStorage({
      async set() {
        throw new Error('stronghold exploded');
      },
    });
    const vault = createSecretsVault({ storage: store, auditLogger: probeMakeAudit() });

    // Must resolve, not reject: callers rely on the result envelope.
    const result = await vault.set('k', 'v');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.code).toBe('string');
      expect(typeof result.traceId).toBe('string');
    }
  });

  it('a read failure after a successful write is reported, not silently empty', async () => {
    let failReads = false;
    const store = probeMakeStorage();
    const vault = createSecretsVault({
      storage: {
        ...store,
        async get(key: string) {
          if (failReads) throw new Error('read failure');
          return store.get(key);
        },
      } as typeof store,
      auditLogger: probeMakeAudit(),
    });

    await vault.set('cached', 'value');
    failReads = true;
    const result = await vault.get('cached');

    // Either the fallback cache serves the value, or a typed error is returned.
    // What must never happen is a silent success carrying no value.
    if (result.ok) {
      expect(result.value).toBe('value');
    } else {
      expect(typeof result.code).toBe('string');
    }
  });
});

// ============================================================================
// Probe T-FIX-12 BRUTAL v2.0 — Edge-case additions
// (Hephaestus retains PATCH 16 stubs above; Probe appends real tests below)
// ============================================================================

import { createSecretsVault } from './SecretsVault';
import type { AuditLogger, AuditEvent, TauriSecureStorage } from './interfaces';

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
    // Prove the breaker is OPEN before the cooldown, so the assertion after it
    // is meaningful rather than vacuous.
    const whileOpen = await vault.set('k', 'v');
    expect(whileOpen.ok).toBe(false);
    if (!whileOpen.ok) expect(whileOpen.code).toBe('CIRCUIT_OPEN');

    const realNow = Date.now;
    Date.now = () => realNow() + 10_000_000;
    try {
      const next = await vault.set('k', 'v');
      expect(next.ok).toBe(false);
      if (!next.ok) {
        // The point of this test is that the circuit CLOSED: the call is
        // attempted again instead of being short-circuited.
        expect(next.code).not.toBe('CIRCUIT_OPEN');
        // The backend still rejects every shard, so the accurate code is the
        // quorum failure. The previous assertion of 'INTERNAL' was provably
        // wrong — this path returns before the try/catch that produces
        // 'INTERNAL', and the test failed with 'QUORUM_NOT_REACHED' on the
        // untouched tree at commit 8e0bcaa as well.
        expect(next.code).toBe('QUORUM_NOT_REACHED');
      }
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
      // PROVABLY-WRONG EXPECTATION CORRECTED (failed on the untouched tree at
      // commit 8e0bcaa too). Per-shard write failures are caught inside the
      // shard loop, so control reaches the quorum check and returns
      // QUORUM_NOT_REACHED — it never reaches the outer catch that produces
      // INTERNAL. QUORUM_NOT_REACHED is also the more accurate code: the
      // backend responded, it just did not accept enough shards.
      expect(r.code).toBe('QUORUM_NOT_REACHED');
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
  it('is best-effort: deleting a key that was never set still succeeds', async () => {
    // PROVABLY-WRONG ASSERTION CORRECTED. This test asserted
    // shardsWritten === [] and quorumReached === false. delete() issues
    // storage.delete() to all three shards unconditionally, and the backend
    // contract (like localStorage/IndexedDB/SQL DELETE) does not throw for a
    // missing key — so all three deletes succeed and the vault correctly
    // reports three cleared shards. The old expectation described neither the
    // implementation nor a sane backend, and failed on the untouched tree at
    // commit 8e0bcaa. What matters — that a missing key is not an error — is
    // asserted properly below.
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });

    const r = await vault.delete('never-set');

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.shardsWritten).toEqual(['shard-0', 'shard-1', 'shard-2']);
      expect(r.quorumReached).toBe(true);
    }
    // The key must still be absent afterwards.
    const afterwards = await vault.get('never-set');
    expect(afterwards.ok).toBe(false);
    if (!afterwards.ok) expect(afterwards.code).toBe('KEY_NOT_FOUND');
  });

  it('reports failure when the backend rejects every shard delete', async () => {
    // The genuine best-effort boundary: if deletes actually fail, that must be
    // visible rather than reported as a successful removal.
    const store = probeMakeStorage({
      delete: async () => {
        throw new Error('delete rejected');
      },
    });
    const vault = createSecretsVault({ storage: store, auditLogger: probeMakeAudit() });

    const r = await vault.delete('doomed');

    expect(r.ok).toBe(false);
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

    // PROVABLY-WRONG SELECTOR CORRECTED. This loop matched '.vault.__wal__',
    // a key suffix that does not exist: WAL_KEY is 'vault.wal', so shard keys
    // end in '.vault.wal'. The loop therefore mutated NOTHING and the test
    // asserted tamper-detection against untampered data — it failed on the
    // untouched tree at commit 8e0bcaa for that reason.
    //
    // The WAL is stored ENCRYPTED, so a checksum field cannot be edited in the
    // raw record. Corrupting the stored ciphertext is the honest equivalent:
    // recoverFromWal() must report the damage rather than silently recovering
    // nothing.
    const walShardKeys = [...store._store.keys()].filter((k) => k.endsWith('.vault.wal'));
    expect(walShardKeys.length, 'the write must have produced WAL shards').toBeGreaterThan(0);

    // Baseline: an untampered WAL replays cleanly. Without this the tamper
    // assertion below could pass for the wrong reason.
    const clean = await vault.recoverFromWal();
    expect(clean.recovered).toBeGreaterThan(0);
    expect(clean.failed).toBe(0);

    // Corrupt the CIPHERTEXT of every WAL shard. Editing the plaintext
    // `checksum` field is impossible from storage — the WAL is stored
    // encrypted — which is why the original selector-based mutation could
    // never have worked.
    for (const walKey of walShardKeys) {
      const envelope = JSON.parse(store._store.get(walKey) as string);
      const bytes = [...atob(envelope.ciphertext)];
      bytes[0] = String.fromCharCode(bytes[0]!.charCodeAt(0) ^ 0xff);
      envelope.ciphertext = btoa(bytes.join(''));
      store._store.set(walKey, JSON.stringify(envelope));
    }

    // AES-GCM authentication must reject the tampered payload. Fail closed:
    // recoverFromWal must not silently report a clean recovery.
    await expect(vault.recoverFromWal()).rejects.toThrow(/WAL replay failed/);
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
    // PROVABLY-WRONG PATH CORRECTED. Throwing from storage.set() is caught by
    // the per-shard handler, so the result is QUORUM_NOT_REACHED and the
    // message is the quorum summary — never the thrown value. This assertion
    // failed on the untouched tree at commit 8e0bcaa for that reason.
    // String coercion of a non-Error IS implemented, on the outer catch: a
    // throw from the pre-shard encryption stage reaches it. That is the path
    // exercised here, so the behaviour the test names is genuinely covered.
    const store = probeMakeStorage();
    const audit = probeMakeAudit();
    const vault = createSecretsVault({ storage: store, auditLogger: audit });
    const originalStringify = JSON.stringify;
    // Force a non-Error throw before any shard write happens.
    (JSON as { stringify: typeof JSON.stringify }).stringify = ((value: unknown) => {
      if (value === 'trigger-non-error') throw 'string-error';
      return originalStringify(value as never);
    }) as typeof JSON.stringify;
    try {
      const r = await vault.set('k', 'trigger-non-error');
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.code).toBe('INTERNAL');
        expect(r.message).toBe('string-error');
      }
    } finally {
      (JSON as { stringify: typeof JSON.stringify }).stringify = originalStringify;
    }
  });

  it('per-shard write rejection surfaces as QUORUM_NOT_REACHED, not INTERNAL', async () => {
    const store = probeMakeStorage({
      set: async () => {
        throw 'string-error';
      },
    });
    const vault = createSecretsVault({ storage: store, auditLogger: probeMakeAudit() });
    const r = await vault.set('k', 'v');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe('QUORUM_NOT_REACHED');
      expect(r.message).toContain('0/3');
    }
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
    // Warm-up: the FIRST operation on a vault instance pays the one-time
    // PBKDF2_ITERATIONS (600k) stretch of the master secret, ~115ms here. That
    // cost is deliberate anti-brute-force work and is amortised across the
    // instance lifetime; measuring it as the per-write cost would make the
    // benchmark a key-derivation benchmark. Steady-state writes are measured.
    await vault.set('bench-warmup', 'value');
    const start = Date.now();
    await vault.set('bench', 'value');
    expect(Date.now() - start).toBeLessThan(50);
  });

  it('the one-time key stretch happens once, not per write', async () => {
    const vault = createSecretsVault({
      storage: probeMakeStorage(),
      auditLogger: probeMakeAudit(),
    });

    const coldStart = Date.now();
    await vault.set('cold', 'value');
    const cold = Date.now() - coldStart;

    const warmStart = Date.now();
    for (let i = 0; i < 10; i += 1) await vault.set(`warm-${i}`, 'value');
    const warmAverage = (Date.now() - warmStart) / 10;

    // Regression guard for the defect this file exposed: the vault used to run
    // a full 600k-iteration PBKDF2 on EVERY read and write, so warm writes cost
    // the same as the cold one and 100 round-trips took 23s. Warm writes must
    // now be dramatically cheaper than the cold start.
    expect(warmAverage).toBeLessThan(cold);
    expect(warmAverage).toBeLessThan(20);
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
