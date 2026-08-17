import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import ProjectCostingPage from '@/pages/construction/ProjectCostingPage';
import type { GLEntry } from '@/types';

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: unknown }) => (
    <div data-testid="rc">{children as never}</div>
  ),
  BarChart: ({ children }: { children: unknown }) => <div>{children as never}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/construction/costing']}>
      <ProjectCostingPage />
    </MemoryRouter>
  );
}

const jobEntries = [
  {
    id: '1',
    accountId: '4000',
    accountCode: '4000',
    accountName: 'Contract revenue',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 1000,
    netChange: 1000,
    date: '2026-01-15',
    amount: 1000,
    description: 'Rev',
    reference: '',
  },
  {
    id: '2',
    accountId: '5100',
    accountCode: '5100',
    accountName: 'Direct labor',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 400,
    credit: 0,
    netChange: 400,
    date: '2026-01-15',
    amount: 400,
    description: 'Labor',
    reference: '',
    entityId: 'JOB-01',
  },
] as GLEntry[];

describe('ProjectCostingPage — no fabricated figures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [] });
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('shows empty state and no invented KPIs when the GL is empty', () => {
    renderPage();
    expect(screen.getByText(/No Project Costing Data/i)).toBeInTheDocument();
    const body = document.body.textContent ?? '';
    expect(body).not.toMatch(/\$58\.2M/);
    expect(body).not.toMatch(/92\.4%/);
    expect(body).not.toMatch(/Downtown Plaza/);
    expect(body).not.toMatch(/CO-402/);
  });

  it('renders GL-derived costs instead of invented CSI quotes', () => {
    useGLStore.setState({ entries: jobEntries });
    renderPage();
    expect(screen.getByText(/Project Costing/i)).toBeInTheDocument();
    const body = document.body.textContent ?? '';
    expect(body).toMatch(/\$400/);
    expect(body).toMatch(/\$1,000/);
    expect(body).toMatch(/Direct labor/);
    expect(body).not.toMatch(/\$58\.2M/);
    expect(body).not.toMatch(/Downtown Plaza/);
    expect(body).toMatch(/not derivable/i);
  });
});
