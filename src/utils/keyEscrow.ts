/**
 * One-time recovery code escrow for the root storage key (K_root) — scheme (a).
 *
 * The per-install device key that masterStorage derives K_root from
 * ('finplan.storage-key.v1') is wrapped under an AES-GCM key derived from a
 * 20-character Base32 recovery code via PBKDF2-SHA256 (600k iterations). The
 * resulting EscrowRecordV1 is stored OUTSIDE the K_root envelope (raw
 * localStorage JSON, self-integrity-checked with a record checksum) so it
 * stays readable — and recoverable — precisely when K_root is not.
 *
 * Threat model and lifecycle: docs/security/KEY_ESCROW_RECOVERY_POLICY.md.
 *
 * Deliberately imports NOTHING from masterStorage/backupRestore: this module
 * must stay loadable (and its sync readers callable) while the storage layer
 * itself is failing, and masterStorage depends on `hasValidEscrowRecord`.
 */

// Must stay byte-identical to DEVICE_KEY_ITEM in masterStorage.ts. There is no
// shared import to avoid a module cycle; keyEscrow.test.ts pins the equality.
export const DEVICE_KEY_ITEM = 'finplan.storage-key.v1';

export const ESCROW_RECORD_ITEM = 'finplan.key-escrow.v1';
export const ESCROW_SCHEME = 'FP-ESCROW-V1';
export const ESCROW_KDF = 'PBKDF2-SHA256';
export const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const IV_BYTES = 12;
const KEY_ID_BYTES = 8;
export const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
/** Display form: XXXXX-XXXXX-XXXXX-XXXXX (20 chars, grouped in fives). */
export const RECOVERY_CODE_GROUPED_PATTERN = /^[A-Z2-7]{5}(-[A-Z2-7]{5}){3}$/;
/** Known plaintext sealed under the derived storage key; proves unwrap+derive before overwrite. */
const CHECK_PLAINTEXT = 'finplan-key-escrow-v1-check';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

export interface EscrowRecordV1 {
  v: 1;
  scheme: typeof ESCROW_SCHEME;
  kdf: typeof ESCROW_KDF;
  /** Base64 PBKDF2 salt. */
  salt: string;
  iter: number;
  /**
   * Base64 of IV(12) || AES-GCM ciphertext wrapping the raw 32-byte device
   * key material. The wrap IV has no dedicated field, so it rides as prefix.
   */
  wrappedKeyB64: string;
  /** Base64 AES-GCM seal of CHECK_PLAINTEXT under the derived storage key. */
  checkCt: string;
  checkIv: string;
  /** First 8 bytes of SHA-256(device key material), hex — 16 chars. */
  keyId: string;
  failedAttempts: number;
  lockedUntil: number | null;
  /** SHA-256 hex over the canonical JSON of this record WITHOUT this field. */
  recordChecksum: string;
}

export class KeyEscrowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeyEscrowError';
  }
}

export class EscrowNotEnrolledError extends KeyEscrowError {
  constructor() {
    super('No key escrow record is enrolled on this device.');
    this.name = 'EscrowNotEnrolledError';
  }
}

export class RecoveryCodeInvalidError extends KeyEscrowError {
  readonly failedAttempts: number;
  readonly remainingAttempts: number;

  constructor(failedAttempts: number, remainingAttempts: number) {
    const remaining = Math.max(0, remainingAttempts);
    super(
      `Recovery code rejected (${failedAttempts}/${MAX_FAILED_ATTEMPTS} failed attempts).` +
        (remaining > 0
          ? ` ${remaining} attempt(s) remain before lockout.`
          : ' Recovery is now locked for 15 minutes.')
    );
    this.name = 'RecoveryCodeInvalidError';
    this.failedAttempts = failedAttempts;
    this.remainingAttempts = remaining;
  }
}

export class EscrowLockedError extends KeyEscrowError {
  readonly retryAt: number;

  constructor(retryAt: number) {
    super(`Key escrow recovery is temporarily locked until ${new Date(retryAt).toISOString()}.`);
    this.name = 'EscrowLockedError';
    this.retryAt = retryAt;
  }
}

export class EscrowUnavailableError extends KeyEscrowError {
  constructor(reason: string) {
    super(`Key escrow is unavailable: ${reason}`);
    this.name = 'EscrowUnavailableError';
  }
}

export class EscrowKeyConflictError extends KeyEscrowError {
  constructor(recordKeyId: string, activeKeyId: string) {
    super(
      'This device already holds a DIFFERENT valid root storage key ' +
        `(active ${activeKeyId}, escrow ${recordKeyId}). Refusing to overwrite ` +
        'a working key with the escrowed one.'
    );
    this.name = 'EscrowKeyConflictError';
  }
}

// ---------------------------------------------------------------------------
// Encoding helpers (chunk-safe base64, canonical JSON, SHA-256 hex)
// ---------------------------------------------------------------------------

const B64_CHUNK = 0x8000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += B64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + B64_CHUNK));
  }
  return btoa(binary);
}

function base64ToBytes(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(',')}}`;
}

function assertCrypto(): Crypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new EscrowUnavailableError('Web Crypto API is not available');
  }
  return crypto;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await assertCrypto().subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function keyIdFromMaterial(material: Uint8Array): Promise<string> {
  // 8-byte truncation of SHA-256(key material) — enough to match a recovered
  // key without storing or leaking anything usable to re-derive it.
  return sha256Hex(material).then((hex) => hex.slice(0, KEY_ID_BYTES * 2));
}

// ---------------------------------------------------------------------------
// Recovery code generation / normalization
// ---------------------------------------------------------------------------

/**
 * 20-char Base32 (RFC 4648 alphabet A-Z2-7), returned grouped
 * XXXXX-XXXXX-XXXXX-XXXXX. 256 % 32 === 0, so byte % 32 is bias-free.
 */
export function generateRecoveryCode(): string {
  const rng = assertCrypto();
  const raw = new Uint8Array(20);
  rng.getRandomValues(raw);
  const chars = Array.from(raw, (b) => BASE32_ALPHABET[b % 32]);
  const flat = chars.join('');
  return (
    flat.slice(0, 5) + '-' + flat.slice(5, 10) + '-' + flat.slice(10, 15) + '-' + flat.slice(15, 20)
  );
}

/** Uppercase + strip separators/spaces so typed input matches stored form. */
export function normalizeRecoveryCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z2-7]/g, '');
}

// ---------------------------------------------------------------------------
// Record persistence (raw localStorage — deliberately NOT masterStorage)
// ---------------------------------------------------------------------------

function computeRecordChecksum(record: Omit<EscrowRecordV1, 'recordChecksum'>): Promise<string> {
  return sha256Hex(new TextEncoder().encode(stableStringify(record)));
}

export function readEscrowRecord(): EscrowRecordV1 | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(ESCROW_RECORD_ITEM);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isEscrowRecordShape(parsed)) return null;
    return parsed;
  } catch {
    // A malformed record degrades to "not enrolled": masterStorage keeps its
    // legacy rotate-fresh behavior rather than bricking boot on junk data.
    return null;
  }
}

function isEscrowRecordShape(value: unknown): value is EscrowRecordV1 {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<EscrowRecordV1>;
  return (
    r.v === 1 &&
    r.scheme === ESCROW_SCHEME &&
    r.kdf === ESCROW_KDF &&
    typeof r.salt === 'string' &&
    typeof r.iter === 'number' &&
    typeof r.wrappedKeyB64 === 'string' &&
    typeof r.checkCt === 'string' &&
    typeof r.checkIv === 'string' &&
    typeof r.keyId === 'string' &&
    typeof r.failedAttempts === 'number' &&
    (r.lockedUntil === null || typeof r.lockedUntil === 'number') &&
    typeof r.recordChecksum === 'string'
  );
}

/**
 * Sync gate consumed by masterStorage.resolveKeyMaterial(). True only when a
 * structurally valid record is present (checksum is verified on the async
 * recovery path; the sync gate must stay cheap and never throw).
 */
export function hasValidEscrowRecord(): boolean {
  try {
    return readEscrowRecord() !== null;
  } catch {
    return false;
  }
}

async function writeEscrowRecord(record: EscrowRecordV1): Promise<void> {
  localStorage.setItem(ESCROW_RECORD_ITEM, JSON.stringify(record));
}

function random(byteCount: number): Uint8Array {
  const bytes = new Uint8Array(byteCount);
  assertCrypto().getRandomValues(bytes);
  return bytes;
}

// ---------------------------------------------------------------------------
// Key derivation / wrap / check
// ---------------------------------------------------------------------------

async function deriveKek(code: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = assertCrypto().subtle;
  const codeMaterial = new TextEncoder().encode(code);
  const base = await subtle.importKey('raw', codeMaterial as BufferSource, 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS },
    base,
    256
  );
  return subtle.importKey('raw', bits, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** Same derivation masterStorage uses for K_root (SHA-256 → AES-GCM key). */
async function deriveStorageKey(material: Uint8Array): Promise<CryptoKey> {
  const subtle = assertCrypto().subtle;
  const hash = await subtle.digest('SHA-256', material as BufferSource);
  return subtle.importKey('raw', hash.slice(0, 32), { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

async function aesEncrypt(
  key: CryptoKey,
  iv: Uint8Array,
  plaintext: Uint8Array
): Promise<Uint8Array> {
  const ct = await assertCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    plaintext as BufferSource
  );
  return new Uint8Array(ct);
}

async function aesDecrypt(key: CryptoKey, iv: Uint8Array, ct: Uint8Array): Promise<Uint8Array> {
  const pt = await assertCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ct as BufferSource
  );
  return new Uint8Array(pt);
}

// ---------------------------------------------------------------------------
// Enrollment / regeneration
// ---------------------------------------------------------------------------

function readActiveDeviceKeyMaterial(): Uint8Array {
  if (typeof localStorage === 'undefined') {
    throw new EscrowUnavailableError('localStorage is not available');
  }
  if (typeof process !== 'undefined' && process.env && process.env.MASTER_STORAGE_KEY) {
    // Operator-managed key: there is no device key to wrap, and persisting an
    // env-derived key into a record would leak it to disk.
    throw new EscrowUnavailableError(
      'MASTER_STORAGE_KEY override is active; enrollment is disabled'
    );
  }
  const existing = localStorage.getItem(DEVICE_KEY_ITEM);
  if (!existing) {
    throw new EscrowUnavailableError('no per-install device key exists yet');
  }
  try {
    return base64ToBytes(existing);
  } catch {
    throw new EscrowUnavailableError('per-install device key item is corrupt');
  }
}

/**
 * Wrap the CURRENT device key under a recovery code and store the record.
 * Returns the plaintext code exactly once — it is never persisted anywhere.
 */
export async function enrollKeyEscrow(opts?: { code?: string }): Promise<{
  code: string;
  keyId: string;
}> {
  const code = opts?.code ?? generateRecoveryCode();
  const normalized = normalizeRecoveryCode(code);
  if (!RECOVERY_CODE_GROUPED_PATTERN.test(code) || normalized.length !== 20) {
    throw new EscrowUnavailableError('recovery code must be 20 Base32 characters');
  }

  const material = readActiveDeviceKeyMaterial();
  const salt = random(SALT_BYTES);
  const wrapIv = random(IV_BYTES);
  const kek = await deriveKek(normalized, salt);
  const wrapped = await aesEncrypt(kek, wrapIv, material);

  const storageKey = await deriveStorageKey(material);
  const checkIv = random(IV_BYTES);
  const checkCt = await aesEncrypt(storageKey, checkIv, new TextEncoder().encode(CHECK_PLAINTEXT));

  const keyId = await keyIdFromMaterial(material);
  const withoutChecksum: Omit<EscrowRecordV1, 'recordChecksum'> = {
    v: 1,
    scheme: ESCROW_SCHEME,
    kdf: ESCROW_KDF,
    salt: bytesToBase64(salt),
    iter: PBKDF2_ITERATIONS,
    wrappedKeyB64: bytesToBase64(new Uint8Array([...wrapIv, ...wrapped])),
    checkCt: bytesToBase64(checkCt),
    checkIv: bytesToBase64(checkIv),
    keyId,
    failedAttempts: 0,
    lockedUntil: null,
  };
  const record: EscrowRecordV1 = {
    ...withoutChecksum,
    recordChecksum: await computeRecordChecksum(withoutChecksum),
  };
  await writeEscrowRecord(record);
  return { code, keyId };
}

/** Replace the record with a fresh code wrapping the SAME current device key. */
export async function regenerateRecoveryCode(): Promise<{ code: string; keyId: string }> {
  return enrollKeyEscrow();
}

/** Remove the record entirely (used by full-reset flows and tests). */
export function clearEscrowRecord(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(ESCROW_RECORD_ITEM);
  } catch {
    // Best-effort by contract.
  }
}

// ---------------------------------------------------------------------------
// Recovery
// ---------------------------------------------------------------------------

export interface EscrowStatusSnapshot {
  enrolled: boolean;
  keyId: string | null;
  failedAttempts: number;
  lockedUntil: number | null;
  locked: boolean;
  iter: number | null;
}

export function getEscrowStatusSnapshot(now: number = Date.now()): EscrowStatusSnapshot {
  const record = readEscrowRecord();
  if (!record) {
    return {
      enrolled: false,
      keyId: null,
      failedAttempts: 0,
      lockedUntil: null,
      locked: false,
      iter: null,
    };
  }
  return {
    enrolled: true,
    keyId: record.keyId,
    failedAttempts: record.failedAttempts,
    lockedUntil: record.lockedUntil,
    locked: record.lockedUntil !== null && record.lockedUntil > now,
    iter: record.iter,
  };
}

async function registerFailedAttempt(record: EscrowRecordV1): Promise<void> {
  const failedAttempts = record.failedAttempts + 1;
  const lockedUntil =
    failedAttempts >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_MS : record.lockedUntil;
  const withoutChecksum: Omit<EscrowRecordV1, 'recordChecksum'> = {
    v: record.v,
    scheme: record.scheme,
    kdf: record.kdf,
    salt: record.salt,
    iter: record.iter,
    wrappedKeyB64: record.wrappedKeyB64,
    checkCt: record.checkCt,
    checkIv: record.checkIv,
    keyId: record.keyId,
    failedAttempts,
    lockedUntil,
  };
  await writeEscrowRecord({
    ...withoutChecksum,
    recordChecksum: await computeRecordChecksum(withoutChecksum),
  });
}

async function resetFailedAttempts(record: EscrowRecordV1): Promise<void> {
  if (record.failedAttempts === 0 && record.lockedUntil === null) return;
  const withoutChecksum: Omit<EscrowRecordV1, 'recordChecksum'> = {
    v: record.v,
    scheme: record.scheme,
    kdf: record.kdf,
    salt: record.salt,
    iter: record.iter,
    wrappedKeyB64: record.wrappedKeyB64,
    checkCt: record.checkCt,
    checkIv: record.checkIv,
    keyId: record.keyId,
    failedAttempts: 0,
    lockedUntil: null,
  };
  await writeEscrowRecord({
    ...withoutChecksum,
    recordChecksum: await computeRecordChecksum(withoutChecksum),
  });
}

function activeDeviceKeyMatches(material: Uint8Array): boolean {
  if (typeof localStorage === 'undefined') return false;
  const existing = localStorage.getItem(DEVICE_KEY_ITEM);
  if (!existing) return false;
  try {
    const current = base64ToBytes(existing);
    if (current.length !== material.length) return false;
    let diff = 0;
    for (let i = 0; i < material.length; i++) diff |= current[i]! ^ material[i]!;
    return diff === 0;
  } catch {
    return false;
  }
}

/**
 * Recover the root storage key from a recovery code.
 *
 * Flow: normalize → PBKDF2(600k) → AES-GCM unwrap → keyId check → decrypt the
 * known-plaintext check blob through the production derive path → only then
 * repersist the device key item. After a successful call the existing
 * masterStorage decrypt path works unchanged.
 */
/**
 * Unwrap + verify. Returns the recovered device key material, or throws
 * RecoveryCodeInvalidError (after registering the failed attempt).
 */
async function unwrapVerifiedMaterial(record: EscrowRecordV1, code: string): Promise<Uint8Array> {
  async function fail(): Promise<never> {
    await registerFailedAttempt(record);
    const attempts = Math.min(record.failedAttempts + 1, MAX_FAILED_ATTEMPTS);
    throw new RecoveryCodeInvalidError(attempts, MAX_FAILED_ATTEMPTS - attempts);
  }
  try {
    const kek = await deriveKek(code, base64ToBytes(record.salt));
    const wrapped = base64ToBytes(record.wrappedKeyB64);
    const unwrapped = await aesDecrypt(kek, wrapped.slice(0, IV_BYTES), wrapped.slice(IV_BYTES));
    const actualKeyId = await keyIdFromMaterial(unwrapped);
    if (actualKeyId !== record.keyId || unwrapped.length !== KEY_BYTES) {
      return await fail();
    }

    // Prove the recovered material drives the REAL storage derivation path
    // before overwriting whatever (missing/corrupt) key item is on disk.
    const storageKey = await deriveStorageKey(unwrapped);
    const checkPt = await aesDecrypt(
      storageKey,
      base64ToBytes(record.checkIv),
      base64ToBytes(record.checkCt)
    );
    if (new TextDecoder().decode(checkPt) !== CHECK_PLAINTEXT) {
      return await fail();
    }
    return unwrapped;
  } catch (cause) {
    if (cause instanceof KeyEscrowError) throw cause;
    await fail(); // GCM auth failure == wrong code.
  }
  // Unreachable: every path above either returns material or throws.
  throw new Error('keyEscrow: unreachable state in unwrapVerifiedMaterial');
}

export async function recoverStorageKey(codeInput: string): Promise<{ keyId: string }> {
  const record = readEscrowRecord();
  if (!record) throw new EscrowNotEnrolledError();

  const now = Date.now();
  if (record.lockedUntil !== null && record.lockedUntil > now) {
    throw new EscrowLockedError(record.lockedUntil);
  }

  const code = normalizeRecoveryCode(codeInput);
  const material = await unwrapVerifiedMaterial(record, code);

  if (activeDeviceKeyMatches(material)) {
    // Already healthy (e.g. user pasted the code on the same device).
    await resetFailedAttempts(record);
    return { keyId: record.keyId };
  }
  const activeItem =
    typeof localStorage !== 'undefined' ? localStorage.getItem(DEVICE_KEY_ITEM) : null;
  if (activeItem && !activeDeviceKeyMatches(material)) {
    const activeValid = (() => {
      try {
        return base64ToBytes(activeItem).length === KEY_BYTES;
      } catch {
        return false;
      }
    })();
    if (activeValid) {
      throw new EscrowKeyConflictError(
        record.keyId,
        (await keyIdFromMaterial(base64ToBytes(activeItem))).slice(0, KEY_ID_BYTES * 2)
      );
    }
  }

  localStorage.setItem(DEVICE_KEY_ITEM, bytesToBase64(material));
  await resetFailedAttempts(readEscrowRecord() ?? record);
  return { keyId: record.keyId };
}
