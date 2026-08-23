import { describe, it, expect } from 'vitest';
import { evaluateExpression, SafeExpressionError } from './safeExpression';

// =============================================================================
// W6-P0-01 regression support — CSP-safe arithmetic evaluator.
// The old evaluator called `new Function`, which throws EvalError under the
// shipped Tauri CSP; the catch-all then silently returned 0 for every formula.
// =============================================================================

describe('evaluateExpression', () => {
  it('respects operator precedence', () => {
    expect(evaluateExpression('2 + 3 * 4')).toBe(14);
    expect(evaluateExpression('2 * 3 + 4')).toBe(10);
    expect(evaluateExpression('10 / 2 / 5')).toBe(1);
  });

  it('honors parentheses', () => {
    expect(evaluateExpression('(2 + 3) * 4')).toBe(20);
    expect(evaluateExpression('((1 + 1) * (2 + 2))')).toBe(8);
  });

  it('supports unary minus/plus and chained signs', () => {
    expect(evaluateExpression('-5')).toBe(-5);
    expect(evaluateExpression('- -5')).toBe(5);
    expect(evaluateExpression('3 * -2')).toBe(-6);
    expect(evaluateExpression('+5 - -3')).toBe(8);
  });

  it('supports modulo', () => {
    expect(evaluateExpression('10 % 3')).toBe(1);
    expect(evaluateExpression('10 % 4 * 2')).toBe(4);
  });

  it('handles decimal literals', () => {
    expect(evaluateExpression('0.1 + 0.2')).toBeCloseTo(0.30000000000000004, 12);
    expect(evaluateExpression('1234.5678 * 2')).toBeCloseTo(2469.1356, 10);
  });

  it('throws SafeExpressionError on illegal characters (letters, quotes, semicolons)', () => {
    expect(() => evaluateExpression('1 + alert(1)')).toThrow(SafeExpressionError);
    expect(() => evaluateExpression('"use strict"; return 1')).toThrow(SafeExpressionError);
    expect(() => evaluateExpression('1; 2')).toThrow(SafeExpressionError);
  });

  it('throws on unbalanced parentheses and empty input', () => {
    expect(() => evaluateExpression('(1 + 2')).toThrow(SafeExpressionError);
    expect(() => evaluateExpression('1 + 2)')).toThrow(SafeExpressionError);
    expect(() => evaluateExpression('   ')).toThrow(SafeExpressionError);
  });

  it('throws when the result is non-finite (division by zero)', () => {
    expect(() => evaluateExpression('5 / 0')).toThrow(SafeExpressionError);
  });

  it('throws on dangling operators', () => {
    expect(() => evaluateExpression('5 +')).toThrow(SafeExpressionError);
    expect(() => evaluateExpression('* 5')).toThrow(SafeExpressionError);
  });
});
