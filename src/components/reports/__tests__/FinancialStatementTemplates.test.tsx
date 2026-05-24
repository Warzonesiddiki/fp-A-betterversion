import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import {
  ProfitLossStatement,
  BalanceSheet,
  CashFlowStatement,
  BudgetVsActual,
} from '../FinancialStatementTemplates';

const baseProps = { entity: 'Acme', period: 'FY 2026', currency: 'USD' };

describe('ProfitLossStatement', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders P&L', () => {
    render(<ProfitLossStatement {...baseProps} />);
    expect(screen.getByText('Income Statement')).toBeTruthy();
    expect(screen.getByText('Revenue')).toBeTruthy();
    expect(screen.getByText('Total Revenue')).toBeTruthy();
  });
});

describe('BalanceSheet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders balance sheet', () => {
    render(<BalanceSheet {...baseProps} />);
    expect(screen.getByText('Balance Sheet')).toBeTruthy();
    expect(screen.getByText('TOTAL ASSETS')).toBeTruthy();
  });
});

describe('CashFlowStatement', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders cash flow', () => {
    render(<CashFlowStatement {...baseProps} />);
    expect(screen.getByText('Cash Flow Statement')).toBeTruthy();
    expect(screen.getByText('OPERATING ACTIVITIES')).toBeTruthy();
  });
});

describe('BudgetVsActual', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders BvA', () => {
    render(<BudgetVsActual {...baseProps} />);
    expect(screen.getByText('Budget vs Actual')).toBeTruthy();
    expect(screen.getByText('Total Revenue')).toBeTruthy();
  });
});
