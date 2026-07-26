import { describe, expect, it } from 'vitest';
import type { GLAccount } from '@/types';
import {
  getDescendantAccountIds,
  getNormalBalance,
  normalizeAccountType,
  validateChartAccountDraft,
  wouldCreateCircularParent,
} from './chartOfAccounts';

const account = (overrides: Partial<GLAccount>): GLAccount => ({
  id: 'a1',
  code: '1000',
  name: 'Cash',
  type: 'Asset',
  category: 'Current Assets',
  subCategory: '',
  parentId: null,
  level: 0,
  sortOrder: 0,
  isActive: true,
  entityId: 'default',
  departmentId: null,
  isCalculated: false,
  formula: null,
  children: [],
  ...overrides,
});

describe('chart of accounts domain helpers', () => {
  it('normalizes account type aliases', () => {
    expect(normalizeAccountType('sales')).toBe('Revenue');
    expect(normalizeAccountType('operating expense')).toBe('OpEx');
    expect(normalizeAccountType('liabilities')).toBe('Liability');
    expect(normalizeAccountType('bad-type')).toBeNull();
  });

  it('returns normal balance by type', () => {
    expect(getNormalBalance('Asset')).toBe('Debit');
    expect(getNormalBalance('Revenue')).toBe('Credit');
    expect(getNormalBalance('Equity')).toBe('Credit');
  });

  it('detects duplicate codes and invalid codes', () => {
    const accounts = [account({ id: 'existing', code: '4000', type: 'Revenue' })];
    expect(
      validateChartAccountDraft(
        { code: '4000', name: 'Revenue', type: 'Revenue', parentId: null },
        accounts
      ).errors.code
    ).toMatch(/already exists/);
    expect(
      validateChartAccountDraft({ code: 'bad code', name: 'Bad', type: 'Asset' }, []).errors.code
    ).toMatch(/may only contain/);
  });

  it('detects descendant and circular parent relationships', () => {
    const accounts = [
      account({ id: 'root', code: '1000', parentId: null }),
      account({ id: 'child', code: '1100', parentId: 'root' }),
      account({ id: 'grandchild', code: '1110', parentId: 'child' }),
    ];
    expect(getDescendantAccountIds(accounts, 'root')).toEqual(new Set(['child', 'grandchild']));
    expect(wouldCreateCircularParent(accounts, 'root', 'grandchild')).toBe(true);
    expect(wouldCreateCircularParent(accounts, 'child', 'root')).toBe(false);
  });
});
