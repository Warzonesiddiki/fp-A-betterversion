import { describe, it, expect } from 'vitest';
import {
  createDriver,
  createChain,
  createHeadcountChain,
  evaluateChain,
} from './OperationalDriverEngine';

describe('OperationalDriverEngine (BATCH-007 — test the untested orphan)', () => {
  it('evaluates a headcount compensation chain: FTE × Salary × Benefits', () => {
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

    const { result, errors } = evaluateChain(chain, drivers, '2026-01');
    expect(errors).toEqual([]);
    expect(result).toBeCloseTo(16_200_000, 0); // 100 × 120,000 × 1.35
  });

  it('reports an error when a chain references a missing driver', () => {
    const chain = createChain('Missing', ['no-such-driver'], 'acct', '2026-01');
    const { result, errors } = evaluateChain(chain, new Map(), '2026-01');
    expect(errors.length).toBe(1);
    expect(result).toBe(1); // product stays at its initial 1 (nothing multiplied)
  });

  it('treats a missing period value as 0 — never a silent NaN', () => {
    const drv = createDriver('server-count', 'Servers', 'count', 'infrastructure');
    const chain = createChain('Infra', [drv.id], 'acct', '2026-01');
    const { result, errors } = evaluateChain(chain, new Map([[drv.id, drv]]), '2026-99');
    expect(errors).toEqual([]);
    expect(result).toBe(0); // no value for the period -> 0, not undefined/NaN
  });
});
