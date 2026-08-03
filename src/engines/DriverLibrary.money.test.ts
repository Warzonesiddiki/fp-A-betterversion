/**
 * GAP-1 (F-0006) known-answer tests for DriverLibrary's money migration.
 *
 * cascadeChange scales linkedLineItems that are currency (revenue/cost).
 * Exact toBe assertions; pre-migration float literals recorded where drift occurred.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { DriverLibrary } from './DriverLibrary';

describe('DriverLibrary — money known answers (GAP-1 / F-0006)', () => {
  beforeEach(() => {
    DriverLibrary.initialize();
  });

  it('scales the linked revenue amount exactly and leaves an unlinked cost unchanged', () => {
    DriverLibrary.updateDriver('revenue-growth', 5, 'u1', 'test');
    const lineItems = { revenue: 1000, cogs: 600 };
    const scaled = DriverLibrary.cascadeChange('revenue-growth', lineItems);

    expect(scaled.revenue).toBe(1050);
    expect(scaled.cogs).toBe(600);
  });

  it('rounds a small currency result to cents (old float: 0.10500000000000001)', () => {
    DriverLibrary.updateDriver('price-increase', 5, 'u1', 'test');
    const lineItems = { revenue: 0.1 };
    const scaled = DriverLibrary.cascadeChange('price-increase', lineItems);

    expect(scaled.revenue).toBe(0.11);
  });

  it('scales linked inflation cost and leaves unrelated items unchanged', () => {
    DriverLibrary.updateDriver('inflation', 3, 'u1', 'test');
    const lineItems = { cogs: 1000, unrelated: 50 };
    const scaled = DriverLibrary.cascadeChange('inflation', lineItems);

    expect(scaled.cogs).toBe(1030);
    expect(scaled.unrelated).toBe(50);
  });
});
