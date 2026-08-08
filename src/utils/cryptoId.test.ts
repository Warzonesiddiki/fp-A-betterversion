// =============================================================================
// cryptoId unit tests — CSPRNG id generation
// =============================================================================
import { afterAll, describe, expect, it } from 'vitest';
import { randomId } from './cryptoId';

const ORIGINAL_CRYPTO = globalThis.crypto;

afterAll(() => {
  // restore a usable crypto global for other suites
  Object.defineProperty(globalThis, 'crypto', { value: ORIGINAL_CRYPTO, configurable: true });
});

function stubCrypto(c: Partial<Crypto> | undefined) {
  Object.defineProperty(globalThis, 'crypto', {
    value: c,
    configurable: true,
  });
}

describe('randomId', () => {
  it('returns a UUID without a prefix by default', () => {
    const id = randomId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('prefixes the id when a prefix is provided', () => {
    const id = randomId('audit');
    expect(id.startsWith('audit-')).toBe(true);
    expect(id.slice('audit-'.length)).toMatch(/^[0-9a-f]{8}-/);
  });

  it('produces unique ids across repeated calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => randomId()));
    expect(ids.size).toBe(50);
  });

  it('throws when the Web Crypto API is unavailable (no CSPRNG)', () => {
    stubCrypto(undefined);
    expect(() => randomId()).toThrow(/no Web Crypto API/);
  });

  it('throws when crypto.getRandomValues is missing', () => {
    stubCrypto({} as Crypto);
    expect(() => randomId()).toThrow(/no Web Crypto API/);
  });

  it('falls back to hex UUID v4 when randomUUID is not available', () => {
    // Fake a crypto that only supports getRandomValues with deterministic bytes.
    let counter = 0;
    const fakeCrypto = {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = counter++ & 0xff;
        return arr;
      },
    } as unknown as Crypto;
    stubCrypto(fakeCrypto);
    const id = randomId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('prefixes the hex fallback id too', () => {
    const fakeCrypto = {
      getRandomValues: (arr: Uint8Array) => {
        arr.fill(0xab);
        return arr;
      },
    } as unknown as Crypto;
    stubCrypto(fakeCrypto);
    const id = randomId('salt');
    expect(id.startsWith('salt-')).toBe(true);
  });
});
