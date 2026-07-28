// src/utils/sha256.test.ts
// F-0015 regression gate: pins the pure-TS SHA-256 against NIST known-answer
// vectors and cross-checks it differentially against Node's crypto.createHash
// on randomized inputs, so a broken implementation cannot reach the audit
// chain undetected.

import { describe, it, expect } from 'vitest';
import { createHash, randomBytes } from 'node:crypto';

import { sha256Hex } from '@/utils/sha256';

describe('sha256Hex — NIST known-answer vectors', () => {
  it('hashes the empty string (single-block edge)', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('hashes "abc" (single block)', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('hashes the 56-byte two-block message', () => {
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'
    );
  });

  it('hashes 1,000,000 × "a" (multi-block streaming stress)', () => {
    expect(sha256Hex('a'.repeat(1_000_000))).toBe(
      'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0'
    );
  });
});

describe('sha256Hex — differential cross-check vs node:crypto', () => {
  const nodeSha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

  it('matches node:crypto across 200 randomized inputs (all padding boundaries)', () => {
    for (let i = 0; i < 200; i++) {
      // Lengths 0..199 bytewise-random content exercises 0x80 padding at every
      // block-boundary position (55/56/63/64 byte edges included).
      const bytes = randomBytes(i);
      const msg = bytes.toString('latin1');
      expect(sha256Hex(msg)).toBe(nodeSha256(msg));
    }
  });

  it('matches node:crypto for multi-byte UTF-8 content', () => {
    const samples = [
      '€100.00 adjustment — 調整 — التعديل',
      'cell revenue/2026Q3 💹 audit',
      '𝕏𝕐𝕑 supplementary-plane characters',
    ];
    for (const s of samples) {
      expect(sha256Hex(s)).toBe(nodeSha256(s));
    }
  });

  it('produces distinct digests for single-bit-different inputs (no structural collapse)', () => {
    const a = sha256Hex('audit-entry-1');
    const b = sha256Hex('audit-entry-2');
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(b).toMatch(/^[0-9a-f]{64}$/);
  });
});
