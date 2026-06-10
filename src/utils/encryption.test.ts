import { describe, it, expect } from 'vitest';
import {
  generateKey,
  exportKey,
  importKey,
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
} from './encryption';

describe('encryption', () => {
  it('should generate a valid CryptoKey', async () => {
    const key = await generateKey();
    expect(key).toBeInstanceOf(CryptoKey);
    expect(key.algorithm).toEqual({ name: 'AES-GCM', length: 256 });
    expect(key.usages).toContain('encrypt');
    expect(key.usages).toContain('decrypt');
  });

  it('should export and reimport a key', async () => {
    const key = await generateKey();
    const exported = await exportKey(key);

    expect(typeof exported).toBe('string');
    expect(exported.length).toBeGreaterThan(0);

    const imported = await importKey(exported);
    expect(imported).toBeInstanceOf(CryptoKey);
    expect(imported.algorithm).toEqual({ name: 'AES-GCM', length: 256 });
  });

  it('should encrypt and decrypt a string', async () => {
    const key = await generateKey();
    const plaintext = 'Hello, World!';

    const ciphertext = await encrypt(plaintext, key);
    expect(typeof ciphertext).toBe('string');
    expect(ciphertext).not.toBe(plaintext);

    const decrypted = await decrypt(ciphertext, key);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertext for same plaintext (random IV)', async () => {
    const key = await generateKey();
    const plaintext = 'same text';

    const ct1 = await encrypt(plaintext, key);
    const ct2 = await encrypt(plaintext, key);

    expect(ct1).not.toBe(ct2);
  });

  it('should encrypt and decrypt an object', async () => {
    const key = await generateKey();
    const obj = { name: 'Test', amount: 42000, nested: { arr: [1, 2, 3] } };

    const ciphertext = await encryptObject(obj, key);
    const decrypted = await decryptObject<typeof obj>(ciphertext, key);

    expect(decrypted).toEqual(obj);
  });

  it('should handle empty string', async () => {
    const key = await generateKey();
    const ciphertext = await encrypt('', key);
    const decrypted = await decrypt(ciphertext, key);
    expect(decrypted).toBe('');
  });

  it('should handle unicode characters', async () => {
    const key = await generateKey();
    const plaintext = 'こんにちは 🌍 café résumé';

    const ciphertext = await encrypt(plaintext, key);
    const decrypted = await decrypt(ciphertext, key);
    expect(decrypted).toBe(plaintext);
  });

  it('should handle large payloads', async () => {
    const key = await generateKey();
    const plaintext = 'x'.repeat(100_000);

    const ciphertext = await encrypt(plaintext, key);
    const decrypted = await decrypt(ciphertext, key);
    expect(decrypted).toBe(plaintext);
  });

  it('should fail to decrypt with wrong key', async () => {
    const key1 = await generateKey();
    const key2 = await generateKey();
    const plaintext = 'secret data';

    const ciphertext = await encrypt(plaintext, key1);

    await expect(decrypt(ciphertext, key2)).rejects.toThrow();
  });

  it('should fail to decrypt tampered ciphertext', async () => {
    const key = await generateKey();
    const ciphertext = await encrypt('hello', key);

    // Tamper with the ciphertext
    const tampered = ciphertext.slice(0, -4) + 'XXXX';
    await expect(decrypt(tampered, key)).rejects.toThrow();
  });
});
