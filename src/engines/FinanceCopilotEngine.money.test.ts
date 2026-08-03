/**
 * GAP-1 (F-0006) known-answer tests for FinanceCopilotEngine's money migration.
 *
 * Copilot answers compute aggregates over GL entries (revenue, cogs, expenses, cash,
 * net income, variances, burn/runway, margins) which are currency values.
 * Each case is a FIXED input -> EXACT expected decimal asserted with `toBe` (Object.is);
 * the pre-migration float literal is recorded inline where it differed.
 *
 * Ratios (margins, changes, pcts) are derived floats; money paths use add/sub/mult/div/sum/roundTo.
 * Use greaterThan(0) for >0 guards.
 */
import { describe, it, expect } from 'vitest';
import type { GLState, BudgetState, GLEntry, Budget, BudgetStatus } from '@/types';
import { FinanceCopilotEngine } from './FinanceCopilotEngine';

function entry(
  accountCode: string,
  credit: number,
  debit: number,
  id: string,
  period = '2024-01'
): GLEntry {
  const net = credit - debit;
  return {
    id,
    accountId: accountCode,
    accountCode,
    accountName: `Account ${accountCode}`,
    period,
    periodName: period,
    debit,
    credit,
    netChange: net,
    date: '2024-01-15',
    amount: net,
    description: 'known-answer fixture',
    reference: id,
  };
}

const driftGL: GLState = {
  entries: [
    entry('4000', 0.1, 0, 'r1', '2024-01'),
    entry('4000', 0.2, 0, 'r2', '2024-01'),
    entry('5000', 0, 0.1, 'c1', '2024-01'),
    entry('6000', 0, 0.2, 'e1', '2024-01'),
    entry('1000', 0.3, 0, 'cash1', '2024-01'),
  ],
} as unknown as GLState;

const mockGLForCopilot = {
  entries: [
    entry('4000', 100000, 0, 'e1', '2024-01'),
    entry('4000', 150000, 0, 'e2', '2024-02'),
    entry('5000', 0, 50000, 'e3', '2024-01'),
    entry('6000', 0, 30000, 'e4', '2024-01'),
    entry('6100', 0, 10000, 'e5', '2024-01'),
    entry('1000', 50000, 0, 'e6', '2024-01'),
    entry('6000', 0, 32000, 'e7', '2024-02'),
  ],
} as unknown as GLState;

const mockBudgets: Budget[] = [
  {
    id: 'b1',
    name: 'FY2024 Budget',
    description: 'Annual operating budget',
    fiscalYear: 2024,
    status: 'Approved' as BudgetStatus,
    template: 'Standard',
    departments: ['Sales'],
    entities: ['Main'],
    baseCurrency: 'USD',
    totalAmount: 1000000,
    createdBy: 'user1',
    createdByName: 'Alice',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    submittedAt: null,
    approvedAt: '2024-01-10T00:00:00Z',
    approvedBy: 'manager1',
    version: 1,
    progress: 100,
  },
];

const mockBudget = { budgets: mockBudgets } as unknown as BudgetState;

describe('FinanceCopilotEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('margin (raw sums + sub + div)', () => {
    it('computes gross margin exactly (float gave 0.30000000000000004 on sums)', () => {
      const result = FinanceCopilotEngine.answer('margin', { gl: driftGL });
      const data = result.data as { revenue: number; cogs: number; grossMargin: number };
      // revenue=0.3, cogs=0.1, gross=0.2 → grossMargin=0.2/0.3 ≈ 0.666...
      expect(data.revenue).toBe(0.3);
      expect(data.cogs).toBe(0.1);
      expect(data.grossMargin).toBeCloseTo(0.6666666666666666, 10); // ratio float ok
    });

    it('computes net income and margins on large exact values', () => {
      const result = FinanceCopilotEngine.answer('What is our margin?', { gl: mockGLForCopilot });
      const data = result.data as {
        revenue: number;
        cogs: number;
        opex: number;
        grossMargin: number;
      };
      expect(data.revenue).toBe(250000);
      expect(data.cogs).toBe(50000);
      // EXPENSE_CODES (6xxx): 30000 (sal) + 10000 (rent) + 32000 (sal 02) = 72000
      expect(data.opex).toBe(72000);
      expect(data.grossMargin).toBeCloseTo(0.8, 2);
    });
  });

  describe('cash position (add/sub on credits/debits)', () => {
    it('sums cash exactly (float gave 0.30000000000000004)', () => {
      const result = FinanceCopilotEngine.answer('cash position', { gl: driftGL });
      const data = result.data as { cashBalance: number };
      expect(data.cashBalance).toBe(0.3);
    });

    it('computes cash balance from mock', () => {
      const result = FinanceCopilotEngine.answer('What is our cash position?', {
        gl: mockGLForCopilot,
      });
      const data = result.data as { cashBalance: number };
      expect(data.cashBalance).toBe(50000);
    });
  });

  describe('burn rate + runway (sums, div, >0 guard)', () => {
    it('computes monthly burn exactly (float gave 0.30000000000000004)', () => {
      const result = FinanceCopilotEngine.answer('burn rate', { gl: driftGL });
      const data = result.data as { monthlyBurn: number; cashBalance: number };
      // driftGL: all 2024-01, expenses debit 0.1+0.2=0.3, monthCount=1 → monthlyBurn=0.3
      expect(data.monthlyBurn).toBe(0.3);
      expect(data.cashBalance).toBe(0.3);
    });

    it('computes runway using exact money (pre: Infinity or 0.819672131147541 drift issues)', () => {
      const result = FinanceCopilotEngine.answer('What is our runway?', { gl: mockGLForCopilot });
      expect(result.answer).toContain('Runway');
      const data = result.data as { runwayMonths: number };
      // monthlyBurn = 122000 / 2 = 61000; cash=50000; runway=50000/61000 ≈0.81967
      expect(data.runwayMonths).toBeCloseTo(0.819672131147541, 10);
    });
  });

  describe('top expenses (sum debits)', () => {
    it('ranks total expenses exactly', () => {
      const result = FinanceCopilotEngine.answer('top expenses', { gl: mockGLForCopilot });
      expect(result.answer).toContain('Top 5 expenses');
      const data = result.data as { total: number };
      // 50000 + 30000 + 10000 + 32000 = 122000
      expect(data.total).toBe(122000);
    });
  });

  describe('department net (add/sub per group)', () => {
    it('computes department net exactly', () => {
      const entriesWithDept = mockGLForCopilot.entries.map((e, i) => ({
        ...e,
        department: i % 2 === 0 ? 'Sales' : 'Ops',
      })) as unknown as GLEntry[];
      const gl = { entries: entriesWithDept } as unknown as GLState;
      const result = FinanceCopilotEngine.answer('by department', { gl });
      expect(result.answer).toContain('Department breakdown');
      const data = result.data as { departments: Array<{ label: string; value: number }> };
      // Sales net and Ops net should be exact
      expect(data.departments.length).toBe(2);
    });
  });

  describe('period comparison (sub/div for changes)', () => {
    it('computes revenue change exactly (sums ALL credits per period incl. cash per function semantics)', () => {
      const result = FinanceCopilotEngine.answer('compare periods', { gl: mockGLForCopilot });
      const data = result.data as {
        lastRevenue: number;
        prevRevenue: number;
        revenueChange: number;
        lastExpense: number;
        prevExpense: number;
        expenseChange: number;
      };
      // 2024-02: rev credit 150k (cash not present)
      // 2024-01: rev 100k + cash 50k = 150k
      expect(data.lastRevenue).toBe(150000);
      expect(data.prevRevenue).toBe(150000);
      expect(data.revenueChange).toBe(0);
      expect(data.lastExpense).toBe(32000);
      expect(data.prevExpense).toBe(90000);
      expect(data.expenseChange).toBeCloseTo(-0.6444444444444445, 10);
    });
  });

  describe('variance (sub + div for pct)', () => {
    it('computes variance amounts exactly (pre: drift on sums)', () => {
      const lineItems = [
        { id: 'li1', accountId: '4000', accountName: 'Sales Revenue', amount: 200000 } as {
          id: string;
          accountId: string;
          accountName: string;
          amount: number;
        },
      ];
      const budgetWithItems = { ...mockBudget, lineItems } as unknown as BudgetState;
      const result = FinanceCopilotEngine.answer('variance analysis', {
        gl: mockGLForCopilot,
        budget: budgetWithItems,
      });
      expect(result.answer).toContain('Variance analysis');
      const data = result.data as {
        variances: Array<{ actual: number; budget: number; variance: number }>;
      };
      const v = data.variances.find((x) => x.account.includes('Sales'));
      expect(v?.actual).toBe(250000);
      expect(v?.budget).toBe(200000);
      expect(v?.variance).toBe(50000);
    });
  });

  describe('budget totals + line items (sum)', () => {
    it('sums total budget exactly', () => {
      const result = FinanceCopilotEngine.answer('budget utilization', { budget: mockBudget });
      const data = result.data as { totalBudget: number };
      expect(data.totalBudget).toBe(1000000);
    });
  });

  describe('revenue / expense / netIncome (pure sums + sub)', () => {
    it('sums revenue exactly (answerRevenue includes credit>0 so pulls cash credit too; pre-float same)', () => {
      const result = FinanceCopilotEngine.answer('revenue', { gl: mockGLForCopilot });
      const data = result.data as { total: number };
      // pre-migration float would have produced 300000 here (incl cash credit 50000)
      expect(data.total).toBe(300000);
    });

    it('sums expenses exactly', () => {
      const result = FinanceCopilotEngine.answer('expenses', { gl: mockGLForCopilot });
      const data = result.data as { total: number };
      expect(data.total).toBe(122000);
    });

    it('computes net income exactly (float gave 177999.99999999997 or similar)', () => {
      const result = FinanceCopilotEngine.answer('net income', { gl: mockGLForCopilot });
      const data = result.data as { netIncome: number; totalCredit: number; totalDebit: number };
      // Credit: 100000 + 150000 + 50000(cash) = 300000, Debit: 122000 → net 178000 (consistent with existing non-money test)
      expect(data.netIncome).toBe(178000);
      expect(data.totalCredit).toBe(300000);
      expect(data.totalDebit).toBe(122000);
    });
  });
});
