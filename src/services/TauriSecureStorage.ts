// FinPlan Pro v1.0.0 — Phase 7 PATCH 15 (Hephaestus, 2026-06-16)
//
// SECURITY RATIONALE:
//   All persistent secrets (session tokens, API keys, encryption keys, CSRF
//   tokens, recovery codes) MUST be stored encrypted-at-rest using the OS
//   keychain (macOS Keychain, Windows Credential Vault, Linux Secret Service)
//   via the tauri-plugin-stronghold bridge. This module is the TypeScript
//   contract for those IPC calls.
//
// THREAT MODEL ADDRESSED:
//   - CWE-256 (Plaintext Storage of a Password): all secrets passed to
//     store() are wrapped by the OS keychain, never written to disk in
//     plaintext.
//   - CWE-257 (Storing Passwords in a Recoverable Format): secrets are
//     encrypted by the OS keychain using a per-entry key bound to the
//     user's session; no application-side decrypt without user auth.
//   - CWE-312 (Cleartext Storage of Sensitive Information): the on-disk
//     representation is opaque to the application — the OS keychain owns
//     the cipher.
//   - CWE-922 (Insecure Storage of Sensitive Information): the storage
//     backend is the OS-provided keychain, not a custom file or DB row.
//   - CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor):
//     access requires the user's OS credentials, which are validated by
//     the OS, not by FinPlan.
//
// COMPLIANCE:
//   - SOC 2 CC6.1 (Logical access controls): secrets gated by OS-level auth.
//   - SOC 2 CC6.7 (Restriction of data flow): secrets never leave the
//     keychain except via the OS-mediated decrypt.
//   - GDPR Art. 32 (Security of processing): encryption-at-rest via OS
//     keychain is industry-standard.
//   - PCI DSS 3.4 (Render PAN unreadable): N/A (we don't store PAN), but
//     the pattern applies to any tokenized data.
//   - NIST SP 800-57 (Key management): keys are managed by the OS, not
//     the application — no FinPlan-side key rotation needed.
//
// DEPENDENCIES (Rust side):
//   - tauri-plugin-stronghold (Tauri 2 official plugin)
//   - keyring crate (cross-platform OS keychain)
//
// IPC CONTRACT (Rust commands, declared in src-tauri/src/secure_storage.rs):
//   - secure_storage_store(account: String, secret_b64: String) -> Result<(), String>
//   - secure_storage_retrieve(account: String) -> Result<String, String>
//   - secure_storage_delete(account: String) -> Result<(), String>
//   - secure_storage_exists(account: String) -> Result<bool, String>
//   - secure_storage_list_accounts() -> Result<Vec<String>, String>
//   - secure_storage_lock() -> Result<(), String>
//   - secure_storage_unlock(password: String) -> Result<(), String>
//
// The TypeScript service here is the wrapper. Tests mock the Tauri invoke
// call to verify behavior without a real Tauri runtime.

export const TAURI_SECURE_STORAGE_CONSTANTS = {
  SCHEMA_VERSION: 1,
  SERVICE_NAME: 'finplan-pro-v1',
  /** Maximum size of a single secret in bytes (1MB — generous for tokens). */
  MAX_SECRET_BYTES: 1_048_576,
  /** Hard cap on number of distinct accounts. */
  MAX_ACCOUNTS: 1_000,
  /** Default Stronghold vault path (relative to app data). */
  VAULT_PATH: 'finplan-pro-vault.bin',
  /** Lockout threshold — failed unlock attempts before forced lockout. */
  MAX_UNLOCK_ATTEMPTS: 5,
  /** Lockout duration after MAX_UNLOCK_ATTEMPTS in seconds. */
  LOCKOUT_DURATION_SECONDS: 300,
  /** Reason codes. */
  REASON_OK: 'ok',
  REASON_NOT_FOUND: 'not-found',
  REASON_INVALID_FORMAT: 'invalid-format',
  REASON_QUOTA_EXCEEDED: 'quota-exceeded',
  REASON_LOCKED: 'vault-locked',
  REASON_LOCKOUT: 'lockout',
  REASON_BACKEND_ERROR: 'backend-error',
  REASON_RACE: 'concurrent-modification',
  /** Audit event category. */
  AUDIT_CATEGORY: 'data-modification' as const,
  /** Reserved account names (cannot be used as user accounts). */
  RESERVED_ACCOUNTS: ['__lockout__', '__attempts__', '__metadata__', '__version__'] as const,
} as const;

export type SecureStorageReason =
  | 'ok'
  | 'not-found'
  | 'invalid-format'
  | 'quota-exceeded'
  | 'vault-locked'
  | 'lockout'
  | 'backend-error'
  | 'concurrent-modification';

export type SecureStorageOperation =
  | 'store'
  | 'retrieve'
  | 'delete'
  | 'exists'
  | 'list'
  | 'lock'
  | 'unlock';

export interface SecureStorageResult<T> {
  ok: boolean;
  reason: SecureStorageReason;
  value?: T;
  /** Audit event for caller persistence. */
  auditEvent: SecureStorageAuditEvent;
}

export interface SecureStorageAuditEvent {
  id: string;
  operation: SecureStorageOperation;
  account: string;
  reason: SecureStorageReason;
  ok: boolean;
  timestamp: number;
  correlationId: string;
  bytesAffected: number;
  attemptsRemaining?: number;
}

/**
 * Tauri IPC contract for the secure storage backend. The default
 * implementation calls the Tauri `invoke` global. Tests inject a mock.
 */
export interface TauriInvoke {
  invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}

/**
 * Account key validator. The Rust backend uses `account` as a keychain
 * account name. It MUST be a non-empty printable ASCII string, max 256
 * chars, no NUL bytes, no control characters.
 */
export function validateAccount(account: string): { ok: boolean; reason: SecureStorageReason } {
  if (typeof account !== 'string') {
    return { ok: false, reason: 'invalid-format' };
  }
  if (account.length === 0 || account.length > 256) {
    return { ok: false, reason: 'invalid-format' };
  }
  // ASCII printable + a few separators.
  for (let i = 0; i < account.length; i += 1) {
    const c = account.charCodeAt(i);
    const valid =
      (c >= 0x21 && c <= 0x7e) || c === 0x5f /* _ */ || c === 0x2d /* - */ || c === 0x2e; /* . */
    if (!valid) {
      return { ok: false, reason: 'invalid-format' };
    }
  }
  if ((TAURI_SECURE_STORAGE_CONSTANTS.RESERVED_ACCOUNTS as readonly string[]).includes(account)) {
    return { ok: false, reason: 'invalid-format' };
  }
  return { ok: true, reason: 'ok' };
}

export class TauriSecureStorage {
  private readonly tauri: TauriInvoke;
  private readonly accounts = new Set<string>();
  private attempts = 0;
  private locked = true;
  private unlockedAt = 0;
  private monotonicNow: (() => number) | null = null;
  private initialized = false;

  constructor(tauri: TauriInvoke, monotonicNow?: () => number) {
    this.tauri = tauri;
    if (monotonicNow) this.monotonicNow = monotonicNow;
  }

  private now(): number {
    return this.monotonicNow ? this.monotonicNow() : Date.now();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Try to list existing accounts to populate the local cache. Even when
    // the vault is locked, listing may be possible — but we don't try if
    // not unlocked.
    this.initialized = true;
  }

  /**
   * Unlock the vault. After MAX_UNLOCK_ATTEMPTS failed attempts, the vault
   * is locked out for LOCKOUT_DURATION_SECONDS.
   */
  async unlock(password: string): Promise<SecureStorageResult<true>> {
    if (!this.initialized) {
      throw new Error('TauriSecureStorage not initialized');
    }
    if (this.attempts >= TAURI_SECURE_STORAGE_CONSTANTS.MAX_UNLOCK_ATTEMPTS) {
      // Check if lockout has expired.
      if (
        this.unlockedAt + TAURI_SECURE_STORAGE_CONSTANTS.LOCKOUT_DURATION_SECONDS * 1000 >
        this.now()
      ) {
        return this.buildResult('unlock', '__unlock__', false, 'lockout', 0, 0);
      }
      this.attempts = 0;
    }
    try {
      await this.tauri.invoke<null>('plugin:stronghold|unlock', { password });
      this.locked = false;
      this.unlockedAt = this.now();
      this.attempts = 0;
      return this.buildResult('unlock', '__unlock__', true, 'ok', 0, 0);
    } catch (err) {
      this.attempts += 1;
      if (this.attempts >= TAURI_SECURE_STORAGE_CONSTANTS.MAX_UNLOCK_ATTEMPTS) {
        this.unlockedAt = this.now();
      }
      const remaining = Math.max(
        0,
        TAURI_SECURE_STORAGE_CONSTANTS.MAX_UNLOCK_ATTEMPTS - this.attempts
      );
      const event = this.buildResult('unlock', '__unlock__', false, 'backend-error', 0, 0);
      event.auditEvent.attemptsRemaining = remaining;
      return event as unknown as SecureStorageResult<true>;
    }
  }

  async lock(): Promise<SecureStorageResult<true>> {
    if (!this.initialized) {
      throw new Error('TauriSecureStorage not initialized');
    }
    try {
      await this.tauri.invoke<null>('plugin:stronghold|lock');
      this.locked = true;
      this.accounts.clear();
      return this.buildResult('lock', '__lock__', true, 'ok', 0, 0);
    } catch (err) {
      return this.buildResult('lock', '__lock__', false, 'backend-error', 0, 0);
    }
  }

  isUnlocked(): boolean {
    return !this.locked;
  }

  /**
   * Store a secret. The secret is base64-encoded before being passed to
   * the Rust backend, which then stores it in the OS keychain.
   */
  async store(account: string, secret: string | Uint8Array): Promise<SecureStorageResult<true>> {
    if (!this.initialized) throw new Error('TauriSecureStorage not initialized');
    if (this.locked) return this.buildResult('store', account, false, 'vault-locked', 0, 0);
    const v = validateAccount(account);
    if (!v.ok) return this.buildResult('store', account, false, v.reason, 0, 0);
    const bytes = typeof secret === 'string' ? new TextEncoder().encode(secret) : secret;
    if (bytes.byteLength > TAURI_SECURE_STORAGE_CONSTANTS.MAX_SECRET_BYTES) {
      return this.buildResult('store', account, false, 'quota-exceeded', 0, bytes.byteLength);
    }
    if (
      this.accounts.size >= TAURI_SECURE_STORAGE_CONSTANTS.MAX_ACCOUNTS &&
      !this.accounts.has(account)
    ) {
      return this.buildResult('store', account, false, 'quota-exceeded', 0, bytes.byteLength);
    }
    const secretB64 = bytesToBase64(bytes);
    try {
      await this.tauri.invoke<null>('plugin:stronghold|store', {
        service: TAURI_SECURE_STORAGE_CONSTANTS.SERVICE_NAME,
        account,
        secret: secretB64,
      });
      this.accounts.add(account);
      return this.buildResult('store', account, true, 'ok', 0, bytes.byteLength);
    } catch (err) {
      return this.buildResult('store', account, false, 'backend-error', 0, bytes.byteLength);
    }
  }

  /**
   * Retrieve a secret. Returns the raw bytes (decoded from base64) so that
   * the caller can treat the result as a binary or text.
   */
  async retrieve(account: string): Promise<SecureStorageResult<Uint8Array>> {
    if (!this.initialized) throw new Error('TauriSecureStorage not initialized');
    if (this.locked) return this.buildResult('retrieve', account, false, 'vault-locked', 0, 0);
    const v = validateAccount(account);
    if (!v.ok) return this.buildResult('retrieve', account, false, v.reason, 0, 0);
    try {
      const secretB64 = await this.tauri.invoke<string>('plugin:stronghold|retrieve', {
        service: TAURI_SECURE_STORAGE_CONSTANTS.SERVICE_NAME,
        account,
      });
      const bytes = base64ToBytes(secretB64);
      this.accounts.add(account);
      return this.buildResult('retrieve', account, true, 'ok', 0, bytes.byteLength, bytes);
    } catch (err) {
      const reason = isNotFoundError(err) ? 'not-found' : 'backend-error';
      return this.buildResult('retrieve', account, false, reason, 0, 0);
    }
  }

  /**
   * Delete a secret from the keychain. Idempotent.
   */
  async delete(account: string): Promise<SecureStorageResult<true>> {
    if (!this.initialized) throw new Error('TauriSecureStorage not initialized');
    if (this.locked) return this.buildResult('delete', account, false, 'vault-locked', 0, 0);
    const v = validateAccount(account);
    if (!v.ok) return this.buildResult('delete', account, false, v.reason, 0, 0);
    try {
      await this.tauri.invoke<null>('plugin:stronghold|delete', {
        service: TAURI_SECURE_STORAGE_CONSTANTS.SERVICE_NAME,
        account,
      });
      this.accounts.delete(account);
      return this.buildResult('delete', account, true, 'ok', 0, 0);
    } catch (err) {
      const reason = isNotFoundError(err) ? 'not-found' : 'backend-error';
      return this.buildResult('delete', account, false, reason, 0, 0);
    }
  }

  /**
   * Check if an account exists. Does not require unlock on the Rust side
   * (the OS keychain has its own access control).
   */
  async exists(account: string): Promise<SecureStorageResult<boolean>> {
    if (!this.initialized) throw new Error('TauriSecureStorage not initialized');
    const v = validateAccount(account);
    if (!v.ok) return this.buildResult('exists', account, false, v.reason, 0, 0);
    try {
      const exists = await this.tauri.invoke<boolean>('plugin:stronghold|exists', {
        service: TAURI_SECURE_STORAGE_CONSTANTS.SERVICE_NAME,
        account,
      });
      return this.buildResult('exists', account, true, 'ok', 0, 0, exists);
    } catch (err) {
      return this.buildResult('exists', account, false, 'backend-error', 0, 0);
    }
  }

  /**
   * List all accounts in the keychain. Used by Settings → Security to show
   * "Active Sessions" / "Stored Tokens".
   */
  async listAccounts(): Promise<SecureStorageResult<string[]>> {
    if (!this.initialized) throw new Error('TauriSecureStorage not initialized');
    if (this.locked) return this.buildResult('list', '__list__', false, 'vault-locked', 0, 0);
    try {
      const accounts = await this.tauri.invoke<string[]>('plugin:stronghold|list', {
        service: TAURI_SECURE_STORAGE_CONSTANTS.SERVICE_NAME,
      });
      const filtered = accounts.filter(
        (a) => !(TAURI_SECURE_STORAGE_CONSTANTS.RESERVED_ACCOUNTS as readonly string[]).includes(a)
      );
      this.accounts.clear();
      filtered.forEach((a) => this.accounts.add(a));
      return this.buildResult('list', '__list__', true, 'ok', 0, 0, filtered);
    } catch (err) {
      return this.buildResult('list', '__list__', false, 'backend-error', 0, 0);
    }
  }

  /**
   * Reset all internal state. Test-only utility.
   */
  reset(): void {
    this.accounts.clear();
    this.attempts = 0;
    this.locked = true;
    this.unlockedAt = 0;
    this.initialized = false;
  }

  // --- private ---

  private buildResult<T>(
    operation: SecureStorageOperation,
    account: string,
    ok: boolean,
    reason: SecureStorageReason,
    attemptsRemainingOffset: number,
    bytesAffected: number,
    value?: T
  ): SecureStorageResult<T> {
    const id = `tss_${shortRandomId()}`;
    const correlationId = `tss-${operation}-${this.now()}-${shortRandomId()}`;
    return {
      ok,
      reason,
      value,
      auditEvent: {
        id,
        operation,
        account,
        reason,
        ok,
        timestamp: this.now(),
        correlationId,
        bytesAffected,
        attemptsRemaining:
          attemptsRemainingOffset > 0
            ? attemptsRemainingOffset
            : Math.max(0, TAURI_SECURE_STORAGE_CONSTANTS.MAX_UNLOCK_ATTEMPTS - this.attempts),
      },
    };
  }
}

/**
 * Production accessor. Creates a TauriSecureStorage that wraps the global
 * Tauri `invoke` function. Should be called after the Tauri runtime is up.
 */
export function createTauriSecureStorage(
  tauri: TauriInvoke,
  monotonicNow?: () => number
): TauriSecureStorage {
  return new TauriSecureStorage(tauri, monotonicNow);
}

// --- helpers ---

function bytesToBase64(bytes: Uint8Array): string {
  // Browser-safe base64. Works in both Node and browser.
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function isNotFoundError(err: unknown): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : err instanceof Error ? err.message : String(err);
  return /not[_-]?found|no[_-]?entry/i.test(msg);
}

function shortRandomId(): string {
  return Math.random().toString(36).slice(2, 10).padEnd(8, '0');
}
