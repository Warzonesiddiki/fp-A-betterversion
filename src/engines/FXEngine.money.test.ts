/**
 * GAP-1 (F-0006) known-answer tests for FXEngine's residual money drift.
 *
 * `translateForConsolidation` (amount × rate) and `calculateCTA` (ASC 830
 * cumulative translation adjustment: amount × (current − historical)) are
 * currency translation — previously raw float products over IEEE-754
 * doubles. FX rates themselves stay metrics. Each fixed input asserts the
 * exact cent result with `toBe`; the pre-migration float output is recorded
 * inline.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { FXEngine } from './FXEngine';

describe('FXEngine — money known answers (GAP-1 / F-0006)', () => {
  beforeEach(() => {
    // Isolate from any state other tests seeded.
    FXEngine.clearRates();
    FXEngine.setRate('EUR', 'USD', 1.1, '2026-01-15');
  });

  it('translates amounts with exact decimal products (old float: 0.11000000000000001)', () => {
    const result = FXEngine.translateForConsolidation({
      amount: 0.1,
      rateType: 'closing',
      entityCurrency: 'EUR',
      parentCurrency: 'USD',
      period: '2026-01',
    });

    expect(result.translated).toBe(0.11);
    expect(result.rateUsed).toBe(1.1);
  });

  it('keeps clean translations exact (control: 1000 × 1.1)', () => {
    const result = FXEngine.translateForConsolidation({
      amount: 1000,
      rateType: 'closing',
      entityCurrency: 'EUR',
      parentCurrency: 'USD',
      period: '2026-01',
    });

    expect(result.translated).toBe(1100);
  });

  it('computes CTA with exact decimal products (old float: 0.030000000000000027)', () => {
    // (1.1 − 1.0) × 0.3: old float 1.1 − 1.0 = 0.10000000000000009, × 0.3 =
    // 0.030000000000000027; exact decimal = 0.03.
    expect(FXEngine.calculateCTA(0.3, 1.1, 1.0)).toBe(0.03);
  });

  it('computes CTA for clean values exactly (control: 1000 × (1.2 − 1.1))', () => {
    expect(FXEngine.calculateCTA(1000, 1.2, 1.1)).toBe(100);
  });
});
