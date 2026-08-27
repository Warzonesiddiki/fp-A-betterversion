import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Selector-aware mock: the page subscribes via useGLStore((s) => s.entries),
// so the mock must apply a selector when one is passed.
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn((selector?: (s: { entries: unknown[] }) => unknown) => {
    const state = { entries: [] as unknown[] };
    return selector ? selector(state) : state;
  }),
}));

// NOTE: this file previously mocked '@/engines'. The page imports
// '@/engines/HealthcareEngine' directly, so that mock never applied — it only
// looked like isolation. The real engine runs here against an empty ledger;
// the seeded-ledger probe lives in PatientRevenuePage.money.test.tsx.
vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: () => <div data-testid="sparkline" />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">{data?.length ?? 0} rows</div>
  ),
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => <div />,
  Cell: () => <div />,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

import PatientRevenuePage from '@/pages/healthcare/PatientRevenuePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/healthcare/patient-revenue']}>
      <PatientRevenuePage />
    </MemoryRouter>
  );
}

describe('PatientRevenuePage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });
  it('displays expected empty state', () => {
    renderPage();
    expect(screen.getByText(/No Healthcare Data/i)).toBeTruthy();
  });
});
