/**
 * @vitest-environment jsdom
 *
 * Q5 / DEC-051 stage 2 — the REAL persisted GL ledger through the REAL storage
 * stack (chunked wrapper → SQL.js image in localStorage → AES-GCM → `$d:` money
 * encoding), not a hand-rolled object in memory.
 *
 * Stage 1 proved the encoder in isolation. This file answers the questions that
 * decide whether stage 4 (`GLEntry.debit/credit/netChange/amount` → `Money`) is
 * a type change or a data migration:
 *
 *   1. AT REST — the shipped `setEntries` path writes canonical `$d:` strings
 *      for every money field of the 41-row synthetic tie-out ledger, and the
 *      plaintext contains no numeric money value (INV-009).
 *   2. BYTE IDENTITY — persisting the same ledger with money fields as `Money`
 *      objects produces the SAME plaintext bytes as persisting it with
 *      `number` fields. So stage 4 does not rewrite anything on disk.
 *   3. RELOAD — a fresh module graph (a real restart) rehydrates the entries
 *      exactly, and the trial balance regenerates from them.
 *   4. OLD BACKUPS — an envelope written the pre-Q5 way (raw JSON numbers, no
 *      tags) still hydrates. Rollback is therefore a revert, not a conversion.
 *   5. EXACTNESS — decoding the persisted ledger `as: 'money'` yields integer
 *      minor units for every field, and debits equal credits in minor units.
 *
 * The sub-cent case at the end is a FINDING, not a feature: DEC-048 permits a
 * ledger to already contain sub-cent rows (stored raw, `isValid: true`), and
 * `as: 'money'` cannot represent them. That is a gate on stage 4, recorded here
 * so the switch to money-typed hydration cannot be made silently.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSyntheticTieOutLedger } from '@/test/fixtures/syntheticTieOutLedger';
import { asMoney, InvalidMoneyError, moneyToMinor } from '@/utils/money';
import { decodeMoneyGraph, jsonContainsNumericMoney } from '@/utils/moneySerialize';
import type { GLEntry } from '@/types';
import type { SqlJsStatic } from 'sql.js';

// The browser backend: masterStorage then routes through sqlJsStorage (a real
// SQL.js image in localStorage) instead of the Tauri SQL plugin.
vi.mock('@/utils/tauriSqlStorage', () => ({
  tauriSqlStorage: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
  isTauri: async () => false,
}));

const GL_STORE_KEY = 'gl-store';
const SQLJS_DATABASE_KEY = 'finplan-sqljs-db';
const FIXED_INSTANT = '2026-10-21T09:30:00.000Z';
const STORAGE_KEY = 'gl-money-persist-test-key';

interface PersistedEnvelope {
  state: { entries: GLEntry[] };
  version: number;
}

const MONEY_FIELDS = ['debit', 'credit', 'netChange', 'amount'] as const;

// ---------------------------------------------------------------------------
// Independent cipher implementation.
//
// masterStorage's encrypt/decrypt are module-private, and a test that only
// reads back through masterStorage could not see the BYTES — which is the whole
// point. Mirroring SHA-256(key) → AES-GCM with a 12-byte IV prefix lets this
// file assert on the plaintext that actually sits on disk.
// ---------------------------------------------------------------------------

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(): Promise<CryptoKey> {
  const material = new TextEncoder().encode(STORAGE_KEY);
  const hash = await crypto.subtle.digest('SHA-256', material as BufferSource);
  return crypto.subtle.importKey('raw', hash.slice(0, 32), { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

async function encryptAsBuildWould(plaintext: string): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bytesToBase64(combined);
}

async function decryptAtRest(encrypted: string): Promise<string> {
  const key = await deriveKey();
  const bytes = base64ToBytes(encrypted);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.slice(0, 12) },
    key,
    bytes.slice(12)
  );
  return new TextDecoder().decode(plaintext);
}

function readStoredCiphertext(sql: SqlJsStatic, storeKey: string): string {
  const encoded = localStorage.getItem(SQLJS_DATABASE_KEY);
  expect(encoded).toBeTruthy();
  const db = new sql.Database(base64ToBytes(encoded ?? ''));
  try {
    const read = (key: string): unknown => {
      const rows = db.exec('SELECT value FROM stores WHERE id = ?', [key]);
      const stored = rows[0]?.values[0]?.[0];
      if (stored === undefined) return undefined;
      // The column holds JSON text: chunked storage hands the backend an
      // already-stringified payload, so the ciphertext sits inside quotes.
      const text = String(stored);
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return text;
      }
    };

    const meta = read(storeKey);
    // Chunked storage writes a small payload as one record and a large one as
    // metadata plus `:chunk:n` slices. Both real shapes are handled so a future
    // 41→large ledger swap does not turn this test into a mystery failure.
    if (meta && typeof meta === 'object' && (meta as { _isChunked?: boolean })._isChunked) {
      const chunkCount = (meta as { chunkCount: number }).chunkCount;
      const chunks: string[] = [];
      for (let index = 0; index < chunkCount; index++) {
        const record = read(`${storeKey}:chunk:${index}`) as { value?: string } | undefined;
        expect(record?.value).toBeTypeOf('string');
        chunks.push(String(record?.value));
      }
      return chunks.join('');
    }
    expect(meta).toBeTypeOf('string');
    return String(meta);
  } finally {
    db.close();
  }
}

async function readAtRest(sql: SqlJsStatic, storeKey: string): Promise<string> {
  return decryptAtRest(readStoredCiphertext(sql, storeKey));
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let priorMasterStorageKey: string | undefined;

beforeEach(() => {
  priorMasterStorageKey = process.env.MASTER_STORAGE_KEY;
  process.env.MASTER_STORAGE_KEY = STORAGE_KEY;
  localStorage.clear();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  if (priorMasterStorageKey === undefined) delete process.env.MASTER_STORAGE_KEY;
  else process.env.MASTER_STORAGE_KEY = priorMasterStorageKey;
  localStorage.clear();
  vi.doUnmock('sql.js');
  vi.resetModules();
});

async function loadSqlJs(): Promise<SqlJsStatic> {
  const actualSqlJs = await vi.importActual<typeof import('sql.js')>('sql.js');
  return actualSqlJs.default({
    wasmBinary: readFileSync(resolve('node_modules/sql.js/dist/sql-wasm.wasm')),
  });
}

function bootstrapSqlJs(sql: SqlJsStatic): void {
  const loadInitializedSqlJs = async () => sql;
  vi.doMock('sql.js', () => ({ default: loadInitializedSqlJs }));
}

function authenticateAdmin(useAuthStore: {
  setState: (state: Record<string, unknown>) => void;
}): void {
  useAuthStore.setState({
    user: {
      id: 'gl-money-persist-user',
      email: 'gl-money-persist@finplan.local',
      firstName: 'GL',
      lastName: 'Persist',
      avatarUrl: null,
      role: 'Admin',
      departmentId: 'finance',
      departmentName: 'Finance',
      entityId: 'entity-001',
      status: 'Active',
      lastLoginAt: FIXED_INSTANT,
      mfaEnabled: false,
      permissions: ['import:create', 'import:read', 'import:update', 'import:delete', 'ui:update'],
    },
    isAuthenticated: true,
  });
}

/** Resolve once every persistence write triggered by `action` has settled. */
async function withPersistenceSettled<T>(
  masterStorage: { setItem: (name: string, value: unknown) => Promise<void> },
  action: () => T
): Promise<T> {
  const originalSetItem = masterStorage.setItem.bind(masterStorage);
  const writes: Promise<void>[] = [];
  const spy = vi
    .spyOn(masterStorage, 'setItem')
    .mockImplementation((name: string, value: unknown) => {
      const write = originalSetItem(name, value);
      writes.push(write);
      return write;
    });
  try {
    const result = action();
    await Promise.all(writes);
    // A persist write can enqueue a follow-up flush; let the microtask queue
    // drain so the assertion reads the final image, not an intermediate one.
    await Promise.all(writes);
    return result;
  } finally {
    spy.mockRestore();
  }
}

describe('glStore money persistence (Q5 stage 2, DEC-051)', () => {
  it('writes the real 41-row ledger to disk as canonical $d: money, never as numbers (INV-009)', async () => {
    const sql = await loadSqlJs();
    bootstrapSqlJs(sql);
    const [{ useGLStore }, { useAuthStore }, { masterStorage }, { setClock }] = await Promise.all([
      import('./glStore'),
      import('./authStore'),
      import('@/utils/masterStorage'),
      import('@/utils/clock'),
    ]);
    setClock(FIXED_INSTANT);
    authenticateAdmin(useAuthStore);
    await useGLStore.persist.rehydrate();

    const ledger = createSyntheticTieOutLedger();
    expect(ledger.entries).toHaveLength(41);
    await withPersistenceSettled(masterStorage, () =>
      useGLStore.getState().setEntries(ledger.entries)
    );

    const plaintext = await readAtRest(sql, GL_STORE_KEY);
    const persisted = JSON.parse(plaintext) as PersistedEnvelope;

    // INV-009 through the production write path: no money field survives as a
    // JSON number anywhere in the encrypted-at-rest plaintext.
    expect(jsonContainsNumericMoney(plaintext)).toBe(false);

    expect(persisted.state.entries).toHaveLength(41);
    for (const [index, entry] of persisted.state.entries.entries()) {
      expect(entry.accountCode).toBe(ledger.entries[index]!.accountCode);
      for (const field of MONEY_FIELDS) {
        // Independent expectation: the fixture amounts are exact cents, so the
        // canonical form is their plain decimal spelling.
        const expected = String(ledger.entries[index]![field]);
        expect(entry[field]).toBe(`$d:${expected}` as unknown as number);
      }
    }
    // Spot-check the exact on-disk bytes of a known row rather than only
    // trusting the loop above.
    expect(plaintext).toContain('"debit":"$d:500000"');
    expect(plaintext).toContain('"netChange":"$d:-500000"');
  }, 60_000);

  it('persists identical bytes when the ledger carries Money objects instead of numbers', async () => {
    const sql = await loadSqlJs();
    bootstrapSqlJs(sql);
    const [{ masterStorage }] = await Promise.all([import('@/utils/masterStorage')]);

    const ledger = createSyntheticTieOutLedger();
    const numericEnvelope: PersistedEnvelope = {
      state: { entries: ledger.entries },
      version: 1,
    };
    const moneyEnvelope = {
      state: {
        entries: ledger.entries.map((entry) => ({
          ...entry,
          debit: asMoney(entry.debit, entry.currency),
          credit: asMoney(entry.credit, entry.currency),
          netChange: asMoney(entry.netChange, entry.currency),
          amount: asMoney(entry.amount, entry.currency),
        })),
      },
      version: 1,
    };

    await masterStorage.setItem('money-bytes-numeric', numericEnvelope);
    await masterStorage.setItem('money-bytes-money', moneyEnvelope);

    const numericPlaintext = await readAtRest(sql, 'money-bytes-numeric');
    const moneyPlaintext = await readAtRest(sql, 'money-bytes-money');

    // THE stage-4 claim, measured through encryption, chunking and SQL.js:
    // adopting the Money type rewrites nothing at rest.
    expect(moneyPlaintext).toBe(numericPlaintext);
    expect(moneyPlaintext).toContain('"debit":"$d:500000"');
    expect(moneyPlaintext).not.toContain('"minor"');
  }, 60_000);

  it('rehydrates every entry exactly after a real restart (fresh module graph)', async () => {
    const sql = await loadSqlJs();
    bootstrapSqlJs(sql);
    const [{ useGLStore }, { useAuthStore }, { masterStorage }, { setClock }] = await Promise.all([
      import('./glStore'),
      import('./authStore'),
      import('@/utils/masterStorage'),
      import('@/utils/clock'),
    ]);
    setClock(FIXED_INSTANT);
    authenticateAdmin(useAuthStore);
    await useGLStore.persist.rehydrate();

    const ledger = createSyntheticTieOutLedger();
    await withPersistenceSettled(masterStorage, () =>
      useGLStore.getState().setEntries(ledger.entries)
    );
    const inMemory = useGLStore.getState().entries.map((entry) => ({ ...entry }));
    expect(inMemory).toHaveLength(41);

    // Restart: nothing is carried over except the SQL.js image in localStorage.
    vi.resetModules();
    bootstrapSqlJs(sql);
    const [restarted, restartedAuth, clock] = await Promise.all([
      import('./glStore'),
      import('./authStore'),
      import('@/utils/clock'),
    ]);
    clock.setClock(FIXED_INSTANT);
    authenticateAdmin(restartedAuth.useAuthStore);
    await restarted.useGLStore.persist.rehydrate();

    const rehydrated = restarted.useGLStore.getState().entries;
    expect(rehydrated).toHaveLength(41);
    // Exact equality, not "approximately equal": money is cents at rest.
    expect(rehydrated).toEqual(inMemory);

    // Derived state is NOT persisted (`partialize` omits `trialBalance`); it is
    // recomputed from the restored entries and ties out.
    expect(restarted.useGLStore.getState().trialBalance).toHaveLength(0);
    restarted.useGLStore.getState().generateTrialBalance();
    const trialBalance = restarted.useGLStore.getState().trialBalance;
    expect(trialBalance.length).toBeGreaterThan(0);

    const totals = trialBalance.reduce(
      (acc, row) => ({ debit: acc.debit + row.debit, credit: acc.credit + row.credit }),
      { debit: 0, credit: 0 }
    );
    expect(totals.debit).toBeCloseTo(totals.credit, 10);
    expect(totals.debit).toBeGreaterThan(0);
  }, 90_000);

  it('still opens a pre-Q5 backup whose money fields are raw JSON numbers', async () => {
    const sql = await loadSqlJs();
    bootstrapSqlJs(sql);
    const { sqlJsStorage } = await import('@/utils/sqlJsStorage');

    // Exactly what a build before stage 1 wrote: canonical JSON, no `$d:` tags.
    const ledger = createSyntheticTieOutLedger();
    const legacyEnvelope = JSON.stringify({
      state: { entries: ledger.entries },
      version: 1,
    } satisfies PersistedEnvelope);
    expect(legacyEnvelope).toContain('"debit":500000');
    expect(legacyEnvelope).not.toContain('$d:');

    // The column holds JSON text (chunked storage pre-stringifies the payload),
    // so emulate a build's record shape exactly rather than storing raw base64.
    await sqlJsStorage.setItem(
      GL_STORE_KEY,
      JSON.stringify(await encryptAsBuildWould(legacyEnvelope))
    );

    vi.resetModules();
    bootstrapSqlJs(sql);
    const [restarted, restartedAuth, clock] = await Promise.all([
      import('./glStore'),
      import('./authStore'),
      import('@/utils/clock'),
    ]);
    clock.setClock(FIXED_INSTANT);
    authenticateAdmin(restartedAuth.useAuthStore);
    await restarted.useGLStore.persist.rehydrate();

    const rehydrated = restarted.useGLStore.getState().entries;
    expect(rehydrated).toHaveLength(41);
    expect(rehydrated).toEqual(ledger.entries);
    expect(rehydrated[0]?.debit).toBe(500000);
    expect(rehydrated[1]?.netChange).toBe(-500000);
  }, 90_000);

  it('decodes the persisted ledger into exact integer minor units that balance', async () => {
    const sql = await loadSqlJs();
    bootstrapSqlJs(sql);
    const [{ useGLStore }, { useAuthStore }, { masterStorage }, { setClock }] = await Promise.all([
      import('./glStore'),
      import('./authStore'),
      import('@/utils/masterStorage'),
      import('@/utils/clock'),
    ]);
    setClock(FIXED_INSTANT);
    authenticateAdmin(useAuthStore);
    await useGLStore.persist.rehydrate();

    const ledger = createSyntheticTieOutLedger();
    await withPersistenceSettled(masterStorage, () =>
      useGLStore.getState().setEntries(ledger.entries)
    );
    const persisted = JSON.parse(await readAtRest(sql, GL_STORE_KEY)) as PersistedEnvelope;

    const decoded = decodeMoneyGraph(persisted, { as: 'money' }) as {
      state: { entries: Record<(typeof MONEY_FIELDS)[number], { minor: number }>[] };
    };

    let debitMinor = 0;
    let creditMinor = 0;
    for (const [index, entry] of decoded.state.entries.entries()) {
      for (const field of MONEY_FIELDS) {
        const minor = moneyToMinor(entry[field]);
        expect(Number.isSafeInteger(minor)).toBe(true);
        // The cents are exact: no epsilon, no rounding.
        expect(minor).toBe(Math.round(ledger.entries[index]![field] * 100));
      }
      debitMinor += moneyToMinor(entry.debit);
      creditMinor += moneyToMinor(entry.credit);
    }
    // The tie-out fixture is balanced, and it balances in integer cents.
    expect(debitMinor).toBe(creditMinor);
    expect(debitMinor).toBeGreaterThan(0);
  }, 60_000);

  it('GATE: a sub-cent row on disk (legal per DEC-048) cannot be decoded `as: money`', async () => {
    const sql = await loadSqlJs();
    bootstrapSqlJs(sql);
    const { sqlJsStorage } = await import('@/utils/sqlJsStorage');

    // DEC-048 records that `{ debit: 0.004, credit: 0 }` is already storable and
    // reports `isValid: true`. Any build since W0.8.2 tagged it at rest, so this
    // is the shape genuinely sitting on a user's disk today.
    const subCent = {
      ...createSyntheticTieOutLedger().entries[0]!,
      id: 'legacy-sub-cent',
      debit: 0.004,
      credit: 0,
      netChange: 0,
      amount: 0.004,
    };
    const taggedEnvelope = JSON.stringify({
      state: { entries: [{ ...subCent, debit: '$d:0.004', amount: '$d:0.004' }] },
      version: 1,
    });
    await sqlJsStorage.setItem(
      GL_STORE_KEY,
      JSON.stringify(await encryptAsBuildWould(taggedEnvelope))
    );
    const persisted = JSON.parse(await readAtRest(sql, GL_STORE_KEY)) as unknown;

    // Hydrating as numbers (today's default) keeps the row — money preserved,
    // not rounded, which is the DEC-048 behaviour.
    const asNumbers = decodeMoneyGraph(persisted) as { state: { entries: GLEntry[] } };
    expect(asNumbers.state.entries[0]?.debit).toBe(0.004);

    // Decoding as money REFUSES. That is correct — it will not round money
    // away — and it is exactly why glStore cannot switch to `as: 'money'` in
    // stage 4 until sub-cent rows are either barred outright or represented.
    expect(() => decodeMoneyGraph(persisted, { as: 'money' })).toThrow(InvalidMoneyError);
    expect(() => asMoney(0.004)).toThrow(InvalidMoneyError);
  }, 60_000);
});
