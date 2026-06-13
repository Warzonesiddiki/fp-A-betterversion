import { describe, it, expect } from 'vitest';
import type { GLState, BudgetState, GLEntry, Budget, BudgetStatus } from '@/types';
import { FinanceCopilotEngine } from './FinanceCopilotEngine';

const mockEntries: GLEntry[] = [
  {
    id: 'e1',
    accountId: '4000',
    accountCode: '4000',
    accountName: 'Sales Revenue',
    period: '2024-01',
    periodName: 'January 2024',
    debit: 0,
    credit: 100000,
    netChange: 100000,
    date: '2024-01-15',
    amount: 100000,
    description: 'Sales',
    reference: 'INV-001',
  },
  {
    id: 'e2',
    accountId: '4000',
    accountCode: '4000',
    accountName: 'Sales Revenue',
    period: '2024-02',
    periodName: 'February 2024',
    debit: 0,
    credit: 150000,
    netChange: 150000,
    date: '2024-02-15',
    amount: 150000,
    description: 'Sales',
    reference: 'INV-002',
  },
  {
    id: 'e3',
    accountId: '5000',
    accountCode: '5000',
    accountName: 'Cost of Goods Sold',
    period: '2024-01',
    periodName: 'January 2024',
    debit: 50000,
    credit: 0,
    netChange: -50000,
    date: '2024-01-15',
    amount: 50000,
    description: 'COGS',
    reference: 'INV-003',
  },
  {
    id: 'e4',
    accountId: '6000',
    accountCode: '6000',
    accountName: 'Salaries',
    period: '2024-01',
    periodName: 'January 2024',
    debit: 30000,
    credit: 0,
    netChange: -30000,
    date: '2024-01-15',
    amount: 30000,
    description: 'Payroll',
    reference: 'PAY-001',
  },
  {
    id: 'e5',
    accountId: '6100',
    accountCode: '6100',
    accountName: 'Rent',
    period: '2024-01',
    periodName: 'January 2024',
    debit: 10000,
    credit: 0,
    netChange: -10000,
    date: '2024-01-15',
    amount: 10000,
    description: 'Office rent',
    reference: 'RENT-001',
  },
  {
    id: 'e6',
    accountId: '1000',
    accountCode: '1000',
    accountName: 'Cash',
    period: '2024-01',
    periodName: 'January 2024',
    debit: 0,
    credit: 50000,
    netChange: 50000,
    date: '2024-01-15',
    amount: 50000,
    description: 'Opening cash',
    reference: 'CASH-001',
  },
  {
    id: 'e7',
    accountId: '6000',
    accountCode: '6000',
    accountName: 'Salaries',
    period: '2024-02',
    periodName: 'February 2024',
    debit: 32000,
    credit: 0,
    netChange: -32000,
    date: '2024-02-15',
    amount: 32000,
    description: 'Payroll',
    reference: 'PAY-002',
  },
];

const mockGL = { entries: mockEntries } as unknown as GLState;

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

describe('FinanceCopilotEngine', () => {
  describe('answer', () => {
    it('should answer revenue questions', () => {
      const result = FinanceCopilotEngine.answer('What is total revenue?', { gl: mockGL });
      expect(result.answer).toContain('revenue');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.chartType).toBe('bar');
    });

    it('should answer expense questions', () => {
      const result = FinanceCopilotEngine.answer('What are total expenses?', { gl: mockGL });
      expect(result.answer).toContain('expense');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should answer variance questions', () => {
      const result = FinanceCopilotEngine.answer('What is the variance vs budget?', {
        gl: mockGL,
        budget: mockBudget,
      });
      expect(result.answer).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should answer budget questions', () => {
      const result = FinanceCopilotEngine.answer('How many budgets do we have?', {
        budget: mockBudget,
      });
      expect(result.answer).toContain('1');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle general questions', () => {
      const result = FinanceCopilotEngine.answer('Hello there', {});
      expect(result.answer).toBeDefined();
      expect(result.confidence).toBe(0.5);
    });

    it('should handle missing stores gracefully', () => {
      const result = FinanceCopilotEngine.answer('What is revenue?', {});
      expect(result.answer).toBeDefined();
    });
  });

  describe('suggestChart', () => {
    it('should suggest line chart for trends', () => {
      const result = FinanceCopilotEngine.suggestChart('Show revenue trend over time');
      expect(result?.type).toBe('line');
    });

    it('should suggest pie chart for breakdown', () => {
      const result = FinanceCopilotEngine.suggestChart('Show breakdown by category');
      expect(result?.type).toBe('pie');
    });

    it('should suggest bar chart for comparison', () => {
      const result = FinanceCopilotEngine.suggestChart('Compare actual vs budget');
      expect(result?.type).toBe('bar');
    });

    it('should return null for unmatched questions', () => {
      const result = FinanceCopilotEngine.suggestChart('Hello');
      expect(result).toBeNull();
    });
  });

  describe('margin', () => {
    it('should calculate gross margin from revenue and COGS', () => {
      const result = FinanceCopilotEngine.answer('What is our margin?', { gl: mockGL });
      expect(result.answer).toContain('margin');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.data).toBeDefined();
      const data = result.data as { grossMargin: number; revenue: number; cogs: number };
      expect(data.revenue).toBe(250000);
      expect(data.cogs).toBe(50000);
      expect(data.grossMargin).toBeCloseTo(0.8, 2);
    });

    it('should handle empty GL data for margin', () => {
      const result = FinanceCopilotEngine.answer('Show margin', {});
      expect(result.answer).toContain('No GL data');
    });
  });

  describe('cash position', () => {
    it('should calculate cash balance from cash accounts', () => {
      const result = FinanceCopilotEngine.answer('What is our cash position?', { gl: mockGL });
      expect(result.answer).toContain('Cash position');
      expect(result.confidence).toBeGreaterThan(0.8);
      const data = result.data as { cashBalance: number };
      expect(data.cashBalance).toBe(50000);
    });

    it('should handle empty GL data for cash', () => {
      const result = FinanceCopilotEngine.answer('Show cash balance', {});
      expect(result.answer).toContain('No GL data');
    });
  });

  describe('burn rate', () => {
    it('should calculate monthly burn rate', () => {
      const result = FinanceCopilotEngine.answer('What is our burn rate?', { gl: mockGL });
      expect(result.answer).toContain('burn rate');
      expect(result.confidence).toBeGreaterThan(0.7);
      const data = result.data as { monthlyBurn: number; monthCount: number };
      expect(data.monthCount).toBe(2);
      expect(data.monthlyBurn).toBeGreaterThan(0);
    });

    it('should calculate runway when cash is available', () => {
      const result = FinanceCopilotEngine.answer('What is our runway?', { gl: mockGL });
      expect(result.answer).toContain('Runway');
    });
  });

  describe('top expenses', () => {
    it('should rank expenses by amount', () => {
      const result = FinanceCopilotEngine.answer('What are our top expenses?', { gl: mockGL });
      expect(result.answer).toContain('Top 5 expenses');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.chartType).toBe('pie');
    });

    it('should handle no expense entries', () => {
      const glNoExpense = {
        entries: [{ ...mockEntries[0]!, debit: 0 }],
      } as unknown as GLState;
      const result = FinanceCopilotEngine.answer('top expenses', { gl: glNoExpense });
      expect(result.answer).toContain('No expense entries');
    });
  });

  describe('department breakdown', () => {
    it('should group by department when available', () => {
      const entriesWithDept = mockEntries.map((e) => ({
        ...e,
        department: e.accountCode.startsWith('4') ? 'Sales' : 'Operations',
      }));
      const gl = { entries: entriesWithDept } as unknown as GLState;
      const result = FinanceCopilotEngine.answer('Show by department', { gl });
      expect(result.answer).toContain('Department breakdown');
      expect(result.chartType).toBe('bar');
    });

    it('should handle missing department data', () => {
      const result = FinanceCopilotEngine.answer('by department', { gl: mockGL });
      expect(result.answer).toBeDefined();
    });
  });

  describe('period comparison', () => {
    it('should compare last two periods', () => {
      const result = FinanceCopilotEngine.answer('Compare periods', { gl: mockGL });
      expect(result.answer).toContain('2024-02');
      expect(result.answer).toContain('2024-01');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle single period', () => {
      const singlePeriodGL = {
        entries: [mockEntries[0]],
      } as unknown as GLState;
      const result = FinanceCopilotEngine.answer('compare vs last month', { gl: singlePeriodGL });
      expect(result.answer).toContain('1 period');
    });
  });

  describe('variance calculation', () => {
    it('should calculate variance when both GL and budget data exist', () => {
      const lineItems = [
        {
          id: 'li1',
          budgetId: 'b1',
          accountId: '4000',
          accountName: 'Sales Revenue',
          accountCode: '4000',
          accountType: 'Revenue' as const,
          periodId: '2024-01',
          month: 1,
          amount: 200000,
          formula: null,
          isCalculated: false,
          isLocked: false,
          isReadOnly: false,
          notes: null,
          driverId: null,
          assumptions: null,
          version: 1,
          createdBy: 'user1',
          updatedBy: 'user1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];
      const budgetWithItems = {
        ...mockBudget,
        lineItems,
      } as unknown as BudgetState;
      const result = FinanceCopilotEngine.answer('variance analysis', {
        gl: mockGL,
        budget: budgetWithItems,
      });
      expect(result.answer).toContain('Variance analysis');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle missing data gracefully', () => {
      const result = FinanceCopilotEngine.answer('variance', {});
      expect(result.answer).toContain('No GL or budget data');
    });
  });

  describe('budget utilization', () => {
    it('should show budget summary with utilization', () => {
      const result = FinanceCopilotEngine.answer('budget utilization', { budget: mockBudget });
      expect(result.answer).toContain('1 budget');
      expect(result.confidence).toBeGreaterThan(0.7);
      const data = result.data as { budgetCount: number; totalBudget: number };
      expect(data.budgetCount).toBe(1);
      expect(data.totalBudget).toBe(1000000);
    });

    it('should handle no budgets', () => {
      const result = FinanceCopilotEngine.answer('budget remaining', {});
      expect(result.answer).toContain('No budgets loaded');
    });
  });

  describe('net income', () => {
    it('should calculate net income from GL entries', () => {
      const result = FinanceCopilotEngine.answer('What is net income?', { gl: mockGL });
      expect(result.answer).toContain('income');
      expect(result.confidence).toBeGreaterThan(0.8);
      const data = result.data as { netIncome: number };
      // Credit: 100000 + 150000 + 50000 = 300000, Debit: 50000 + 30000 + 10000 + 32000 = 122000
      expect(data.netIncome).toBe(300000 - 122000);
    });

    it('should show net loss when expenses exceed revenue', () => {
      const lossGL = {
        entries: [
          { ...mockEntries[0], credit: 10000 },
          { ...mockEntries[2], debit: 50000 },
        ],
      } as unknown as GLState;
      const result = FinanceCopilotEngine.answer('net profit', { gl: lossGL });
      expect(result.answer).toContain('loss');
    });
  });
});
