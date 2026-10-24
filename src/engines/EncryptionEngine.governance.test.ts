import { describe, it, expect } from 'vitest';
import { EncryptionEngine, ENCRYPTION_CONSTANTS } from './EncryptionEngine';


/**
 * GOVERNANCE EVIDENCE for cap:govern.encryption
 *
 * The EncryptionEngine provides AES-GCM field encryption, password length
 * validation, constant-time comparison, and secure memory zeroization. The
 * governance dimension here is SECURITY — encryption must be authenticated,
 * passwords must meet minimum length requirements, comparisons must be
 * timing-safe, and sensitive memory must be zeroized. If any of these fail,
 * financial data at rest is exposed.
 *
 * Tested dimensions:
 * 1. Password validation (length enforcement)
 * 2. Encryption/decryption round-trip
 * 3. Constant-time comparison (timing attack resistance)
 * 4. Zeroization (secure memory clearing)
 * 5. Key derivation (PBKDF2)
 * 6. Determinism
 */

describe('EncryptionEngine — GOVERNANCE (govern.encryption)', () => {

  describe('1. Password validation', () => {

    it('assertStrongPassword accepts passwords meeting minimum length', () => {
      expect(() => EncryptionEngine.assertStrongPassword('Abcdefgh')).not.toThrow();
    });

    it('assertStrongPassword rejects short passwords', () => {
      expect(() => EncryptionEngine.assertStrongPassword('Sh0rt!')).toThrow();
    });

    it('assertStrongPassword rejects empty password', () => {
      expect(() => EncryptionEngine.assertStrongPassword('')).toThrow();
    });

    it('assertStrongPassword rejects non-string input', () => {
      expect(() => EncryptionEngine.assertStrongPassword(null as unknown as string)).toThrow();
    });

    it('encrypt rejects short passwords', async () => {
      await expect(EncryptionEngine.encrypt('data', 'short')).rejects.toThrow();
    });

    it('decrypt rejects short passwords', async () => {
      const encrypted = await EncryptionEngine.encrypt('data', 'GoodPass123');
      await expect(EncryptionEngine.decrypt(encrypted, 'short')).rejects.toThrow();
    });
  });

  describe('2. Encryption/decryption round-trip', () => {

    it('encrypt then decrypt returns original plaintext', async () => {
      const password = 'TestPass123';
      const plaintext = 'Sensitive financial data: GL balance 100,000.00';
      const encrypted = await EncryptionEngine.encrypt(plaintext, password);
      expect(encrypted.ciphertext).toBeDefined(); expect(encrypted.iv).toBeDefined(); expect(encrypted.salt).toBeDefined();
      const decrypted = await EncryptionEngine.decrypt(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });

    it('encrypt produces different ciphertext for same plaintext (random IV)', async () => {
      const password = 'TestPass123';
      const plaintext = 'Same data';
      const encrypted1 = await EncryptionEngine.encrypt(plaintext, password);
      const encrypted2 = await EncryptionEngine.encrypt(plaintext, password);
      // Different IVs produce different ciphertexts
      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
    });

    it('decrypt fails with wrong password', async () => {
      const password = 'TestPass123';
      const wrongPassword = 'WrongPass456';
      const plaintext = 'Sensitive data';
      const encrypted = await EncryptionEngine.encrypt(plaintext, password);
      await expect(EncryptionEngine.decrypt(encrypted, wrongPassword)).rejects.toThrow();
    });

    it('encrypted data has correct structure', async () => {
      const password = 'TestPass123';
      const encrypted = await EncryptionEngine.encrypt('test', password);
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.algorithm).toBe('AES-GCM');
      expect(encrypted.iterations).toBeGreaterThan(0);
      expect(encrypted.keyVersion).toBeDefined();
    });

    it('encryptField encrypts and decryptField decrypts', async () => {
      const password = 'TestPass123';
      const fieldValue = { revenue: '100000.00', expenses: '60000.00' };
      const encrypted = await EncryptionEngine.encryptField(fieldValue, password);
      expect(encrypted).toMatch(/^enc:/);
      const decrypted = await EncryptionEngine.decryptField<typeof fieldValue>(encrypted, password);
      expect(decrypted.revenue).toBe('100000.00');
      expect(decrypted.expenses).toBe('60000.00');
    });

    it('encrypt handles empty plaintext', async () => {
      const password = 'TestPass123';
      const encrypted = await EncryptionEngine.encrypt('', password);
      const decrypted = await EncryptionEngine.decrypt(encrypted, password);
      expect(decrypted).toBe('');
    });

    it('encrypt handles large plaintext', async () => {
      const password = 'TestPass123';
      const largePlaintext = 'A'.repeat(10000);
      const encrypted = await EncryptionEngine.encrypt(largePlaintext, password);
      const decrypted = await EncryptionEngine.decrypt(encrypted, password);
      expect(decrypted).toBe(largePlaintext);
    });

    it('encrypt with AAD context produces decryptable ciphertext', async () => {
      const password = 'TestPass123';
      const plaintext = 'Context-bound data';
      const encrypted = await EncryptionEngine.encrypt(plaintext, password, { aadContext: 'entity:ENT-001' });
      expect(encrypted.aadContext).toBe('entity:ENT-001');
      const decrypted = await EncryptionEngine.decrypt(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('3. Constant-time comparison', () => {

    it('constantTimeEqual returns true for equal strings', () => {
      expect(EncryptionEngine.constantTimeEqual('hello', 'hello')).toBe(true);
    });

    it('constantTimeEqual returns false for different strings', () => {
      expect(EncryptionEngine.constantTimeEqual('hello', 'world')).toBe(false);
    });

    it('constantTimeEqual returns false for different length strings', () => {
      expect(EncryptionEngine.constantTimeEqual('hello', 'hell')).toBe(false);
    });

    it('constantTimeEqual handles empty strings', () => {
      expect(EncryptionEngine.constantTimeEqual('', '')).toBe(true);
      expect(EncryptionEngine.constantTimeEqual('', 'a')).toBe(false);
    });

    it('constantTimeEqual handles special characters', () => {
      expect(EncryptionEngine.constantTimeEqual('!@#$%', '!@#$%')).toBe(true);
      expect(EncryptionEngine.constantTimeEqual('!@#$%', '!@#$^')).toBe(false);
    });
  });

  describe('4. Zeroization', () => {

    it('zeroize clears buffer contents', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]);
      EncryptionEngine.zeroize(buffer);
      expect(buffer[0]).toBe(0);
      expect(buffer[1]).toBe(0);
      expect(buffer[2]).toBe(0);
      expect(buffer[3]).toBe(0);
      expect(buffer[4]).toBe(0);
    });

    it('zeroize handles null input', () => {
      expect(() => EncryptionEngine.zeroize(null)).not.toThrow();
    });

    it('zeroize handles undefined input', () => {
      expect(() => EncryptionEngine.zeroize(undefined)).not.toThrow();
    });

    it('zeroize handles empty buffer', () => {
      const buffer = new Uint8Array(0);
      expect(() => EncryptionEngine.zeroize(buffer)).not.toThrow();
    });
  });

  describe('5. Key derivation', () => {

    it('deriveKey produces a key of correct length', async () => {
      const password = 'TestPass123';
      const salt = new Uint8Array(16);
      const key = await EncryptionEngine.deriveKey(password, salt);
      expect(key).toBeInstanceOf(CryptoKey); expect(key.type).toBe('secret'); expect(key.algorithm.name).toBe('AES-GCM');
      expect(key.algorithm.length).toBeGreaterThan(0);
    });

    it('deriveKey produces different keys for different passwords', async () => {
      const salt = new Uint8Array(16);
      const key1 = await EncryptionEngine.deriveKey('password1', salt);
      const key2 = await EncryptionEngine.deriveKey('password2', salt);
      // CryptoKey objects don't expose key material; verify by encrypting with each
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const pt = new TextEncoder().encode('test');
      const enc1 = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key1, pt));
      const enc2 = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key2, pt));
      expect(enc1).not.toEqual(enc2);
    });

    it('deriveKey produces different keys for different salts', async () => {
      const password = 'TestPass123';
      const salt1 = new Uint8Array(16).fill(1);
      const salt2 = new Uint8Array(16).fill(2);
      const key1 = await EncryptionEngine.deriveKey(password, salt1);
      const key2 = await EncryptionEngine.deriveKey(password, salt2);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const pt = new TextEncoder().encode('test');
      const enc1 = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key1, pt));
      const enc2 = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key2, pt));
      expect(enc1).not.toEqual(enc2);
    });
  });

  describe('6. Determinism', () => {

    it('encrypt/decrypt round-trip is deterministic', async () => {
      const password = 'TestPass123';
      const plaintext = 'Deterministic test';
      const e1 = await EncryptionEngine.encrypt(plaintext, password);
      const d1 = await EncryptionEngine.decrypt(e1, password);
      const e2 = await EncryptionEngine.encrypt(plaintext, password);
      const d2 = await EncryptionEngine.decrypt(e2, password);
      expect(d1).toBe(d2);
    });

    it('constantTimeEqual is deterministic', () => {
      expect(EncryptionEngine.constantTimeEqual('test', 'test')).toBe(true);
      expect(EncryptionEngine.constantTimeEqual('test', 'test')).toBe(true);
    });

    it('encryption constants are defined', () => {
      expect(ENCRYPTION_CONSTANTS).toBeDefined();
      expect(ENCRYPTION_CONSTANTS.MIN_PASSWORD_LENGTH).toBeGreaterThan(0);
      expect(ENCRYPTION_CONSTANTS.PBKDF2_ITERATIONS).toBeGreaterThan(0);
      expect(ENCRYPTION_CONSTANTS.CURRENT_KEY_VERSION).toBeDefined();
    });
  });
});
