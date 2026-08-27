// Integration pin for the desktop storage IPC (W-FAB wave-4, agent 1).
//
// Scope: consumer-level round trip of TauriSecureStorage against a scripted
// invoke double that emulates the registered `secure_storage_*` Rust commands
// (src-tauri/src/secure_storage.rs) as a STATEFUL keychain with STRICT wire
// validation — every call must carry exactly `{ args }` with the canonical
// struct fields, rejections carry the serialized CommandError
// (`{ code, message }`), and `secure_storage_lock` takes NO payload.
//
// Deliberately different from TauriSecureStorage.test.ts: that suite pins
// per-call behavior with per-command stubs and a recording spy; this suite
// proves the WHOLE lifecycle over one persistent backend state
// (store → exists → retrieve → delete → exists → classified not-found),
// including the K25 rule that a `not-found` classification is a tombstone
// success for the UI, never a generic backend failure.
//
// Only the Tauri invoke layer is doubled (constructor injection) — no
// @tauri-apps imports, no globals patched, so this runs in plain jsdom.
import { describe, expect, it, beforeEach } from 'vitest';

import {
  createTauriSecureStorage,
  TAURI_SECURE_STORAGE_CONSTANTS,
  type TauriInvoke,
} from './TauriSecureStorage';

const { SERVICE_NAME } = TAURI_SECURE_STORAGE_CONSTANTS;

/** Serialized CommandError wire shape the Rust commands reject with. */
interface CommandError {
  code: string;
  message: string;
}

const commandError = (code: string, message: string): CommandError => ({ code, message });

/**
 * Scripted Rust-backend stand-in. Stateful across calls within one instance;
 * validates the wire struct of EVERY command before touching state, so a
 * client regression in arg shaping fails here with a precise message.
 */
class ScriptedKeychainBackend implements TauriInvoke {
  readonly calls: Array<{ cmd: string; raw?: Record<string, unknown> }> = [];

  private readonly entries = new Map<string, string>();

  /** Pre-seed an entry bypassing IPC (simulates a previous session's keychain). */
  seed(service: string, account: string, secretB64: string): void {
    this.entries.set(`${service}\u0000${account}`, secretB64);
  }

  /** Raw stored value for wire-level assertions (still base64). */
  peekRaw(service: string, account: string): string | undefined {
    return this.entries.get(`${service}\u0000${account}`);
  }

  private requireStruct(
    cmd: string,
    raw: Record<string, unknown> | undefined
  ): Record<string, unknown> {
    if (!raw || typeof raw !== 'object' || !('args' in raw) || typeof raw.args !== 'object') {
      throw commandError('invalid-format', `${cmd}: expected single { args } struct parameter`);
    }
    return raw.args as Record<string, unknown>;
  }

  private requireServiceAccount(
    cmd: string,
    args: Record<string, unknown>
  ): {
    service: string;
    account: string;
  } {
    const { service, account } = args as { service?: unknown; account?: unknown };
    if (service !== SERVICE_NAME) {
      throw commandError('invalid-format', `${cmd}: service must be "${SERVICE_NAME}"`);
    }
    if (typeof account !== 'string' || account.length === 0) {
      throw commandError('invalid-format', `${cmd}: account must be a non-empty string`);
    }
    return { service, account };
  }

  invoke = async <T>(cmd: string, raw?: Record<string, unknown>): Promise<T> => {
    this.calls.push({ cmd, raw });
    switch (cmd) {
      case 'secure_storage_unlock': {
        const args = this.requireStruct(cmd, raw);
        if (typeof args.password !== 'string' || args.password.length === 0) {
          throw commandError('invalid-format', 'unlock: password required');
        }
        return null as unknown as T;
      }
      case 'secure_storage_lock': {
        // Contract: zero invoke parameters — raw MUST be absent.
        if (raw !== undefined) {
          throw commandError('invalid-format', 'lock: takes no parameters');
        }
        return null as unknown as T;
      }
      case 'secure_storage_store': {
        const args = this.requireStruct(cmd, raw);
        const { service, account } = this.requireServiceAccount(cmd, args);
        if (typeof args.secret !== 'string' || args.secret.length === 0) {
          throw commandError('invalid-format', 'store: secret (base64) required');
        }
        this.entries.set(`${service}\u0000${account}`, args.secret);
        return null as unknown as T;
      }
      case 'secure_storage_retrieve': {
        const args = this.requireStruct(cmd, raw);
        const { service, account } = this.requireServiceAccount(cmd, args);
        const value = this.entries.get(`${service}\u0000${account}`);
        if (value === undefined) {
          throw commandError('not-found', 'No matching entry found in secure storage');
        }
        return value as unknown as T;
      }
      case 'secure_storage_delete': {
        const args = this.requireStruct(cmd, raw);
        const { service, account } = this.requireServiceAccount(cmd, args);
        const key = `${service}\u0000${account}`;
        if (!this.entries.has(key)) {
          throw commandError('not-found', 'no such entry');
        }
        this.entries.delete(key);
        return null as unknown as T;
      }
      case 'secure_storage_exists': {
        const args = this.requireStruct(cmd, raw);
        const { service, account } = this.requireServiceAccount(cmd, args);
        return this.entries.has(`${service}\u0000${account}`) as unknown as T;
      }
      case 'secure_storage_list_accounts': {
        const args = this.requireStruct(cmd, raw);
        if (args.service !== SERVICE_NAME) {
          throw commandError('invalid-format', 'list_accounts: service must be the app service');
        }
        const accounts = [...this.entries.keys()].map((k) => k.split('\u0000')[1] ?? '');
        return accounts as unknown as T;
      }
      default:
        throw commandError('backend-error', `unknown command: ${cmd}`);
    }
  };
}

/** Independent base64 of UTF-8 bytes (does not reuse the service internals). */
function toBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

describe('TauriSecureStorage ↔ secure_storage_* IPC integration (scripted Rust stand-in)', () => {
  let backend: ScriptedKeychainBackend;
  let storage: ReturnType<typeof createTauriSecureStorage>;
  const account = 'session-token#1';

  beforeEach(async () => {
    backend = new ScriptedKeychainBackend();
    storage = createTauriSecureStorage(backend);
    await storage.initialize();
    const unlocked = await storage.unlock('master-password');
    expect(unlocked.ok).toBe(true);
    backend.calls.length = 0; // lifecycle calls are pinned separately below
  });

  it('full round trip: store → exists true → retrieve original → delete → exists false', async () => {
    const secret = 'sk-live-9f2c4e7a1b0d6f38 — ünïcodé ✓ safe';
    const stored = await storage.store(account, secret);
    expect(stored.ok).toBe(true);
    expect(stored.reason).toBe('ok');

    const existsAfterStore = await storage.exists(account);
    expect(existsAfterStore).toMatchObject({ ok: true, reason: 'ok', value: true });

    const retrieved = await storage.retrieve(account);
    expect(retrieved.ok).toBe(true);
    expect(retrieved.reason).toBe('ok');
    expect(retrieved.value).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(retrieved.value)).toBe(secret);

    const deleted = await storage.delete(account);
    expect(deleted.ok).toBe(true);

    const existsAfterDelete = await storage.exists(account);
    expect(existsAfterDelete).toMatchObject({ ok: true, reason: 'ok', value: false });
  });

  it('wire structs: each command sends exactly one { args } struct with canonical fields; lock() sends no payload', async () => {
    await storage.store(account, 'payload');
    await storage.retrieve(account);
    await storage.exists(account);
    await storage.delete(account);
    await storage.listAccounts();
    await storage.lock();

    expect(backend.calls.map((c) => c.cmd)).toEqual([
      'secure_storage_store',
      'secure_storage_retrieve',
      'secure_storage_exists',
      'secure_storage_delete',
      'secure_storage_list_accounts',
      'secure_storage_lock',
    ]);
    for (const call of backend.calls.slice(0, -1)) {
      expect(call.raw).toHaveProperty('args');
      expect((call.raw as { args: Record<string, unknown> }).args.service).toBe(SERVICE_NAME);
    }
    // Per-command arg structs.
    const [, retrieveCall, existsCall, deleteCall, listCall, lockCall] = backend.calls;
    expect((retrieveCall.raw as { args: unknown }).args).toEqual({
      service: SERVICE_NAME,
      account,
    });
    expect((existsCall.raw as { args: unknown }).args).toEqual({
      service: SERVICE_NAME,
      account,
    });
    expect((deleteCall.raw as { args: unknown }).args).toEqual({
      service: SERVICE_NAME,
      account,
    });
    expect((listCall.raw as { args: unknown }).args).toEqual({ service: SERVICE_NAME });
    expect(lockCall.raw).toBeUndefined();
  });

  it('store writes base64 of the exact UTF-8 bytes onto the wire', async () => {
    const secret = 'token-with-ümlaut-✓';
    await storage.store(account, secret);
    const raw = backend.peekRaw(SERVICE_NAME, account);
    expect(raw).toBe(toBase64Utf8(secret));
  });

  it('retrieve after delete: IPC boundary rejects CommandError not-found; service classifies it so (K25 tombstone success)', async () => {
    await storage.store(account, 'ephemeral');
    await storage.delete(account);

    // Boundary level: the backend rejects with the serialized CommandError.
    const boundaryOutcome = await backend
      .invoke<string>('secure_storage_retrieve', {
        args: { service: SERVICE_NAME, account },
      })
      .then(
        () => 'resolved',
        (err: unknown) => err
      );
    expect(boundaryOutcome).not.toBe('resolved');
    expect(boundaryOutcome).toMatchObject({ code: 'not-found' });
    expect(typeof (boundaryOutcome as CommandError).message).toBe('string');

    // Service level: the classifier maps that rejection to reason 'not-found'
    // — the UI treats this as success-per-K25, never as backend-error.
    const result = await storage.retrieve(account);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('not-found');
    expect(result.auditEvent.operation).toBe('retrieve');
    expect(result.auditEvent.account).toBe(account);
  });

  it('delete of an already-absent entry classifies not-found (idempotent tombstone replay)', async () => {
    const result = await storage.delete(account);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('not-found');
  });

  it('classifier discriminates: non-not-found backend failures stay backend-error', async () => {
    const breaking = createTauriSecureStorage({
      // Unlock must SUCCEED so retrieve reaches the IPC layer; only retrieve
      // fails, isolating the classifier from the lock gate.
      invoke: async (cmd: string) => {
        if (cmd === 'secure_storage_unlock') return;
        throw commandError('backend-error', 'keychain daemon unreachable');
      },
    });
    await breaking.initialize();
    await breaking.unlock('master-password');
    const result = await breaking.retrieve(account);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('backend-error');
    expect(result.reason).not.toBe('not-found');
  });

  it('lifecycle wires unlock before data commands; unlock struct carries the password', async () => {
    const freshBackend = new ScriptedKeychainBackend();
    const fresh = createTauriSecureStorage(freshBackend);
    await fresh.initialize();
    const outcome = await fresh.unlock('correct horse battery staple');
    expect(outcome.ok).toBe(true);
    expect(outcome.auditEvent.operation).toBe('unlock');

    await fresh.store(account, 'post-unlock');
    expect(freshBackend.calls[0].cmd).toBe('secure_storage_unlock');
    expect((freshBackend.calls[0].raw as { args: unknown }).args).toEqual({
      password: 'correct horse battery staple',
    });
  });

  it('unknown commands are rejected by the IPC boundary (double strictness guard)', async () => {
    const outcome = await backend.invoke('secure_storage_reboot', { args: {} }).then(
      () => 'resolved',
      (err: unknown) => err
    );
    expect(outcome).toMatchObject({ code: 'backend-error' });
  });
});
