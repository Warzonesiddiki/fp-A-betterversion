import { describe, it, expect, beforeEach } from 'vitest';
import { AllocationRuleEngine } from './AllocationRuleEngine';

describe('AllocationRuleEngine', () => {
  beforeEach(() => {
    AllocationRuleEngine.delete('test-rule-1');
  });

  it('creates a rule', () => {
    const rule = AllocationRuleEngine.create({
      name: 'Test Rule',
      description: 'Test allocation',
      sourceAccount: '5000',
      targets: [
        { accountCode: '5100', percentage: 50 },
        { accountCode: '5200', percentage: 50 },
      ],
      method: 'percentage',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      isActive: true,
      createdBy: 'user1',
    });
    expect(rule.id).toBeDefined();
    expect(rule.name).toBe('Test Rule');
    expect(rule.createdAt).toBeDefined();
  });

  it('gets all rules', () => {
    AllocationRuleEngine.create({
      name: 'Rule 1',
      description: 'First rule',
      sourceAccount: '5000',
      targets: [{ accountCode: '5100', percentage: 100 }],
      method: 'percentage',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      isActive: true,
      createdBy: 'user1',
    });
    const rules = AllocationRuleEngine.getAll();
    expect(rules.length).toBeGreaterThan(0);
  });

  it('allocates by percentage', () => {
    const rule = AllocationRuleEngine.create({
      name: 'Percentage Rule',
      description: 'Allocate by percentage',
      sourceAccount: '5000',
      targets: [
        { accountCode: '5100', percentage: 60 },
        { accountCode: '5200', percentage: 40 },
      ],
      method: 'percentage',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      isActive: true,
      createdBy: 'user1',
    });
    const result = AllocationRuleEngine.allocate(rule.id, 10000);
    expect(result).toBeDefined();
  });

  it('validates a rule', () => {
    const errors = AllocationRuleEngine.validate({
      id: 'test',
      name: '',
      description: '',
      sourceAccount: '',
      targets: [],
      method: 'percentage',
      effectiveFrom: '',
      effectiveTo: '',
      isActive: true,
      createdBy: '',
      createdAt: '',
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
