// FinPlan Pro v1.0.0 — Phase 7 PATCH 15 tests
//
// Tests for TauriSecureStorage. Mocks the Tauri invoke call to verify
// behavior without a real Tauri runtime.
//
// Coverage:
//   1. Constants
//   2. validateAccount()
//   3. TauriSecureStorage init
//   4. unlock() / lock() / isUnlocked()
//   5. unlock() failure → lockout
//   6. store() happy path
//   7. store() rejects when locked
//   8. store() rejects invalid account
//   9. store() rejects too-large secret
//  10. store() rejects quota exceeded
//  11. retrieve() happy path
//  12. retrieve() not-found
//  13. retrieve() rejects when locked
//  14. delete() happy path (idempotent)
//  15. exists() happy path
//  16. listAccounts() filters reserved
//  17. audit event shape
//  18. Cross-service — store session, retrieve, verify

import { describe, test, expect, beforeEach, afterAll } from 'vitest';
import {
  TauriSecureStorage,
  TAURI_SECURE_STORAGE_CONSTANTS,
  validateAccount,
  createTauriSecureStorage,
  type TauriInvoke,
} from './TauriSecureStorage';

class MockTauri {
  private store = new Map<string, string>();
  private lockoutCount = 0;

  invoke = async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
    if (cmd === 'plugin:stronghold|unlock') {
      const pw = args?.password as string;
      if (pw === 'wrong') {
        throw new Error('invalid-password');
      }
      return null as unknown as T;
    }
    if (cmd === 'plugin:stronghold|lock') {
      return null as unknown as T;
    }
    if (cmd === 'plugin:stronghold|store') {
      const key = `${args?.service}:${args?.account}`;
      this.store.set(key, args?.secret as string);
      return null as unknown as T;
    }
    if (cmd === 'plugin:stronghold|retrieve') {
      const key = `${args?.service}:${args?.account}`;
      const v = this.store.get(key);
      if (!v) {
        const e: Error & { code?: string } = new Error('not-found');
        e.code = 'NOT_FOUND';
        throw e;
      }
      return v as unknown as T;
    }
    if (cmd === 'plugin:stronghold|delete') {
      const key = `${args?.service}:${args?.account}`;
      if (!this.store.has(key)) {
        const e: Error & { code?: string } = new Error('not-found');
        e.code = 'NOT_FOUND';
        throw e;
      }
      this.store.delete(key);
      return null as unknown as T;
    }
    if (cmd === 'plugin:stronghold|exists') {
      const key = `${args?.service}:${args?.account}`;
      return (this.store.has(key)) as unknown as T;
    }
    if (cmd === 'plugin:stronghold|list') {
      return Array.from(this.store.keys()).map(k => k.split(':')[1]) as unknown as T;
    }
    throw new Error(`Mock: unknown command ${cmd}`);
  };

  __seed = (account: string, secret: string, service = TAURI_SECURE_STORAGE_CONSTANTS.SERVICE_NAME): void => {
    this.store.set(`${service}:${account}`, secret);
  };
}

let mockTime = 1_700_000_000_000;
const advance = (ms: number) => {
  mockTime += ms;
};
const now = () => mockTime;
const clock = now;

let mockTauri: MockTauri;
let storage: TauriSecureStorage;

beforeEach(async () => {
  mockTime = 1_700_000_000_000;
  mockTauri = new MockTauri();
  storage = createTauriSecureStorage(mockTauri as unknown as TauriInvoke, clock);
  await storage.initialize();
  await storage.unlock('correct-password');
});

afterAll(() => {
  storage.reset();
});

// ---------------------------------------------------------------------------
// 1. Constants
// ---------------------------------------------------------------------------

describe('1. TauriSecureStorage constants', () => {
  test('1.1 schema version 1', () => {
    expect(TAURI_SECURE_STORAGE_CONSTANTS.SCHEMA_VERSION).toBe(1);
  });
  test('1.2 service name', () => {
    expect(TAURI_SECURE_STORAGE_CONSTANTS.SERVICE_NAME).toBe('finplan-pro-v1');
  });
  test('1.3 max secret 1MB', () => {
    expect(TAURI_SECURE_STORAGE_CONSTANTS.MAX_SECRET_BYTES).toBe(1_048_576);
  });
  test('1.4 max accounts 1000', () => {
    expect(TAURI_SECURE_STORAGE_CONSTANTS.MAX_ACCOUNTS).toBe(1_000);
  });
  test('1.5 has reserved accounts', () => {
    expect(TAURI_SECURE_STORAGE_CONSTANTS.RESERVED_ACCOUNTS.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 2. validateAccount
// ---------------------------------------------------------------------------

describe('2. validateAccount', () => {
  test('2.1 valid account passes', () => {
    expect(validateAccount('session.abc123').ok).toBe(true);
    expect(validateAccount('csrf-token-1').ok).toBe(true);
    expect(validateAccount('user_token_v2').ok).toBe(true);
  });
  test('2.2 empty account fails', () => {
    expect(validateAccount('').ok).toBe(false);
  });
  test('2.3 too long account fails', () => {
    expect(validateAccount('a'.repeat(257)).ok).toBe(false);
  });
  test('2.4 control characters fail', () => {
    expect(validateAccount('abc\x00def').ok).toBe(false);
    expect(validateAccount('abc\ndef').ok).toBe(false);
  });
  test('2.5 reserved account fails', () => {
    expect(validateAccount('__lockout__').ok).toBe(false);
    expect(validateAccount('__attempts__').ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. TauriSecureStorage init
// ---------------------------------------------------------------------------

describe('3. TauriSecureStorage init', () => {
  test('3.1 starts locked', () => {
    const fresh = createTauriSecureStorage(new MockTauri() as unknown as TauriInvoke, clock);
    expect(fresh.isUnlocked()).toBe(false);
  });
  test('3.2 initialize marks as initialized', () => {
    const fresh = createTauriSecureStorage(new MockTauri() as unknown as TauriInvoke, clock);
    expect(fresh.isInitialized()).toBe(false);
    fresh.initialize();
    expect(fresh.isInitialized()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. unlock() / lock() / isUnlocked()
// ---------------------------------------------------------------------------

describe('4. unlock / lock', () => {
  test('4.1 unlock sets isUnlocked true', async () => {
    const fresh = createTauriSecureStorage(new MockTauri() as unknown as TauriInvoke, clock);
    await fresh.initialize();
    const r = await fresh.unlock('correct-password');
    expect(r.ok).toBe(true);
    expect(fresh.isUnlocked()).toBe(true);
  });
  test('4.2 lock sets isUnlocked false', async () => {
    const r = await storage.lock();
    expect(r.ok).toBe(true);
    expect(storage.isUnlocked()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. unlock() failure → lockout
// ---------------------------------------------------------------------------

describe('5. unlock failure lockout', () => {
  test('5.1 failed unlock returns backend-error', async () => {
    const fresh = createTauriSecureStorage(mockTauri as unknown as TauriInvoke, clock);
    await fresh.initialize();
    const r = await fresh.unlock('wrong');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('backend-error');
    expect(r.auditEvent.attemptsRemaining).toBe(4);
  });
  test('5.2 5 failed attempts trigger lockout', async () => {
    const fresh = createTauriSecureStorage(mockTauri as unknown as TauriInvoke, clock);
    await fresh.initialize();
    for (let i = 0; i < 5; i += 1) {
      await fresh.unlock('wrong');
    }
    const r = await fresh.unlock('correct-password');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('lockout');
  });
  test('5.3 lockout expires after duration', async () => {
    const fresh = createTauriSecureStorage(mockTauri as unknown as TauriInvoke, clock);
    await fresh.initialize();
    for (let i = 0; i < 5; i += 1) {
      await fresh.unlock('wrong');
    }
    advance(TAURI_SECURE_STORAGE_CONSTANTS.LOCKOUT_DURATION_SECONDS * 1000 + 1000);
    const r = await fresh.unlock('correct-password');
    expect(r.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. store() happy path
// ---------------------------------------------------------------------------

describe('6. store() happy path', () => {
  test('6.1 stores a string secret', async () => {
    const r = await storage.store('session.abc', 'my-secret-token');
    expect(r.ok).toBe(true);
    expect(r.auditEvent.operation).toBe('store');
    expect(r.auditEvent.bytesAffected).toBeGreaterThan(0);
  });
  test('6.2 stores a binary secret', async () => {
    const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    const r = await storage.store('binary.key', bytes);
    expect(r.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. store() rejects when locked
// ---------------------------------------------------------------------------

describe('7. store() rejects when locked', () => {
  test('7.1 store fails when vault is locked', async () => {
    await storage.lock();
    const r = await storage.store('session.abc', 'token');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('vault-locked');
  });
});

// ---------------------------------------------------------------------------
// 8. store() rejects invalid account
// ---------------------------------------------------------------------------

describe('8. store() rejects invalid account', () => {
  test('8.1 empty account fails', async () => {
    const r = await storage.store('', 'token');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid-format');
  });
  test('8.2 reserved account fails', async () => {
    const r = await storage.store('__lockout__', 'token');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid-format');
  });
});

// ---------------------------------------------------------------------------
// 9. store() rejects too-large secret
// ---------------------------------------------------------------------------

describe('9. store() rejects too-large secret', () => {
  test('9.1 >1MB secret fails', async () => {
    const huge = new Uint8Array(TAURI_SECURE_STORAGE_CONSTANTS.MAX_SECRET_BYTES + 1);
    const r = await storage.store('huge.secret', huge);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('quota-exceeded');
  });
});

// ---------------------------------------------------------------------------
// 10. store() rejects quota exceeded
// ---------------------------------------------------------------------------

describe('10. store() rejects quota exceeded', () => {
  test('10.1 1001 distinct accounts fails', async () => {
    const fresh = createTauriSecureStorage(new MockTauri() as unknown as TauriInvoke, clock);
    await fresh.initialize();
    await fresh.unlock('correct-password');
    for (let i = 0; i < TAURI_SECURE_STORAGE_CONSTANTS.MAX_ACCOUNTS; i += 1) {
      const r = await fresh.store(`acc_${i}`, 'v');
      expect(r.ok).toBe(true);
    }
    const r = await fresh.store('acc_1000', 'v');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('quota-exceeded');
  });
});

// ---------------------------------------------------------------------------
// 11. retrieve() happy path
// ---------------------------------------------------------------------------

describe('11. retrieve() happy path', () => {
  test('11.1 retrieves a stored secret', async () => {
    await storage.store('session.abc', 'my-secret-token');
    const r = await storage.retrieve('session.abc');
    expect(r.ok).toBe(true);
    expect(r.value).toBeDefined();
    const decoded = new TextDecoder().decode(r.value);
    expect(decoded).toBe('my-secret-token');
  });
});

// ---------------------------------------------------------------------------
// 12. retrieve() not-found
// ---------------------------------------------------------------------------

describe('12. retrieve() not-found', () => {
  test('12.1 missing account returns not-found', async () => {
    const r = await storage.retrieve('does.not.exist');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('not-found');
  });
});

// ---------------------------------------------------------------------------
// 13. retrieve() rejects when locked
// ---------------------------------------------------------------------------

describe('13. retrieve() rejects when locked', () => {
  test('13.1 retrieve fails when locked', async () => {
    await storage.lock();
    const r = await storage.retrieve('session.abc');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('vault-locked');
  });
});

// ---------------------------------------------------------------------------
// 14. delete() happy path (idempotent)
// ---------------------------------------------------------------------------

describe('14. delete() happy path', () => {
  test('14.1 delete removes secret', async () => {
    await storage.store('session.abc', 'token');
    const r = await storage.delete('session.abc');
    expect(r.ok).toBe(true);
  });
  test('14.2 delete on missing is idempotent (not-found)', async () => {
    const r = await storage.delete('does.not.exist');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('not-found');
  });
});

// ---------------------------------------------------------------------------
// 15. exists() happy path
// ---------------------------------------------------------------------------

describe('15. exists() happy path', () => {
  test('15.1 returns true for stored account', async () => {
    await storage.store('session.abc', 'token');
    const r = await storage.exists('session.abc');
    expect(r.ok).toBe(true);
    expect(r.value).toBe(true);
  });
  test('15.2 returns false for missing', async () => {
    const r = await storage.exists('does.not.exist');
    expect(r.ok).toBe(true);
    expect(r.value).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 16. listAccounts() filters reserved
// ---------------------------------------------------------------------------

describe('16. listAccounts() filters reserved', () => {
  test('16.1 lists non-reserved accounts', async () => {
    await storage.store('user.session', 'v');
    await storage.store('user.csrf', 'v');
    const r = await storage.listAccounts();
    expect(r.ok).toBe(true);
    expect(r.value).toContain('user.session');
    expect(r.value).toContain('user.csrf');
    expect(r.value).not.toContain('__lockout__');
  });
});

// ---------------------------------------------------------------------------
// 17. Audit event shape
// ---------------------------------------------------------------------------

describe('17. audit event shape', () => {
  test('17.1 store emits proper audit event', async () => {
    const r = await storage.store('audit.test', 'value');
    expect(r.auditEvent.id).toMatch(/^tss_/);
    expect(r.auditEvent.operation).toBe('store');
    expect(r.auditEvent.account).toBe('audit.test');
    expect(r.auditEvent.timestamp).toBe(mockTime);
    expect(r.auditEvent.correlationId).toMatch(/^tss-store-/);
  });
  test('17.2 failed operation has ok=false', async () => {
    await storage.lock();
    const r = await storage.store('audit.test', 'value');
    expect(r.auditEvent.ok).toBe(false);
    expect(r.auditEvent.reason).toBe('vault-locked');
  });
});

// ---------------------------------------------------------------------------
// 18. Cross-service integration
// ---------------------------------------------------------------------------

describe('18. cross-service integration', () => {
  test('18.1 store + retrieve roundtrip', async () => {
    await storage.store('integration.token', 'roundtrip-value');
    const r = await storage.retrieve('integration.token');
    expect(r.ok).toBe(true);
    expect(new TextDecoder().decode(r.value)).toBe('roundtrip-value');
  });
  test('18.2 store + delete + retrieve', async () => {
    await storage.store('integration.token', 'value');
    await storage.delete('integration.token');
    const r = await storage.retrieve('integration.token');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('not-found');
  });
  test('18.3 lock + attempt + unlock', async () => {
    await storage.store('integration.token', 'value');
    await storage.lock();
    const locked = await storage.retrieve('integration.token');
    expect(locked.ok).toBe(false);
    await storage.unlock('correct-password');
    const r = await storage.retrieve('integration.token');
    expect(r.ok).toBe(true);
    expect(new TextDecoder().decode(r.value)).toBe('value');
  });
});
