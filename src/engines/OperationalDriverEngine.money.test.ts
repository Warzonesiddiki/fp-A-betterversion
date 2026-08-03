/**
 * GAP-1 (F-0006) known-answer tests for OperationalDriverEngine's money migration.
 *
 * Driver-chain products (total compensation and recurring revenue) and
 * sensitivity deltas are currency. Counts, rates, and factors remain
 * non-money inputs. Each fixed case asserts an exact `toBe` answer.
 */

import { fromPrecise } from '@/utils/precisionMath';
import { describe, expect, it } from 'vitest';
import {
  analyzeSensitivity,
  createChain,
  createDriver,
  createHeadcountChain,
  createSaaSRevenueChain,
  evaluateChain,
  evaluateChainPrecise,
} from './OperationalDriverEngine';

describe('OperationalDriverEngine — money known answers (GAP-1 / F-0006)', () => {
  it('evaluates headcount compensation exactly (float could produce 16200000.000000002)', () => {
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
    expect(result).toBe(16200000);
  });

  it('applies churn as a retained share before exact recurring-revenue multiplication (pre-fix: 60025)', () => {
    const customers = createDriver('customer-count', 'Customers', 'count', 'customer-success');
    const arpu = createDriver('custom-metric', 'ARPU', 'USD', 'customer-success');
    const churn = createDriver('churn-rate', 'Churn', 'decimal rate', 'customer-success');

    customers.values.set('2026-01', 1000);
    arpu.values.set('2026-01', 1200.5);
    churn.values.set('2026-01', 0.05);

    const chain = createSaaSRevenueChain(customers.id, arpu.id, churn.id, '2026-01');
    const drivers = new Map([
      [customers.id, customers],
      [arpu.id, arpu],
      [churn.id, churn],
    ]);

    expect(chain.formula).toBe(`[${customers.id}] × [${arpu.id}] × (1 - [${churn.id}])`);
    expect(evaluateChain(chain, drivers, '2026-01').result).toBe(1140475);
    expect(evaluateChainPrecise(chain, drivers, '2026-01').result).toBe(11404750000n);
  });

  it('returns a sensitivity delta as an exact PreciseAmount', () => {
    const fte = createDriver('fte-count', 'FTE', 'count', 'headcount');
    const salary = createDriver('avg-salary', 'Salary', 'USD', 'headcount');
    fte.values.set('2026-01', 10);
    salary.values.set('2026-01', 50000);

    const chain = createChain('Total salary', [fte.id, salary.id], 'total-salary', '2026-01');
    const drivers = new Map([
      [fte.id, fte],
      [salary.id, salary],
    ]);

    const sensitivity = analyzeSensitivity(chain, drivers, fte.id, '2026-01', [10]);
    expect(sensitivity.scenarios[0]!.delta).toBe(500000000n);
    expect(fromPrecise(sensitivity.scenarios[0]!.delta)).toBe(50000);
  });

  it('returns exact zero for a missing period', () => {
    const driver = createDriver('server-count', 'Servers', 'count', 'infrastructure');
    const chain = createChain('Infrastructure', [driver.id], 'infrastructure-cost', '2026-99');

    expect(evaluateChain(chain, new Map([[driver.id, driver]]), '2026-99').result).toBe(0);
  });
});
