/**
 * N-0009 regression suite — FX conversion must be decimal-exact.
 *
 * Audit ZCFA-2026-07-29-002 reproduced:
 *     FXEngine.convert(0.07, 'XXX', 'YYY') @ rate 1.1  ->  0.07700000000000001
 * i.e. currency translation used raw IEEE-754 multiplication despite the
 * canonical money primitive existing. FX feeds consolidation and every
 * translated statement, so drift here propagates into reported figures.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { FXEngine } from '../FXEngine';
import { sumMoney, toDecimal } from '@/utils/money';

describe('N-0009: FX conversion exactness', () => {
  beforeEach(() => {
    FXEngine.setRate('XXX', 'YYY', 1.1, '2026-01-01');
    FXEngine.setRate('EUR', 'USD', 1.09, '2026-03-31');
  });

  it('the exact payload the audit reproduced is now exact', () => {
    const out = FXEngine.convert(0.07, 'XXX', 'YYY', '2026-01-01');
    expect(out).toBe(0.077);
    expect(out).not.toBe(0.07 * 1.1); // the old float result
  });

  it('convertExact returns a full-precision Decimal', () => {
    const d = FXEngine.convertExact(0.07, 'XXX', 'YYY', '2026-01-01');
    expect(d.toString()).toBe('0.077');
  });

  it('classic float-drift triples convert exactly', () => {
    // Distinct currency pairs: setRate appends history per pair+date, so
    // reusing one pair would keep returning the first recorded rate.
    const cases: Array<[string, number, number, string]> = [
      ['DR1', 0.1, 3, '0.3'],
      ['DR2', 0.07, 1.1, '0.077'],
      ['DR3', 1.005, 2, '2.01'],
      ['DR4', 2.675, 2, '5.35'],
      ['DR5', 0.615, 100, '61.5'],
    ];
    for (const [pair, amount, rate, expected] of cases) {
      FXEngine.setRate(pair, 'ZZZ', rate, '2026-01-01');
      const d = FXEngine.convertExact(amount, pair, 'ZZZ', '2026-01-01');
      expect(d.toString()).toBe(expected);
    }
  });

  it('repeated conversions do not accumulate drift', () => {
    // 1000 conversions of 0.01 at 1.1 must total exactly 11.
    FXEngine.setRate('CCC', 'DDD', 1.1, '2026-01-01');
    const parts = Array.from({ length: 1000 }, () =>
      FXEngine.convertExact(0.01, 'CCC', 'DDD', '2026-01-01')
    );
    expect(sumMoney(parts).toString()).toBe('11');
  });

  it('same-currency conversion is an exact identity', () => {
    expect(FXEngine.convertExact(1234.56, 'USD', 'USD').toString()).toBe('1234.56');
    expect(FXEngine.convert(1234.56, 'USD', 'USD')).toBe(1234.56);
  });

  it('still rejects hostile amounts rather than returning 0', () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
      expect(() => FXEngine.convert(bad, 'EUR', 'USD', '2026-03-31')).toThrow();
    }
  });

  it('missing rate still throws (F-0001 not regressed)', () => {
    expect(() => FXEngine.convert(100, 'EUR', 'JPY', '2026-03-31')).toThrow();
  });

  it('a translated balance ties to the cent', () => {
    // 3 subsidiary balances translated at 1.09 must sum to the exact total.
    const balances = [1234.56, 7890.12, 4567.89];
    const translated = balances.map((b) => FXEngine.convertExact(b, 'EUR', 'USD', '2026-03-31'));
    const expected = toDecimal(balances.reduce((a, b) => a + b, 0)).times('1.09');
    expect(sumMoney(translated).toFixed(2)).toBe(expected.toFixed(2));
  });
});
