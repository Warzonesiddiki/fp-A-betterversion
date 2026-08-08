import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PeriodClosePage from '../../periods/PeriodClosePage';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: () => <div />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: () => <div />,
  Pie: () => null,
  Cell: () => null,
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign((selector: (s: any) => any) =>
    selector ? selector({ entries: [] }) : { entries: [] }
  ),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: Object.assign((selector: (s: any) => any) =>
    selector ? selector({ budgets: [] }) : { budgets: [] }
  ),
}));

vi.mock('@/store/periodCloseStore', () => {
  const store = {
    initialized: true,
    initialize: vi.fn(),
    state: {} as Record<string, unknown>,
    entries: {} as Record<string, unknown>,
    checklists: {} as Record<string, unknown>,
    transitions: [] as unknown[],
    tasks: [] as unknown[],
    chain: [] as unknown[],
    transition: vi.fn(),
    updateTaskStatus: vi.fn(),
    assignTask: vi.fn(),
    verifyChain: vi.fn().mockResolvedValue({ ok: true, totalEntries: 0 }),
  };
  const hook = Object.assign((selector?: (s: any) => any) => (selector ? selector(store) : store), {
    getState: () => store,
    setState: vi.fn(),
    subscribe: vi.fn(),
  });
  return { usePeriodCloseStore: hook };
});

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: () => ({
    organization: { name: 'Test Org', fiscalYearStart: 1, fiscalYearEnd: 12 },
  }),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'u1', role: 'Admin', email: 'a@b.c' },
    hasPermission: () => true,
  }),
  hasPermission: () => true,
}));

vi.mock('lucide-react', () => ({
  CalendarCheck: () => <svg />,
  Lock: () => <svg />,
  Unlock: () => <svg />,
  ShieldCheck: () => <svg />,
  CheckCircle2: () => <svg />,
  XCircle: () => <svg />,
  AlertTriangle: () => <svg />,
  FileDown: () => <svg />,
  Link2: () => <svg />,
  ChevronDown: () => <svg />,
  ChevronUp: () => <svg />,
  Clock: () => <svg />,
  RefreshCw: () => <svg />,
  History: () => <svg />,
  Play: () => <svg />,
}));

describe('PeriodClosePage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the period close heading', () => {
    render(<PeriodClosePage />);
    expect(
      screen.getAllByRole('heading', { level: 1, name: /period close/i }).length
    ).toBeGreaterThan(0);
  });
});
