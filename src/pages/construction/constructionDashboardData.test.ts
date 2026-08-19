import { describe, it, expect } from 'vitest';
import {
  deriveConstructionDashboard,
  parseMoneyText,
  type ChangeOrderInput,
  type CostBreakdownInput,
  type CostLedgerInput,
} from './constructionDashboardData';

describe('parseMoneyText', () => {
  it('parses plain, signed, symbol and grouped amounts', () => {
    expect(parseMoneyText('12000')?.toNumber()).toBe(12000);
    expect(parseMoneyText('$1,250,000')?.toNumber()).toBe(1250000);
    expect(parseMoneyText('-4,500.50')?.toNumber()).toBe(-4500.5);
    expect(parseMoneyText('+$2.4M')?.toNumber()).toBe(2400000);
    expect(parseMoneyText('$142k')?.toNumber()).toBe(142000);
  });

  it('returns null instead of coercing bad rows to zero', () => {
    expect(parseMoneyText('')).toBeNull();
    expect(parseMoneyText('TBD')).toBeNull();
    expect(parseMoneyText('$1.2.3')).toBeNull();
  });
});

const BREAKDOWN: CostBreakdownInput[] = [
  { name: 'Concrete', budget: 500000, actual: 460000 },
  { name: 'Steel', budget: 300000, actual: 330000 },
];

const CHANGE_ORDERS: ChangeOrderInput[] = [
  {
    id: 'co1',
    project: 'Downtown Plaza',
    description: 'Scope increase',
    amount: '$25,000',
    status: 'Approved',
  },
  {
    id: 'co2',
    project: 'Downtown Plaza',
    description: 'Acceleration',
    amount: '10000',
    status: 'Pending',
  },
  {
    id: 'co3',
    project: 'Skyway',
    description: 'Unreadable',
    amount: 'TBD',
    status: 'Approved',
  },
];

const LEDGER: CostLedgerInput[] = [
  {
    id: 'l1',
    code: '03-100',
    category: 'Concrete',
    budget: '$500,000',
    actual: '$460,000',
    variance: '$40,000',
    status: 'Under',
  },
];

describe('deriveConstructionDashboard', () => {
  it('returns null when nothing is recorded', () => {
    expect(deriveConstructionDashboard([], [], [])).toBeNull();
  });

  it('totals the recorded cost breakdown decimally', () => {
    const d = deriveConstructionDashboard(BREAKDOWN, [], [])!;
    expect(d.totalBudget).toBe(800000);
    expect(d.totalActual).toBe(790000);
    expect(d.totalVariance).toBe(10000); // budget − actual, positive = under
    expect(d.breakdown[1]!.variance).toBe(-30000); // Steel is over budget
  });

  it('sums only parseable approved change orders and counts the rest', () => {
    const d = deriveConstructionDashboard([], CHANGE_ORDERS, [])!;
    expect(d.approvedChangeOrderTotal).toBe(25000);
    expect(d.pendingChangeOrders).toBe(1);
    expect(d.unparseableAmounts).toBe(1); // the 'TBD' approved amount
  });

  it('counts unparseable ledger amounts without dropping the rows', () => {
    const badRow: CostLedgerInput = {
      id: 'l2',
      code: '05-200',
      category: 'Steel',
      budget: 'TBD',
      actual: '$1,000',
      variance: '',
      status: 'Over',
    };
    const d = deriveConstructionDashboard([], [], [...LEDGER, badRow])!;
    expect(d.costLedgerRows).toHaveLength(2);
    // Only the 'TBD' budget fails to parse; '$1,000' actual is fine and
    // variance strings are never parsed (they display as recorded).
    expect(d.unparseableAmounts).toBe(1);
  });

  it('emits null approved total when no approved change order parses', () => {
    const rejected: ChangeOrderInput[] = [
      {
        id: 'co9',
        project: 'X',
        description: 'd',
        amount: '5000',
        status: 'Rejected',
      },
    ];
    const d = deriveConstructionDashboard([], rejected, [])!;
    expect(d.approvedChangeOrderTotal).toBeNull();
  });
});
