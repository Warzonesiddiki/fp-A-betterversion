/**
 * GAP-1 (F-0006) known-answer tests for BankingDashboard money patterns.
 *
 * BankingDashboard delegates all money computation to BankingEngine
 * (already migrated). The only migration here is the display-only
 * formatPercent toFixed sites → financialFormatting.formatPercent.
 * We verify that formatPercent produces correct output without toFixed.
 */

import { describe, expect, it } from 'vitest';
import { formatPercent } from '@/utils/financialFormatting';

describe('BankingDashboard display patterns — known answers (GAP-1)', () => {
  it('formatPercent produces correct percentage display', () => {
    expect(formatPercent(4.25)).toBe('4.3%');
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(100)).toBe('100.0%');
  });

  it('formatPercent with explicit decimal places', () => {
    expect(formatPercent(4.256, 2)).toBe('4.26%');
    expect(formatPercent(0.1, 2)).toBe('0.10%');
  });

  it('formatPercent rounds half-up correctly', () => {
    // 1.005 should round to 1.01 with half-up at 2 places
    expect(formatPercent(1.005, 2)).toBe('1.01%');
  });
});
