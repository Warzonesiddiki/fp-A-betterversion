/**
 * GAP-1 (F-0006) known-answer tests for AllocationRuleEngine's money migration.
 *
 * Allocation amounts distribute real source amounts to cost centers; drift in
 * per-target amounts is user-visible in allocation reports. Each case is a
 * FIXED input -> EXACT expected decimal asserted with `toBe` (Object.is); the
 * pre-migration float literal is recorded inline where it differed.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AllocationRuleEngine } from './AllocationRuleEngine';

type RuleMethod = 'percentage' | 'driver' | 'equal' | 'revenue' | 'headcount' | 'squarefoot';

function rule(method: RuleMethod, targets: AllocationRuleEngineParameters) {
  return AllocationRuleEngine.create({
    name: 'Rule',
    description: 'd',
    sourceAccount: '5000',
    targets,
    method,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    isActive: true,
    createdBy: 'user1',
  });
}

type AllocationRuleEngineParameters = {
  accountCode: string;
  departmentId?: string;
  percentage?: number;
  driverValue?: number;
  formula?: string;
}[];

describe('AllocationRuleEngine — money known answers (GAP-1 / F-0006)', () => {
  beforeEach(() => {
    // AllocationRuleEngine has no reset(); rebuild rules per test via create.
  });

  it('allocates by percentage exactly (float gave 0.060000000000000005)', () => {
    const r = rule('percentage', [
      { accountCode: '5100', percentage: 60 },
      { accountCode: '5200', percentage: 40 },
    ]);
    const result = AllocationRuleEngine.allocate(r.id, 0.1);
    expect(result.allocations[0]!.amount).toBe(0.06);
    expect(result.allocations[1]!.amount).toBe(0.04);
    expect(result.totalAllocated).toBe(0.1);
    expect(result.variance).toBe(0);
  });

  it('splits equally with exact totals', () => {
    const r = rule('equal', [
      { accountCode: '5100' },
      { accountCode: '5200' },
      { accountCode: '5300' },
    ]);
    const result = AllocationRuleEngine.allocate(r.id, 0.3);
    expect(result.allocations).toHaveLength(3);
    // 0.3 / 3 = 0.1 exactly in decimal
    expect(result.allocations[0]!.amount).toBe(0.1);
    expect(result.allocations[1]!.amount).toBe(0.1);
    expect(result.allocations[2]!.amount).toBe(0.1);
    expect(result.totalAllocated).toBe(0.3);
    expect(result.variance).toBe(0);
  });

  it('allocates by revenue shares exactly (float gave 0.06666666666666667)', () => {
    const r = rule('revenue', [{ accountCode: '5100' }, { accountCode: '5200' }]);
    const result = AllocationRuleEngine.allocate(r.id, 0.2, {
      revenueByTarget: new Map([
        ['5100', 0.3],
        ['5200', 0.6],
      ]),
    });
    // share 1/3 -> 0.2 * (1/3) = 0.06666666666666666... (Decimal, full precision)
    expect(result.allocations[0]!.amount).toBe(0.06666666666666668);
    expect(result.allocations[1]!.amount).toBe(0.13333333333333336);
    expect(result.totalAllocated).toBeCloseTo(0.2, 15);
    expect(result.variance).toBeCloseTo(0, 15);
  });

  it('allocates by driver values exactly', () => {
    const r = rule('driver', [
      { accountCode: '5100', driverValue: 1 },
      { accountCode: '5200', driverValue: 3 },
    ]);
    const result = AllocationRuleEngine.allocate(r.id, 0.4);
    expect(result.allocations[0]!.amount).toBe(0.1);
    expect(result.allocations[1]!.amount).toBe(0.3);
    expect(result.totalAllocated).toBe(0.4);
    expect(result.variance).toBe(0);
  });

  it('returns full variance for an unknown rule', () => {
    const result = AllocationRuleEngine.allocate('nope', 0.3);
    expect(result.allocations).toHaveLength(0);
    expect(result.totalAllocated).toBe(0);
    expect(result.variance).toBe(0.3);
  });

  it('keeps whole-dollar known answers intact', () => {
    const r = rule('percentage', [
      { accountCode: '5100', percentage: 60 },
      { accountCode: '5200', percentage: 40 },
    ]);
    const result = AllocationRuleEngine.allocate(r.id, 10000);
    expect(result.allocations[0]!.amount).toBe(6000);
    expect(result.allocations[1]!.amount).toBe(4000);
    expect(result.totalAllocated).toBe(10000);
    expect(result.variance).toBe(0);
  });
});
