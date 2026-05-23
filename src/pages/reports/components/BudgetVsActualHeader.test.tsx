import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    HelpCircle: makeIcon(), FileText: makeIcon(), Table: makeIcon(),
    ArrowUpRight: makeIcon(), ArrowDownRight: makeIcon(), Minus: makeIcon(),
  };
});

import { BudgetVsActualHeader } from '@/pages/reports/components/BudgetVsActualHeader';

describe('BudgetVsActualHeader smoke test', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('renders without crashing', () => {
    const { container } = render(
      <BudgetVsActualHeader
        onHelpClick={() => {}}
        onExportPDF={() => {}}
        onExportExcel={() => {}}
      />
    );
    expect(container).toBeTruthy();
  });
  it('displays heading', () => {
    render(
      <BudgetVsActualHeader
        onHelpClick={() => {}}
        onExportPDF={() => {}}
        onExportExcel={() => {}}
      />
    );
    expect(screen.getByRole('heading', { name: /Budget vs Actual/i })).toBeTruthy();
  });
  it('renders export buttons', () => {
    render(
      <BudgetVsActualHeader
        onHelpClick={() => {}}
        onExportPDF={() => {}}
        onExportExcel={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /Export PDF/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Export Excel/i })).toBeTruthy();
  });
});
