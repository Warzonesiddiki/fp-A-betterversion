import { describe, it, expect } from 'vitest';
import { mockDbFallbackAllowed } from './connection.js';

/**
 * Regression for the 2026-08-09 completion-audit finding: the in-memory mock
 * DB fallback used to be taken silently in EVERY environment, including
 * production — where it meant silent total data loss on restart. The
 * fallback must be refused in production unless explicitly opted into.
 */
describe('mockDbFallbackAllowed', () => {
  it('allows the fallback in development (default)', () => {
    expect(mockDbFallbackAllowed('development', undefined)).toBe(true);
  });

  it('allows the fallback when NODE_ENV is unset (defaults to development)', () => {
    expect(mockDbFallbackAllowed(undefined, undefined)).toBe(true);
  });

  it('allows the fallback in test', () => {
    expect(mockDbFallbackAllowed('test', undefined)).toBe(true);
  });

  it('FORBIDS the fallback in production by default', () => {
    expect(mockDbFallbackAllowed('production', undefined)).toBe(false);
    expect(mockDbFallbackAllowed('production', '')).toBe(false);
    expect(mockDbFallbackAllowed('production', 'false')).toBe(false);
    expect(mockDbFallbackAllowed('production', '0')).toBe(false);
  });

  it('allows the fallback in production only with an explicit opt-in flag', () => {
    expect(mockDbFallbackAllowed('production', 'true')).toBe(true);
    expect(mockDbFallbackAllowed('production', '1')).toBe(true);
  });

  it('is case-sensitive on the flag (no accidental truthy coercion)', () => {
    expect(mockDbFallbackAllowed('production', 'TRUE')).toBe(false);
    expect(mockDbFallbackAllowed('production', 'yes')).toBe(false);
  });
});
