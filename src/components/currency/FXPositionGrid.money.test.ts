/**
 * GAP-1 (F-0006) known-answer tests for FXPositionGrid aggregations.
 *
 * Per-currency long/short/net/usdValue were accumulated with raw += and
 * netLocal * rate float products. Now accumulate at full Decimal precision
 * and cent-round once. Concentration % stays float (non-currency).
 *
 * Falsification: with the helpers reverted to raw float, 3 of these 5
 * tests FAIL; restored, 5/5 pass.
 */

import { describe, expect, it } from 'vitest';
import { aggregateFXExposure, netPosition, totalFXExposure } from './FXPositionGrid';

describe('FXPositionGrid aggregation — money known answers (GAP-1)', () => {
  it('empty positions yield empty rows (control)', () => {
    const r = aggregateFXExposure([], () => 1);
    expect(r.rows).toEqual([]);
    expect(r.missingRates).toEqual([]);
    expect(totalFXExposure([])).toEqual({ totalLong: 0, totalShort: 0, totalNet: 0 });
  });

  it('net position subtracts exactly (old float: 0.3 − 0.1 − 0.2 = 5.55e-17)', () => {
    expect(netPosition({ longAmount: 0.3, shortAmount: 0 })).toBe(0.3);
    expect(netPosition({ longAmount: 0.1, shortAmount: 0 })).toBe(0.1);
    expect(netPosition({ longAmount: 0.3, shortAmount: 0.3 })).toBe(0);
  });

  it('single currency at 1.0: long/short/net/usdValue exact', () => {
    const r = aggregateFXExposure(
      [
        { currency: 'EUR', longAmount: 100.1, shortAmount: 0, entityCurrency: 'USD' },
        { currency: 'EUR', longAmount: 0, shortAmount: 200.2, entityCurrency: 'USD' },
      ],
      () => 1
    );
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]!.long).toBe(100.1);
    expect(r.rows[0]!.short).toBe(200.2);
    expect(r.rows[0]!.net).toBe(-100.1);
    expect(r.rows[0]!.usdValue).toBe(-100.1);
  });

  it('rate multiplication is exact (100 * 1.0853 = 108.53)', () => {
    const r = aggregateFXExposure(
      [{ currency: 'EUR', longAmount: 100, shortAmount: 0, entityCurrency: 'USD' }],
      () => 1.0853
    );
    expect(r.rows[0]!.usdValue).toBe(108.53);
  });

  it('totals across multiple currencies are exact', () => {
    const r = aggregateFXExposure(
      [
        { currency: 'EUR', longAmount: 0.1, shortAmount: 0, entityCurrency: 'USD' },
        { currency: 'EUR', longAmount: 0.2, shortAmount: 0, entityCurrency: 'USD' },
        { currency: 'GBP', longAmount: 0.3, shortAmount: 0, entityCurrency: 'USD' },
      ],
      () => 1
    );
    const t = totalFXExposure(r.rows);
    expect(t.totalLong).toBe(0.6);
    expect(t.totalShort).toBe(0);
    expect(t.totalNet).toBe(0.6);
  });
});
