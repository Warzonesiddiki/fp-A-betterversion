/**
 * keyEscrow scheme (a) unit tests — one-time recovery code wrapping K_root.
 *
 * Heavy tests run real Web Crypto PBKDF2 at the production 600k iterations
 * (parameters are LOCKED and must never be lowered for test speed), so the
 * crypto-bearing cases carry explicit generous timeouts.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEVICE_KEY_ITEM as MASTER_STORAGE_DEVICE_KEY_ITEM } from './masterStorage';
import {
  BASE32_ALPHABET,
  DEVICE_KEY_ITEM,
  ESCROW_KDF,
  ESCROW_RECORD_ITEM,
  ESCROW_SCHEME,
  LOCKOUT_MS,
  MAX_FAILED_ATTEMPTS,
  PBKDF2_ITERATIONS,
  RECOVERY_CODE_GROUPED_PATTERN,
  EscrowKeyConflictError,
  EscrowLockedError,
  EscrowNotEnrolledError,
  EscrowUnavailableError,
  clearEscrowRecord,
  enrollKeyEscrow,
  generateRecoveryCode,
  getEscrowStatusSnapshot,
  hasValidEscrowRecord,
  normalizeRecoveryCode,
  readEscrowRecord,
  recoverStorageKey,
  regenerateRecoveryCode,
} from './keyEscrow';

// 12-byte wrap IV + 32-byte key ciphertext + 16-byte GCM auth tag.
const IV_PLUS_CT_LEN = 60;

function base64ToBytes(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function setDeviceKey(material: Uint8Array): void {
  localStorage.setItem(DEVICE_KEY_ITEM, bytesToBase64(material));
}

let savedMasterStorageKey: string | undefined;

beforeEach(() => {
  savedMasterStorageKey = process.env.MASTER_STORAGE_KEY;
  delete process.env.MASTER_STORAGE_KEY;
  localStorage.clear();
});

afterEach(() => {
  if (savedMasterStorageKey === undefined) delete process.env.MASTER_STORAGE_KEY;
  else process.env.MASTER_STORAGE_KEY = savedMasterStorageKey;
});

describe('recovery code generation', () => {
  it('generates grouped XXXXX-XXXXX-XXXXX-XXXXX Base32 codes', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRecoveryCode();
      expect(code).toHaveLength(23); // 20 chars + 3 dashes
      expect(code).toMatch(RECOVERY_CODE_GROUPED_PATTERN);
      expect(code.replace(/-/g, '')).toHaveLength(20);
      for (const ch of code.replace(/-/g, '')) {
        expect(BASE32_ALPHABET).toContain(ch);
      }
    }
  });

  it('generates distinct codes (no constant output)', () => {
    expect(generateRecoveryCode()).not.toBe(generateRecoveryCode());
  });

  it('normalizes typed input: lowercase, dashes, spaces stripped', () => {
    expect(normalizeRecoveryCode('abcde-fghij-klmno-pqrst')).toBe('ABCDEFGHIJKLMNOPQRST');
    expect(normalizeRecoveryCode(' abcde fgh2j klmno pqrst ')).toBe('ABCDEFGH2JKLMNOPQRST');
  });
});

describe('module wiring guards', () => {
  it('device-key literal stays identical to masterStorage (cycle-free duplication)', () => {
    expect(DEVICE_KEY_ITEM).toBe(MASTER_STORAGE_DEVICE_KEY_ITEM);
  });
});

describe('enrollment', () => {
  it('refuses when no valid device key exists', async () => {
    await expect(enrollKeyEscrow()).rejects.toBeInstanceOf(EscrowUnavailableError);
    expect(hasValidEscrowRecord()).toBe(false);
  });

  it('refuses while the MASTER_STORAGE_KEY operator override is active', async () => {
    setDeviceKey(new Uint8Array(32).fill(7));
    process.env.MASTER_STORAGE_KEY = 'operator-key';
    await expect(enrollKeyEscrow()).rejects.toThrow(/MASTER_STORAGE_KEY/);
    expect(readEscrowRecord()).toBeNull();
  });

  it(
    'creates a structurally valid EscrowRecordV1 wrapping the current device key',
    { timeout: 60_000 },
    async () => {
      const material = new Uint8Array(32);
      crypto.getRandomValues(material);
      setDeviceKey(material);

      const { code, keyId } = await enrollKeyEscrow();
      expect(RECOVERY_CODE_GROUPED_PATTERN.test(code)).toBe(true);
      expect(keyId).toBe((await sha256Hex(material)).slice(0, 16));

      const record = readEscrowRecord();
      expect(record).not.toBeNull();
      expect(record!.v).toBe(1);
      expect(record!.scheme).toBe(ESCROW_SCHEME);
      expect(record!.kdf).toBe(ESCROW_KDF);
      expect(record!.iter).toBe(PBKDF2_ITERATIONS);
      expect(record!.salt).toHaveLength(24); // base64 of 16 bytes
      expect(base64ToBytes(record!.wrappedKeyB64)).toHaveLength(IV_PLUS_CT_LEN); // 12 iv + 32 ct
      expect(record!.keyId).toBe(keyId);
      expect(record!.failedAttempts).toBe(0);
      expect(record!.lockedUntil).toBeNull();

      // Record checksum verifies over canonical JSON of the record minus itself.
      const { recordChecksum: _ignored, ...rest } = record!;
      const canonical = JSON.stringify(rest, Object.keys(rest).sort());
      const digest = await sha256Hex(new TextEncoder().encode(canonical));
      expect(record!.recordChecksum).toBe(digest.slice(0, 64));
    }
  );

  it('regeneration wraps the same key under a NEW code and replaces the record', async () => {
    // Enrollment itself is crypto-heavy; regenerate reuses the same path, so
    // one execution is enough to pin identity-of-key semantics.
    const material = new Uint8Array(32).fill(9);
    setDeviceKey(material);
    const first = await enrollKeyEscrow(undefined);
    const second = await regenerateRecoveryCode();
    expect(second.keyId).toBe(first.keyId);
    expect(second.code).not.toBe(first.code);
    expect(localStorage.getItem(ESCROW_RECORD_ITEM)).not.toBeNull();
  }, 60_000);
});

describe('recovery', () => {
  it('restores the exact device key material after the key item is wiped', async () => {
    const material = new Uint8Array(32);
    crypto.getRandomValues(material);
    setDeviceKey(material);
    const { code } = await enrollKeyEscrow();

    localStorage.removeItem(DEVICE_KEY_ITEM);
    const result = await recoverStorageKey(code.toLowerCase()); // typed sloppily on purpose

    expect(result.keyId).toBe((await sha256Hex(material)).slice(0, 16));
    expect(localStorage.getItem(DEVICE_KEY_ITEM)).toBe(bytesToBase64(material));
  }, 60_000);

  it('restores the device key after the key item is CORRUPTED', async () => {
    const material = new Uint8Array(32).fill(3);
    setDeviceKey(material);
    const { code } = await enrollKeyEscrow();

    localStorage.setItem(DEVICE_KEY_ITEM, '!!!corrupt-not-base64!!!');
    await recoverStorageKey(code);
    expect(localStorage.getItem(DEVICE_KEY_ITEM)).toBe(bytesToBase64(material));
  }, 60_000);

  it('rejects without an escrow record', async () => {
    await expect(recoverStorageKey('AAAAAAAAAAAAAAAAAAAA')).rejects.toBeInstanceOf(
      EscrowNotEnrolledError
    );
  });

  it('wrong code increments failedAttempts; lockout engages after the maximum', async () => {
    const material = new Uint8Array(32).fill(5);
    setDeviceKey(material);
    const { code } = await enrollKeyEscrow();

    for (let attempt = 1; attempt <= MAX_FAILED_ATTEMPTS - 1; attempt++) {
      await expect(recoverStorageKey('ZZZZZ22222ZZZZZ22222')).rejects.toMatchObject({
        name: 'RecoveryCodeInvalidError',
        remainingAttempts: MAX_FAILED_ATTEMPTS - attempt,
      });
      expect(readEscrowRecord()!.failedAttempts).toBe(attempt);
    }

    // Final allowed failure trips the lock.
    await expect(recoverStorageKey('ZZZZZ22222ZZZZZ22222')).rejects.toMatchObject({
      name: 'RecoveryCodeInvalidError',
      remainingAttempts: 0,
    });
    expect(readEscrowRecord()!.lockedUntil).not.toBeNull();
    expect(getEscrowStatusSnapshot().locked).toBe(true);

    // Even the CORRECT code is refused while locked — without any KDF work.
    await expect(recoverStorageKey(code)).rejects.toBeInstanceOf(EscrowLockedError);
    expect(getEscrowStatusSnapshot().lockedUntil ?? 0).toBeLessThanOrEqual(Date.now() + LOCKOUT_MS);
  }, 120_000);
});

describe('record integrity and conflicts', () => {
  it('treats a tampered/corrupt record as not enrolled', () => {
    localStorage.setItem(
      ESCROW_RECORD_ITEM,
      JSON.stringify({ v: 1, scheme: 'FP-ESCROW-V1', nonsense: true })
    );
    expect(readEscrowRecord()).toBeNull();
    expect(hasValidEscrowRecord()).toBe(false);

    localStorage.setItem(ESCROW_RECORD_ITEM, '{broken json');
    expect(readEscrowRecord()).toBeNull();
  });

  it('clearEscrowRecord removes the record', () => {
    localStorage.setItem(ESCROW_RECORD_ITEM, '{}');
    clearEscrowRecord();
    expect(localStorage.getItem(ESCROW_RECORD_ITEM)).toBeNull();
  });

  it('refuses recovery onto a DIFFERENT healthy device key (conflict guard)', async () => {
    const original = new Uint8Array(32).fill(11);
    setDeviceKey(original);
    const { code } = await enrollKeyEscrow();

    // Simulate another install's healthy key occupying the slot.
    const foreign = new Uint8Array(32).fill(12);
    setDeviceKey(foreign);

    await expect(recoverStorageKey(code)).rejects.toBeInstanceOf(EscrowKeyConflictError);
    expect(localStorage.getItem(DEVICE_KEY_ITEM)).toBe(bytesToBase64(foreign));
  }, 60_000);
});

describe('status snapshot', () => {
  it('reports not-enrolled when no record exists', () => {
    const snapshot = getEscrowStatusSnapshot();
    expect(snapshot).toEqual({
      enrolled: false,
      keyId: null,
      failedAttempts: 0,
      lockedUntil: null,
      locked: false,
      iter: null,
    });
  });

  it('reports enrollment metadata once enrolled', async () => {
    setDeviceKey(new Uint8Array(32).fill(21));
    const { keyId } = await enrollKeyEscrow();
    const snapshot = getEscrowStatusSnapshot();
    expect(snapshot.enrolled).toBe(true);
    expect(snapshot.keyId).toBe(keyId);
    expect(snapshot.iter).toBe(PBKDF2_ITERATIONS);
    expect(snapshot.locked).toBe(false);
  }, 60_000);
});
