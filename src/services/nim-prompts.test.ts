import { describe, it, expect } from 'vitest';
import {
  variancePrompt,
  forecastPrompt,
  formulaExplanationPrompt,
  budgetSummaryPrompt,
  financialQAPrompt,
} from './nim-prompts';

describe('NIM Prompt Templates', () => {
  describe('variancePrompt', () => {
    it('should generate variance analysis prompt', () => {
      const prompt = variancePrompt({
        metric: 'Revenue',
        actual: 120000,
        budget: 100000,
        period: 'Q3 2026',
      });

      expect(prompt.system).toContain('FP&A analyst');
      expect(prompt.user).toContain('Revenue');
      expect(prompt.user).toContain('Actual: 1');
      expect(prompt.user).toContain('Budget: 1');
      expect(prompt.user).toContain('20.0%');
      expect(prompt.temperature).toBe(0.3);
      expect(prompt.maxTokens).toBe(800);
    });

    it('should include historical context when provided', () => {
      const prompt = variancePrompt({
        metric: 'Revenue',
        actual: 120000,
        budget: 100000,
        period: 'Q3 2026',
        historical: [
          { period: 'Q1 2026', actual: 95000, budget: 90000 },
          { period: 'Q2 2026', actual: 110000, budget: 105000 },
        ],
      });

      expect(prompt.user).toContain('Historical context');
      expect(prompt.user).toContain('Q1 2026');
      expect(prompt.user).toContain('Q2 2026');
    });
  });

  describe('forecastPrompt', () => {
    it('should generate forecast insight prompt', () => {
      const prompt = forecastPrompt({
        metric: 'MRR',
        historicalData: [
          { period: 'Jan', value: 50000 },
          { period: 'Feb', value: 55000 },
          { period: 'Mar', value: 60000 },
        ],
        forecastPeriods: 3,
      });

      expect(prompt.user).toContain('MRR');
      expect(prompt.user).toContain('50,000');
      expect(prompt.user).toContain('3-period forecast');
      expect(prompt.temperature).toBe(0.4);
      expect(prompt.maxTokens).toBe(1000);
    });

    it('should include assumptions when provided', () => {
      const prompt = forecastPrompt({
        metric: 'Revenue',
        historicalData: [{ period: 'Jan', value: 100000 }],
        forecastPeriods: 6,
        assumptions: ['No major market changes', 'Existing customer base stable'],
      });

      expect(prompt.user).toContain('Key assumptions');
      expect(prompt.user).toContain('No major market changes');
    });
  });

  describe('formulaExplanationPrompt', () => {
    it('should generate formula explanation prompt', () => {
      const prompt = formulaExplanationPrompt({
        formula: 'NPV(rate, cashflows)',
        context: 'Used for project evaluation',
        dataType: 'revenue',
      });

      expect(prompt.user).toContain('NPV(rate, cashflows)');
      expect(prompt.user).toContain('Used for project evaluation');
      expect(prompt.user).toContain('revenue');
      expect(prompt.temperature).toBe(0.2);
      expect(prompt.maxTokens).toBe(500);
    });

    it('should work without optional params', () => {
      const prompt = formulaExplanationPrompt({
        formula: 'SUM(A1:A10)',
      });

      expect(prompt.user).toContain('SUM(A1:A10)');
      expect(prompt.user).toContain('What it measures');
    });
  });

  describe('budgetSummaryPrompt', () => {
    it('should generate budget summary prompt', () => {
      const prompt = budgetSummaryPrompt({
        name: 'FY2026 Operating Budget',
        totalRevenue: 5000000,
        totalExpenses: 4200000,
        lineItemCount: 45,
        period: 'FY2026',
        departments: ['Sales', 'Engineering', 'Marketing'],
      });

      expect(prompt.user).toContain('FY2026 Operating Budget');
      expect(prompt.user).toContain('Total Revenue:');
      expect(prompt.user).toContain('Total Expenses:');
      expect(prompt.user).toContain('Net:');
      expect(prompt.user).toContain('Sales, Engineering, Marketing');
      expect(prompt.temperature).toBe(0.3);
    });
  });

  describe('financialQAPrompt', () => {
    it('should generate financial Q&A prompt', () => {
      const prompt = financialQAPrompt({
        question: 'What is our gross margin?',
        context: {
          revenue: 500000,
          expenses: 300000,
          period: 'Q3 2026',
        },
      });

      expect(prompt.user).toContain('What is our gross margin?');
      expect(prompt.user).toContain('Revenue:');
      expect(prompt.user).toContain('Expenses:');
      expect(prompt.user).toContain('Q3 2026');
    });

    it('should include previous period context', () => {
      const prompt = financialQAPrompt({
        question: 'How are we trending?',
        context: {
          revenue: 120000,
          previousPeriod: { revenue: 100000 },
        },
      });

      expect(prompt.user).toContain('Previous period');
      expect(prompt.user).toContain('Revenue:');
    });
  });
});
