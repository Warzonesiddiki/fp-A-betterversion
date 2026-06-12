/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateKey,
  exportKey,
  importKey,
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
} from '../encryption';

beforeEach(() => {
  const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } } as unknown as CryptoKey;
  const mockSubtle = {
    generateKey: vi.fn().mockResolvedValue(mockKey),
    exportKey: vi.fn().mockResolvedValue(new Uint8Array(32).buffer),
    importKey: vi.fn().mockResolvedValue(mockKey),
    encrypt: vi.fn().mockImplementation(async (_algo, _key, data) => {
      const iv = new Uint8Array(12);
      const combined = new Uint8Array(iv.length + data.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(data), iv.length);
      return combined.buffer;
    }),
    decrypt: vi.fn().mockImplementation(async (_algo, _key, _data) => {
      return new TextEncoder().encode('decrypted data').buffer;
    }),
  };
  const mockCrypto = {
    subtle: mockSubtle,
    getRandomValues: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = i;
      return arr;
    }),
  };
  vi.stubGlobal('crypto', mockCrypto);
});

describe('encryption', () => {
  it('generateKey returns CryptoKey', async () => {
    const key = await generateKey();
    expect(key).toHaveProperty('type', 'secret');
    expect(key).toHaveProperty('algorithm.name', 'AES-GCM');
  });

  it('exportKey returns base64 string', async () => {
    const key = await generateKey();
    const exported = await exportKey(key);
    expect(typeof exported).toBe('string');
    expect(exported.length).toBeGreaterThan(0);
  });

  it('importKey returns CryptoKey', async () => {
    const base64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const key = await importKey(base64);
    expect(key).toHaveProperty('type', 'secret');
  });

  it('encrypt returns base64 string', async () => {
    const key = await generateKey();
    const result = await encrypt('hello', key);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('decrypt returns original string', async () => {
    const key = await generateKey();
    const result = await decrypt('AAAAAAAMAAAAAAAAAAAAAA==', key);
    expect(result).toBe('decrypted data');
  });

  it('encryptObject serializes and encrypts', async () => {
    const key = await generateKey();
    const result = await encryptObject({ foo: 'bar' }, key);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('decryptObject parses decrypted JSON', async () => {
    const key = await generateKey();
    (crypto.subtle as any).decrypt = vi.fn().mockImplementation(async () => {
      return new TextEncoder().encode('{"foo":"bar"}').buffer;
    });
    const result = await decryptObject<{ foo: string }>('test', key);
    expect(result).toEqual({ foo: 'bar' });
  });

  it('importKey handles invalid base64 gracefully', async () => {
    (crypto.subtle as any).importKey = vi.fn().mockRejectedValue(new Error('Invalid key'));
    await expect(importKey('not-valid-base64!')).rejects.toThrow();
  });

  it('decrypt handles corrupted ciphertext', async () => {
    const key = await generateKey();
    (crypto.subtle as any).decrypt = vi.fn().mockRejectedValue(new Error('Decrypt failed'));
    await expect(decrypt('AAAAAAAMAAAAAAAAAAAAAA==', key)).rejects.toThrow();
  });
});
