import { describe, it, expect } from 'vitest';
import { resolveTrustProxy } from './env.js';

/** SEC-3: TRUST_PROXY must map cleanly onto Express trust-proxy values. */
describe('resolveTrustProxy (SEC-3)', () => {
  it('returns undefined when unset or empty (Express default preserved)', () => {
    expect(resolveTrustProxy(undefined)).toBeUndefined();
    expect(resolveTrustProxy('')).toBeUndefined();
  });

  it('parses boolean forms', () => {
    expect(resolveTrustProxy('true')).toBe(true);
    expect(resolveTrustProxy('TRUE')).toBe(true);
    expect(resolveTrustProxy('false')).toBe(false);
  });

  it('parses hop counts', () => {
    expect(resolveTrustProxy('1')).toBe(1);
    expect(resolveTrustProxy('2')).toBe(2);
  });

  it('parses comma-separated proxy/subnet lists', () => {
    expect(resolveTrustProxy('10.0.0.1,10.0.0.2')).toEqual(['10.0.0.1', '10.0.0.2']);
    expect(resolveTrustProxy('10.0.0.1, 10.0.0.2')).toEqual(['10.0.0.1', '10.0.0.2']);
  });

  it('keeps a single proxy address as a one-element list', () => {
    expect(resolveTrustProxy('127.0.0.1')).toEqual(['127.0.0.1']);
  });
});
