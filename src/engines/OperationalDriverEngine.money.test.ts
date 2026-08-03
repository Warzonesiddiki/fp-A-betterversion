/**
 * GAP-1 (F-0006) known-answer tests for OperationalDriverEngine's money migration.
 *
 * Driver chain products (total compensation, SaaS revenue, etc.) are currency.
 * Each case is a FIXED input -> EXACT expected decimal asserted with `toBe`;
 * the pre-migration float literal is recorded inline where it differed.
 */
import { describe, it, expect } from 'vitest';
import {
  createDriver,
  createHeadcountChain,
  createSaaSRevenueChain,
  evaluateChain,
  analyzeSensitivity,
} from './OperationalDriverEngine';

describe('OperationalDriverEngine — money known answers (GAP-1 / F-0006)', () => {
  it('evaluates headcount chain exactly (float may have had 16200000.000000002)', () => {
    const fte = createDriver('fte-count', 'FTE', 'count', 'headcount');
    const salary = createDriver('avg-salary', 'Avg Salary', 'USD', 'headcount');
    const benefits = createDriver('benefits-multiplier', 'Benefits', 'x', 'headcount');

    fte.values.set('2026-01', 100);
    salary.values.set('2026-01', 120000);
    benefits.values.set('2026-01', 1.35);

    const chain = createHeadcountChain(fte.id, salary.id, benefits.id, '2026-01');
    const drivers = new Map([
      [fte.id, fte],
      [salary.id, salary],
      [benefits.id, benefits],
    ]);

    const { result } = evaluateChain(chain, drivers, '2026-01');
    // 100 * 120000 * 1.35 = 16200000 exactly
    expect(result).toBe(16200000);
  });

  it('evaluates SaaS revenue chain exactly', () => {
    const cust = createDriver('customers', 'Customers', 'count', 'revenue');
    const arpu = createDriver('arpu', 'ARPU', 'USD', 'revenue');
    const churn = createDriver('churn', 'Churn', 'pct', 'revenue');

    cust.values.set('2026-01', 1000);
    arpu.values.set('2026-01', 1200.5);
    churn.values.set('2026-01', 0.05);

    const chain = createSaaSRevenueChain(cust.id, arpu.id, churn.id, '2026-01');
    const drivers = new Map([
      [cust.id, cust],
      [arpu.id, arpu],
      [churn.id, churn],
    ]);

    const { result } = evaluateChain(chain, drivers, '2026-01');
    // 1000 * 1200.5 * 0.95 = 1140475
    expect(result).toBe(1140475);
  });

  it('sensitivity delta exact (money path)', () => {
    const fte = createDriver('fte', 'FTE', 'count', 'headcount');
    const sal = createDriver('sal', 'Salary', 'USD', 'headcount');
    fte.values.set('2026-01', 10);
    sal.values.set('2026-01', 50000);

    const chain = createHeadcountChain(fte.id, sal.id, 'dummy', '2026-01');
    const drivers = new Map([[fte.id, fte], [sal.id, sal]]);

    const sens = analyzeSensitivity(chain, drivers, fte.id, '2026-01', [10]);
    expect(sens.scenarios[0].delta.value).toBe(50000);
  });

  it('returns exact 0 for missing period', () => {
    const drv = createDriver('x', 'X', 'count', 'op');
    const chain = createHeadcountChain(drv.id, 'dummy', 'dummy', '2026-99');
    const { result } = evaluateChain(chain, new Map([[drv.id, drv]]), '2026-99');
    expect(result).toBe(0);
  });
});
