/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ProfitLossStatement,
  BalanceSheet,
  CashFlowStatement,
  BudgetVsActual,
} from './FinancialStatementTemplates';

describe('ProfitLossStatement', () => {
  it('renders without crashing', () => {
    render(<ProfitLossStatement />);
  });

  it('renders the Income Statement heading', () => {
    render(<ProfitLossStatement />);
    expect(screen.getByText('Income Statement')).toBeInTheDocument();
  });

  it('renders default subtitle with Company and FY 2026', () => {
    render(<ProfitLossStatement />);
    expect(screen.getByText(/Company.*FY 2026.*USD/)).toBeInTheDocument();
  });

  it('renders with custom props', () => {
    render(
      <ProfitLossStatement entity="Acme Corp" period="Q1 2026" currency="EUR" />,
    );
    expect(screen.getByText(/Acme Corp.*Q1 2026.*EUR/)).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<ProfitLossStatement />);
    expect(screen.getByText('Line Item')).toBeInTheDocument();
    expect(screen.getByText('Actual')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Prior Year')).toBeInTheDocument();
  });

  it('renders key financial line items', () => {
    render(<ProfitLossStatement />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Product Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Gross Profit')).toBeInTheDocument();
    expect(screen.getByText('EBITDA')).toBeInTheDocument();
    expect(screen.getByText('Net Income')).toBeInTheDocument();
  });

  it('renders export buttons when onExport is provided', () => {
    const onExport = vi.fn();
    render(<ProfitLossStatement onExport={onExport} />);
    expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /excel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument();
  });

  it('does not render export buttons when onExport is not provided', () => {
    render(<ProfitLossStatement />);
    expect(screen.queryByRole('button', { name: /pdf/i })).not.toBeInTheDocument();
  });

  it('calls onExport with correct format', () => {
    const onExport = vi.fn();
    render(<ProfitLossStatement onExport={onExport} />);
    fireEvent.click(screen.getByRole('button', { name: /pdf/i }));
    expect(onExport).toHaveBeenCalledWith('pdf');
    fireEvent.click(screen.getByRole('button', { name: /excel/i }));
    expect(onExport).toHaveBeenCalledWith('excel');
    fireEvent.click(screen.getByRole('button', { name: /csv/i }));
    expect(onExport).toHaveBeenCalledWith('csv');
  });

  it('renders data values when provided', () => {
    const data = { revenue_actual: 4200000, revenue_budget: 4000000 };
    render(<ProfitLossStatement data={data} />);
    expect(screen.getByText('4,200,000')).toBeInTheDocument();
    expect(screen.getByText('4,000,000')).toBeInTheDocument();
  });
});

describe('BalanceSheet', () => {
  it('renders without crashing', () => {
    render(<BalanceSheet />);
  });

  it('renders the Balance Sheet heading', () => {
    render(<BalanceSheet />);
    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<BalanceSheet />);
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Current Period')).toBeInTheDocument();
    expect(screen.getByText('Prior Period')).toBeInTheDocument();
    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('renders key balance sheet line items', () => {
    render(<BalanceSheet />);
    expect(screen.getByText('ASSETS')).toBeInTheDocument();
    expect(screen.getByText('Cash & Equivalents')).toBeInTheDocument();
    expect(screen.getByText('TOTAL ASSETS')).toBeInTheDocument();
    expect(screen.getByText('LIABILITIES & EQUITY')).toBeInTheDocument();
    expect(screen.getByText('TOTAL LIABILITIES & EQUITY')).toBeInTheDocument();
  });

  it('renders export buttons when onExport is provided', () => {
    const onExport = vi.fn();
    render(<BalanceSheet onExport={onExport} />);
    expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument();
  });
});

describe('CashFlowStatement', () => {
  it('renders without crashing', () => {
    render(<CashFlowStatement />);
  });

  it('renders the Cash Flow Statement heading', () => {
    render(<CashFlowStatement />);
    expect(screen.getByText('Cash Flow Statement')).toBeInTheDocument();
  });

  it('renders quarterly column headers', () => {
    render(<CashFlowStatement />);
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Q2')).toBeInTheDocument();
    expect(screen.getByText('Q3')).toBeInTheDocument();
    expect(screen.getByText('Q4')).toBeInTheDocument();
    expect(screen.getByText('FY')).toBeInTheDocument();
  });

  it('renders key cash flow line items', () => {
    render(<CashFlowStatement />);
    expect(screen.getByText('OPERATING ACTIVITIES')).toBeInTheDocument();
    expect(screen.getByText('Net Income')).toBeInTheDocument();
    expect(screen.getByText('INVESTING ACTIVITIES')).toBeInTheDocument();
    expect(screen.getByText('FINANCING ACTIVITIES')).toBeInTheDocument();
    expect(screen.getByText('ENDING CASH BALANCE')).toBeInTheDocument();
  });
});

describe('BudgetVsActual', () => {
  it('renders without crashing', () => {
    render(<BudgetVsActual />);
  });

  it('renders the Budget vs Actual heading', () => {
    render(<BudgetVsActual />);
    expect(screen.getByText('Budget vs Actual')).toBeInTheDocument();
  });

  it('renders BvA table headers', () => {
    render(<BudgetVsActual />);
    expect(screen.getByText('Line Item')).toBeInTheDocument();
    expect(screen.getByText('Actual')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Variance ($)')).toBeInTheDocument();
    expect(screen.getByText('Variance (%)')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders key BvA line items', () => {
    render(<BudgetVsActual />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Gross Profit')).toBeInTheDocument();
    expect(screen.getByText('EBITDA')).toBeInTheDocument();
    expect(screen.getByText('Net Income')).toBeInTheDocument();
  });

  it('renders data with status badges', () => {
    const data = {
      revenue_actual: 4200000,
      revenue_budget: 4000000,
      revenue_status: 200000,
    };
    render(<BudgetVsActual data={data} />);
    expect(screen.getByText('4,200,000')).toBeInTheDocument();
    expect(screen.getByText('Favorable')).toBeInTheDocument();
  });

  it('renders unfavorable status for negative values', () => {
    const data = {
      revenue_actual: 3800000,
      revenue_budget: 4000000,
      revenue_status: -200000,
    };
    render(<BudgetVsActual data={data} />);
    expect(screen.getByText('Unfavorable')).toBeInTheDocument();
  });
});
