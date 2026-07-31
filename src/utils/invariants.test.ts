import { describe, it, expect } from 'vitest';
import { assertInvariant, InvariantViolationError } from './invariants';

describe('assertInvariant (Omega Protocol §1)', () => {
  it('is silent when the condition holds', () => {
    expect(() => assertInvariant(true, 'C-1', 'must hold')).not.toThrow();
  });

  it('throws InvariantViolationError when the condition is violated', () => {
    expect(() => assertInvariant(false, 'C-1', 'sum drift')).toThrow(InvariantViolationError);
  });

  it('encodes the invariant code and a readable message in the error', () => {
    try {
      assertInvariant(false, 'C-7', 'allocated parts must sum to parent');
      throw new Error('should have thrown');
    } catch (e) {
      const err = e as InvariantViolationError;
      expect(err).toBeInstanceOf(InvariantViolationError);
      expect(err.code).toBe('C-7');
      expect(err.name).toBe('InvariantViolationError');
      expect(err.message).toBe('[INVARIANT VIOLATION C-7]: allocated parts must sum to parent');
    }
  });

  it('narrows the asserted value via asserts-condition (type-level + runtime)', () => {
    const maybe: string | null = 'x';
    assertInvariant(maybe !== null, 'N-1', 'must be non-null');
    // After the assert, `maybe` is narrowed to string — used directly:
    expect(maybe.length).toBe(1);
  });
});
