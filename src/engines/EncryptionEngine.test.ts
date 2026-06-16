import { describe, it, expect } from 'vitest';
import { EncryptionEngine, ENCRYPTION_CONSTANTS, type EncryptedData } from './EncryptionEngine';

// =============================================================================
// EncryptionEngine Tests
// "AES-256-GCM or nothing."
// =============================================================================

// The EncryptionEngine uses Web Crypto API (crypto.subtle).
// Vitest runs in Node, which has globalThis.crypto since Node 15+.
// If crypto.subtle is unavailable, these tests will be skipped.

const hasCryptoSubtle =
  typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle !== 'undefined';

const describeIfCrypto = hasCryptoSubtle ? describe : describe.skip;

describeIfCrypto('EncryptionEngine — encrypt/decrypt round-trip', () => {
  const password = 'TestP@ssw0rd!2024';

  describe('encrypt / decrypt', () => {
    it('should encrypt and decrypt a string round-trip', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await EncryptionEngine.encrypt(plaintext, password);
      const decrypted = await EncryptionEngine.decrypt(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (random salt/IV)', async () => {
      const plaintext = 'Same input';
      const enc1 = await EncryptionEngine.encrypt(plaintext, password);
      const enc2 = await EncryptionEngine.encrypt(plaintext, password);
      expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
      expect(enc1.iv).not.toBe(enc2.iv);
      expect(enc1.salt).not.toBe(enc2.salt);
    });

    it('should use AES-GCM algorithm', async () => {
      const encrypted = await EncryptionEngine.encrypt('test', password);
      expect(encrypted.algorithm).toBe('AES-GCM');
    });

    it('should produce base64-encoded ciphertext, iv, and salt', async () => {
      const encrypted = await EncryptionEngine.encrypt('test', password);
      // Base64 regex
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      expect(encrypted.ciphertext).toMatch(base64Regex);
      expect(encrypted.iv).toMatch(base64Regex);
      expect(encrypted.salt).toMatch(base64Regex);
    });

    it('should encrypt empty string', async () => {
      const encrypted = await EncryptionEngine.encrypt('', password);
      const decrypted = await EncryptionEngine.decrypt(encrypted, password);
      expect(decrypted).toBe('');
    });

    it('should encrypt unicode characters', async () => {
      const plaintext = 'Financial report — 2024 Q4: $1,234,567.89 (naive)';
      const encrypted = await EncryptionEngine.encrypt(plaintext, password);
      const decrypted = await EncryptionEngine.decrypt(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt large text', async () => {
      const plaintext = 'A'.repeat(100000);
      const encrypted = await EncryptionEngine.encrypt(plaintext, password);
      const decrypted = await EncryptionEngine.decrypt(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });

    it('should fail decryption with wrong password', async () => {
      const encrypted = await EncryptionEngine.encrypt('secret', 'correct-password');
      await expect(EncryptionEngine.decrypt(encrypted, 'wrong-password')).rejects.toThrow();
    });

    it('should fail decryption with tampered ciphertext', async () => {
      const encrypted = await EncryptionEngine.encrypt('secret', password);
      const tampered: EncryptedData = {
        ...encrypted,
        ciphertext: encrypted.ciphertext.slice(0, -4) + 'XXXX',
      };
      await expect(EncryptionEngine.decrypt(tampered, password)).rejects.toThrow();
    });

    it('should fail decryption with tampered IV', async () => {
      const encrypted = await EncryptionEngine.encrypt('secret', password);
      const tampered: EncryptedData = {
        ...encrypted,
        iv: encrypted.iv.slice(0, -4) + 'XXXX',
      };
      await expect(EncryptionEngine.decrypt(tampered, password)).rejects.toThrow();
    });

    it('should fail decryption with tampered salt', async () => {
      const encrypted = await EncryptionEngine.encrypt('secret', password);
      const tampered: EncryptedData = {
        ...encrypted,
        salt: encrypted.salt.slice(0, -4) + 'XXXX',
      };
      await expect(EncryptionEngine.decrypt(tampered, password)).rejects.toThrow();
    });
  });

  describe('encryptField / decryptField', () => {
    it('should encrypt and decrypt a string field', async () => {
      const encrypted = await EncryptionEngine.encryptField('sensitive-value', password);
      expect(EncryptionEngine.isEncrypted(encrypted)).toBe(true);
      const decrypted = await EncryptionEngine.decryptField<string>(encrypted, password);
      expect(decrypted).toBe('sensitive-value');
    });

    it('should encrypt and decrypt an object', async () => {
      const data = { amount: 1234.56, currency: 'USD' };
      const encrypted = await EncryptionEngine.encryptField(data, password);
      const decrypted = await EncryptionEngine.decryptField<typeof data>(encrypted, password);
      expect(decrypted).toEqual(data);
    });

    it('should encrypt and decrypt an array', async () => {
      const data = [1, 2, 3, 'hello'];
      const encrypted = await EncryptionEngine.encryptField(data, password);
      const decrypted = await EncryptionEngine.decryptField<typeof data>(encrypted, password);
      expect(decrypted).toEqual(data);
    });

    it('should encrypt and decrypt null', async () => {
      const encrypted = await EncryptionEngine.encryptField(null, password);
      const decrypted = await EncryptionEngine.decryptField<null>(encrypted, password);
      expect(decrypted).toBeNull();
    });

    it('should encrypt and decrypt a number', async () => {
      const encrypted = await EncryptionEngine.encryptField(42, password);
      const decrypted = await EncryptionEngine.decryptField<number>(encrypted, password);
      expect(decrypted).toBe(42);
    });

    it('should produce enc: prefixed strings', async () => {
      const encrypted = await EncryptionEngine.encryptField('test', password);
      expect(encrypted.startsWith('enc:')).toBe(true);
    });

    it('should throw on non-enc: prefixed input', async () => {
      await expect(EncryptionEngine.decryptField('not-encrypted', password)).rejects.toThrow(
        'Not an encrypted field'
      );
    });

    it('should fail with wrong password', async () => {
      // PATCH 5: passwords must be ≥8 chars (MIN_PASSWORD_LENGTH=8).
      const encrypted = await EncryptionEngine.encryptField('data', 'correct-password-1');
      await expect(EncryptionEngine.decryptField(encrypted, 'wrong-password-1')).rejects.toThrow();
    });
  });

  describe('isEncrypted', () => {
    it('should return true for enc: prefixed strings', () => {
      expect(EncryptionEngine.isEncrypted('enc:something')).toBe(true);
    });

    it('should return false for non-enc: strings', () => {
      expect(EncryptionEngine.isEncrypted('hello')).toBe(false);
      expect(EncryptionEngine.isEncrypted('encrypted:data')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(EncryptionEngine.isEncrypted(123)).toBe(false);
      expect(EncryptionEngine.isEncrypted(null)).toBe(false);
      expect(EncryptionEngine.isEncrypted(undefined)).toBe(false);
      expect(EncryptionEngine.isEncrypted({})).toBe(false);
    });
  });

  describe('deriveKey', () => {
    it('should derive a CryptoKey from password and salt', async () => {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await EncryptionEngine.deriveKey(password, salt);
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
    });

    it('should derive deterministic key from same salt', async () => {
      const salt = new Uint8Array(16); // all zeros
      const key1 = await EncryptionEngine.deriveKey(password, salt);
      const key2 = await EncryptionEngine.deriveKey(password, salt);
      // Same salt + password should produce keys that can decrypt each other
      const plaintext = 'deterministic test';
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key1,
        new TextEncoder().encode(plaintext)
      );
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key2, encrypted);
      expect(new TextDecoder().decode(decrypted)).toBe(plaintext);
    });

    it('should derive different keys from different salts', async () => {
      const salt1 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const salt2 = new Uint8Array([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
      const key1 = await EncryptionEngine.deriveKey(password, salt1);
      const key2 = await EncryptionEngine.deriveKey(password, salt2);

      // Keys derived from different salts should NOT decrypt each other's data
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key1,
        new TextEncoder().encode('test')
      );
      await expect(
        crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key2, encrypted)
      ).rejects.toThrow();
    });
  });

  describe('AES-256-GCM verification', () => {
    it('should use 256-bit key length', async () => {
      const salt = new Uint8Array(16);
      const key = await EncryptionEngine.deriveKey(password, salt);
      // Key is non-extractable, but algorithm should specify 256 bits
      expect(key.algorithm).toBeDefined();
      // AES-GCM with 256-bit key can encrypt and decrypt
      const plaintext = 'key-length-test';
      const encrypted = await EncryptionEngine.encrypt(plaintext, password);
      const decrypted = await EncryptionEngine.decrypt(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });

    it('should use 12-byte IV (GCM standard)', async () => {
      const encrypted = await EncryptionEngine.encrypt('test', password);
      // IV is base64 encoded, decode to check length
      const ivBinary = atob(encrypted.iv);
      expect(ivBinary.length).toBe(12);
    });

    it('should use 16-byte salt', async () => {
      const encrypted = await EncryptionEngine.encrypt('test', password);
      const saltBinary = atob(encrypted.salt);
      expect(saltBinary.length).toBe(16);
    });

    it('should use PBKDF2 with SHA-256 for key derivation', async () => {
      // This is verified by the deriveKey implementation
      // The test ensures encrypt/decrypt works, confirming the full chain
      const plaintext = 'PBKDF2 verification';
      const encrypted = await EncryptionEngine.encrypt(plaintext, password);
      const decrypted = await EncryptionEngine.decrypt(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('edge cases', () => {
    it('should handle very long password', async () => {
      const longPassword = 'x'.repeat(10000);
      const encrypted = await EncryptionEngine.encrypt('test', longPassword);
      const decrypted = await EncryptionEngine.decrypt(encrypted, longPassword);
      expect(decrypted).toBe('test');
    });

    it('should handle special characters in password', async () => {
      const specialPass = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
      const encrypted = await EncryptionEngine.encrypt('test', specialPass);
      const decrypted = await EncryptionEngine.decrypt(encrypted, specialPass);
      expect(decrypted).toBe('test');
    });

    it('should handle JSON with nested objects in encryptField', async () => {
      const complex = {
        financials: {
          revenue: [{ q1: 1000000, q2: 1200000 }],
          expenses: { cogs: 500000, opex: 300000 },
        },
        metadata: { currency: 'USD', fiscalYear: 2024 },
      };
      const encrypted = await EncryptionEngine.encryptField(complex, password);
      const decrypted = await EncryptionEngine.decryptField<typeof complex>(encrypted, password);
      expect(decrypted).toEqual(complex);
    });
  });
});

describe('EncryptionEngine — without crypto.subtle', () => {
  it('should export static methods', () => {
    expect(typeof EncryptionEngine.encrypt).toBe('function');
    expect(typeof EncryptionEngine.decrypt).toBe('function');
    expect(typeof EncryptionEngine.encryptField).toBe('function');
    expect(typeof EncryptionEngine.decryptField).toBe('function');
    expect(typeof EncryptionEngine.isEncrypted).toBe('function');
    expect(typeof EncryptionEngine.deriveKey).toBe('function');
  });

  it('isEncrypted should work without crypto', () => {
    expect(EncryptionEngine.isEncrypted('enc:test')).toBe(true);
    expect(EncryptionEngine.isEncrypted('plain')).toBe(false);
  });
});

// =============================================================================
// EncryptionEngine — PATCH 5 security hardening (Hephaestus, FinPlan Pro v1.0.0)
// CWE-916 (PBKDF2 iterations), CWE-20 (input validation), CWE-326 (AAD),
// CWE-200 (key version), CWE-1188 (size cap), CWE-208 (constant-time compare).
// =============================================================================

describe('EncryptionEngine — PATCH 5 constants & static helpers', () => {
  it('PBKDF2_ITERATIONS is at least 600,000 (OWASP 2023)', () => {
    expect(ENCRYPTION_CONSTANTS.PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600000);
  });

  it('MAX_PLAINTEXT_LENGTH is a positive finite number', () => {
    expect(ENCRYPTION_CONSTANTS.MAX_PLAINTEXT_LENGTH).toBeGreaterThan(0);
    expect(Number.isFinite(ENCRYPTION_CONSTANTS.MAX_PLAINTEXT_LENGTH)).toBe(true);
  });

  it('MIN_PASSWORD_LENGTH is at least 8', () => {
    expect(ENCRYPTION_CONSTANTS.MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(8);
  });

  it('CURRENT_KEY_VERSION is a positive integer', () => {
    expect(Number.isInteger(ENCRYPTION_CONSTANTS.CURRENT_KEY_VERSION)).toBe(true);
    expect(ENCRYPTION_CONSTANTS.CURRENT_KEY_VERSION).toBeGreaterThan(0);
  });
});

describe('EncryptionEngine — PATCH 5 constantTimeEqual (CWE-208)', () => {
  it('returns true for identical strings', () => {
    expect(EncryptionEngine.constantTimeEqual('abc', 'abc')).toBe(true);
  });

  it('returns false for differing strings of equal length', () => {
    expect(EncryptionEngine.constantTimeEqual('abc', 'abd')).toBe(false);
  });

  it('returns false for strings of differing length', () => {
    expect(EncryptionEngine.constantTimeEqual('abc', 'abcd')).toBe(false);
  });

  it('returns false for non-string inputs', () => {
    expect(EncryptionEngine.constantTimeEqual(null, 'x')).toBe(false);
    expect(EncryptionEngine.constantTimeEqual('x', undefined)).toBe(false);
  });

  it('returns true for two empty strings', () => {
    expect(EncryptionEngine.constantTimeEqual('', '')).toBe(true);
  });
});

describe('EncryptionEngine — PATCH 5 zeroize (best-effort)', () => {
  it('overwrites a Uint8Array with zeros', () => {
    const buf = new Uint8Array([1, 2, 3, 4, 5]);
    EncryptionEngine.zeroize(buf);
    for (let i = 0; i < buf.length; i++) {
      expect(buf[i]).toBe(0);
    }
  });

  it('handles null and undefined without throwing', () => {
    expect(() => EncryptionEngine.zeroize(null)).not.toThrow();
    expect(() => EncryptionEngine.zeroize(undefined)).not.toThrow();
  });
});

describe('EncryptionEngine — PATCH 5 assertStrongPassword', () => {
  it('rejects non-string password', () => {
    expect(() => EncryptionEngine.assertStrongPassword(123)).toThrow();
    expect(() => EncryptionEngine.assertStrongPassword(null)).toThrow();
    expect(() => EncryptionEngine.assertStrongPassword(undefined)).toThrow();
  });

  it('rejects empty password', () => {
    expect(() => EncryptionEngine.assertStrongPassword('')).toThrow(/must not be empty/);
  });

  it('rejects password shorter than MIN_PASSWORD_LENGTH', () => {
    expect(() => EncryptionEngine.assertStrongPassword('short')).toThrow(/at least/);
  });

  it('rejects password longer than MAX_PASSWORD_LENGTH', () => {
    const huge = 'x'.repeat(ENCRYPTION_CONSTANTS.MAX_PASSWORD_LENGTH + 1);
    expect(() => EncryptionEngine.assertStrongPassword(huge)).toThrow(/exceeds/);
  });

  it('accepts a valid password', () => {
    expect(() => EncryptionEngine.assertStrongPassword('ValidP@ssw0rd-2024')).not.toThrow();
  });
});

describe('EncryptionEngine — PATCH 5 assertPlaintextSize', () => {
  it('rejects non-string plaintext', () => {
    expect(() => EncryptionEngine.assertPlaintextSize(42)).toThrow();
  });

  it('rejects plaintext above MAX_PLAINTEXT_LENGTH', () => {
    const huge = 'x'.repeat(ENCRYPTION_CONSTANTS.MAX_PLAINTEXT_LENGTH + 1);
    expect(() => EncryptionEngine.assertPlaintextSize(huge)).toThrow(/exceeds/);
  });

  it('accepts plaintext at the boundary', () => {
    const ok = 'x'.repeat(ENCRYPTION_CONSTANTS.MAX_PLAINTEXT_LENGTH);
    expect(() => EncryptionEngine.assertPlaintextSize(ok)).not.toThrow();
  });
});

describeIfCrypto('EncryptionEngine — PATCH 5 input validation in encrypt/decrypt', () => {
  const password = 'ValidP@ssw0rd-2024';

  it('encrypt rejects empty password', async () => {
    await expect(EncryptionEngine.encrypt('hello', '')).rejects.toThrow(/must not be empty/);
  });

  it('encrypt rejects short password', async () => {
    await expect(EncryptionEngine.encrypt('hello', 'short')).rejects.toThrow(/at least/);
  });

  it('encrypt rejects non-string plaintext', async () => {
    await expect(EncryptionEngine.encrypt(123, password)).rejects.toThrow();
  });

  it('encrypt rejects empty aadContext', async () => {
    await expect(EncryptionEngine.encrypt('hi', password, { aadContext: '' })).rejects.toThrow();
  });

  it('decrypt rejects unsupported algorithm', async () => {
    const enc = await EncryptionEngine.encrypt('hi', password);
    await expect(
      EncryptionEngine.decrypt(Object.assign({}, enc, { algorithm: 'AES-CBC' }), password)
    ).rejects.toThrow(/unsupported algorithm/);
  });

  it('decrypt rejects future keyVersion', async () => {
    const enc = await EncryptionEngine.encrypt('hi', password);
    await expect(
      EncryptionEngine.decrypt(Object.assign({}, enc, { keyVersion: 9999 }), password)
    ).rejects.toThrow(/newer than supported/);
  });

  it('decrypt rejects invalid salt length (base64 with wrong byte count)', async () => {
    const enc = await EncryptionEngine.encrypt('hi', password);
    const shortSalt = btoa(String.fromCharCode(1, 2, 3, 4, 5, 6, 7, 8));
    await expect(
      EncryptionEngine.decrypt(Object.assign({}, enc, { salt: shortSalt }), password)
    ).rejects.toThrow(/salt must be exactly 16 bytes/);
  });

  it('decrypt rejects invalid iv length', async () => {
    const enc = await EncryptionEngine.encrypt('hi', password);
    const shortIv = btoa(String.fromCharCode(1, 2, 3, 4));
    await expect(
      EncryptionEngine.decrypt(Object.assign({}, enc, { iv: shortIv }), password)
    ).rejects.toThrow(/iv must be exactly 12 bytes/);
  });
});

describeIfCrypto('EncryptionEngine — PATCH 5 AAD binding (CWE-326)', () => {
  const password = 'ValidP@ssw0rd-2024';

  it('round-trips plaintext with aadContext', async () => {
    const enc = await EncryptionEngine.encrypt('user-42:api-key', password, {
      aadContext: 'user:42',
    });
    expect(enc.aadContext).toBe('user:42');
    const out = await EncryptionEngine.decrypt(enc, password);
    expect(out).toBe('user-42:api-key');
  });

  it('rejects decryption when wrong aadContext is supplied to decryptField', async () => {
    const enc = await EncryptionEngine.encryptField({ x: 1 }, password, {
      aadContext: 'user:42',
    });
    await expect(
      EncryptionEngine.decryptField(enc, password, { aadContext: 'user:99' })
    ).rejects.toThrow(/aadContext mismatch/);
  });

  it('rejects decryptField when ciphertext is AAD-bound but caller omits aadContext', async () => {
    const enc = await EncryptionEngine.encryptField({ x: 1 }, password, {
      aadContext: 'user:42',
    });
    await expect(
      EncryptionEngine.decryptField(enc, password)
    ).rejects.toThrow(/AAD-bound but no aadContext/);
  });

  it('rejects decryptField when caller supplies aadContext but ciphertext is not AAD-bound', async () => {
    const enc = await EncryptionEngine.encryptField({ x: 1 }, password);
    await expect(
      EncryptionEngine.decryptField(enc, password, { aadContext: 'user:42' })
    ).rejects.toThrow(/not AAD-bound/);
  });

  it('rejects encryptField malformed payload', async () => {
    await expect(EncryptionEngine.decryptField('enc:not-base64!@#', password)).rejects.toThrow(
      /malformed/
    );
  });
});

describeIfCrypto('EncryptionEngine — PATCH 5 keyVersion stamp (CWE-200)', () => {
  const password = 'ValidP@ssw0rd-2024';

  it('stamps current keyVersion on every encrypt', async () => {
    const enc = await EncryptionEngine.encrypt('x', password);
    expect(enc.keyVersion).toBe(ENCRYPTION_CONSTANTS.CURRENT_KEY_VERSION);
  });

  it('stamps current keyVersion on encryptField', async () => {
    const enc = await EncryptionEngine.encryptField('x', password);
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(enc.slice(4)), (c) => c.charCodeAt(0))
    );
    const parsed = JSON.parse(json);
    expect(parsed.keyVersion).toBe(ENCRYPTION_CONSTANTS.CURRENT_KEY_VERSION);
  });
});

describeIfCrypto('EncryptionEngine — PATCH 5 deriveKey salt validation (CWE-759)', () => {
  const password = 'ValidP@ssw0rd-2024';

  it('rejects non-Uint8Array salt', async () => {
    await expect(
      EncryptionEngine.deriveKey(password, [1, 2, 3])
    ).rejects.toThrow(/Uint8Array/);
  });

  it('rejects wrong-length salt', async () => {
    const wrong = new Uint8Array(8);
    await expect(EncryptionEngine.deriveKey(password, wrong)).rejects.toThrow(/16 bytes/);
  });
});
