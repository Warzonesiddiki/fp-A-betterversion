import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import CreditRiskPage from '@/pages/credit/CreditRiskPage';

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    ShieldAlert: makeIcon(),
    Download: makeIcon(),
    Activity: makeIcon(),
    ArrowUpRight: makeIcon(),
    ArrowDownRight: makeIcon(),
    Minus: makeIcon(),
    ChevronUp: makeIcon(),
    ChevronDown: makeIcon(),
    ChevronsUpDown: makeIcon(),
    Search: makeIcon(),
    Filter: makeIcon(),
    MoreHorizontal: makeIcon(),
    ChevronLeft: makeIcon(),
    ChevronRight: makeIcon(),
  };
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/credit']}>
      <CreditRiskPage />
    </MemoryRouter>
  );
}

describe('CreditRiskPage — no fabricated scorecard', () => {
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

  it('displays empty state and no invented EL when the GL is empty', () => {
    renderPage();
    expect(screen.getByText('No Credit Data')).toBeTruthy();
  });

  it('renders posted assets instead of an invented EAD', () => {
    useGLStore.setState({
      entries: [
        {
          id: '1',
          accountId: '1000',
          accountCode: '1000',
          accountName: 'Cash',
          period: '2026-01',
          periodName: 'Jan',
          debit: 850,
          credit: 0,
          netChange: 850,
          date: '2026-01-15',
          amount: 850,
          description: 'Cash',
          reference: '',
          entityId: 'E-1',
        },
        {
          id: '2',
          accountId: '4000',
          accountCode: '4000',
          accountName: 'Revenue',
          period: '2026-01',
          periodName: 'Jan',
          debit: 0,
          credit: 1000,
          netChange: 1000,
          date: '2026-01-15',
          amount: 1000,
          description: 'Rev',
          reference: '',
          entityId: 'E-1',
        },
      ] as never,
    });
    renderPage();
    const body = document.body.textContent ?? '';
    expect(body).toMatch(/Credit Risk Assessment/);
    expect(body).toMatch(/\$850/);
    expect(body).toMatch(/\$1,000/);
    expect(body).toMatch(/E-1/);
    expect(body).toMatch(/not derivable/i);
  });
});
