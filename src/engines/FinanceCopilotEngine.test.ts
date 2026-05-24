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
});
