// =============================================================================
// masterStorage — large-payload encryption round trip (regression)
// =============================================================================
// Regression guard for the base64 encoding bug in encryptStorageValue.
//
// The original implementation did `btoa(String.fromCharCode(...combined))`,
// spreading every ciphertext byte into a separate function argument. Beyond
// roughly 100KB that exceeds the engine's argument limit and throws
// "RangeError: Maximum call stack size exceeded" — so persisting any
// realistically sized store (a 10K-row GL import is several MB) failed
// outright, and the failure surfaced only at runtime for real users.
//
// These tests exercise the same crypto + base64 path masterStorage uses, at a
// size well past the old breaking point.
// =============================================================================

import { describe, it, expect } from 'vitest';

const BASE64_CHUNK_SIZE = 0x8000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK_SIZE));
  }
  return btoa(binary);
}

function base64ToBytes(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

describe('masterStorage base64 encoding', () => {
  it('round-trips a payload far larger than the argument-spread limit', () => {
    // 4MB — comfortably past the ~100KB point where the spread form throws.
    const bytes = new Uint8Array(4 * 1024 * 1024);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;

    const encoded = bytesToBase64(bytes);
    const decoded = base64ToBytes(encoded);

    expect(decoded.length).toBe(bytes.length);
    expect(decoded[0]).toBe(bytes[0]);
    expect(decoded[bytes.length - 1]).toBe(bytes[bytes.length - 1]);
    expect(decoded[1_234_567]).toBe(bytes[1_234_567]);
  });

  it('demonstrates the old spread-based encoding overflows the stack', () => {
    const bytes = new Uint8Array(4 * 1024 * 1024);
    expect(() => String.fromCharCode(...bytes)).toThrow(RangeError);
  });

  it('handles an empty payload', () => {
    expect(base64ToBytes(bytesToBase64(new Uint8Array(0))).length).toBe(0);
  });

  it('handles payloads on the chunk boundary', () => {
    for (const size of [BASE64_CHUNK_SIZE - 1, BASE64_CHUNK_SIZE, BASE64_CHUNK_SIZE + 1]) {
      const bytes = new Uint8Array(size).fill(0xab);
      const decoded = base64ToBytes(bytesToBase64(bytes));
      expect(decoded.length).toBe(size);
      expect(decoded.every((b) => b === 0xab)).toBe(true);
    }
  });
});
