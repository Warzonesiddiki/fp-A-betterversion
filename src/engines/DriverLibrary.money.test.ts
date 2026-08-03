/**
 * GAP-1 (F-0006) known-answer tests for DriverLibrary's money migration.
 *
 * cascadeChange scales linkedLineItems that are currency (revenue/cost).
 * Exact toBe assertions; pre-migration float literals recorded where drift occurred.
 */
import { describe, it, expect } from 'vitest';
import { DriverLibrary } from './DriverLibrary';

describe('DriverLibrary — money known answers (GAP-1 / F-0006)', () => {
  beforeEach(() => {
    DriverLibrary.initialize();
  });

  it('cascadeChange scales currency items exactly (float gave 1050.0000000000001 etc)', () => {
    DriverLibrary.updateDriver('revenue-growth', 5, 'u1', 'test');
    const lineItems = { revenue: 1000, cogs: 600 };
    const scaled = DriverLibrary.cascadeChange('revenue-growth', lineItems);
    // 1000 * 1.05 = 1050 exact; 600 * 1.05 = 630
    expect(scaled.revenue).toBe(1050);
    expect(scaled.cogs).toBe(630);
  });

  it('cascadeChange on small values without drift (float 1.05 * 0.1 issues)', () => {
    DriverLibrary.updateDriver('price-increase', 5, 'u1', 'test');
    const lineItems = { revenue: 0.1 };
    const scaled = DriverLibrary.cascadeChange('price-increase', lineItems);
    // pre float: 0.1 * 1.05 = 0.10500000000000001 or similar
    expect(scaled.revenue).toBe(0.105);
  });

  it('non-linked items unchanged', () => {
    DriverLibrary.updateDriver('inflation', 3, 'u1', 'test');
    const lineItems = { revenue: 1000, unrelated: 50 };
    const scaled = DriverLibrary.cascadeChange('inflation', lineItems);
    expect(scaled.revenue).toBe(1030);
    expect(scaled.unrelated).toBe(50);
  });
});
