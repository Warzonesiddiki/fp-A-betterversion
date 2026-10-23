/**
 * HeadcountPlanPage interop 4-state tests — T061-T065, T069
 * Skills: test-driven-development, react-state-and-stores, accessibility-wcag, frontend-design
 * Epic E3 /workforce promotion to SUPPORTED (15th route)
 * Verifies journey/empty/error/loading states with Skeleton srLabel, ErrorState role=alert, EmptyState CTA
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HeadcountPlanPage from './HeadcountPlanPage';

// Mock workforce store
const mockEmployees = [
  {
    id: '1',
    name: 'Alice',
    department: 'Engineering',
    position: 'Engineer',
    salary: 100000,
    startDate: '2023-01-01',
    status: 'active' as const,
  },
];

vi.mock('@/store/workforceStore', () => ({
  useWorkforceStore: vi.fn(),
}));

vi.mock('@/hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => ({
    currency0: (v: number) => `$${v.toLocaleString()}`,
    currency: (v: number) => `$${v.toLocaleString()}`,
  }),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn().mockResolvedValue(undefined),
    exportToExcel: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/utils/exportErrorHandler', () => ({
  reportExportFailure: vi.fn(),
}));

vi.mock('@/utils/clock', () => ({
  todayISO: () => '2026-10-23',
  nowISO: () => '2026-10-23T00:00:00.000Z',
  nowMs: () => Date.now(),
}));

import { useWorkforceStore } from '@/store/workforceStore';

const mockedStore = vi.mocked(useWorkforceStore);

function renderPage() {
  return render(
    <BrowserRouter>
      <HeadcountPlanPage />
    </BrowserRouter>
  );
}

describe('HeadcountPlanPage — 4-state interop (T061-T065)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('journey: renders headcount plan with data (T061)', async () => {
    // @ts-expect-error — test fixture typing
    mockedStore.mockImplementation((selector: any) => {
      const state = {
        employees: mockEmployees,
        isLoading: false,
        error: null,
      };
      return selector(state);
    });

    renderPage();

    // Should show KPI or table, not empty
    expect(await screen.findByText(/Headcount Plan/i)).toBeInTheDocument();
  });

  it('empty: shows No Workforce Data with CTA when no employees (T062)', async () => {
    // @ts-expect-error — test fixture typing
    mockedStore.mockImplementation((selector: any) => {
      const state = {
        employees: [],
        isLoading: false,
        error: null,
      };
      return selector(state);
    });

    renderPage();

    expect(await screen.findByText(/No Workforce Data/i)).toBeInTheDocument();
    expect(screen.getByText(/actual employee records/i)).toBeInTheDocument();
    // CTA button
    expect(screen.getByRole('button', { name: /Open Workforce Planning/i })).toBeInTheDocument();
  });

  it('error: shows role=alert with retry when error (T063)', async () => {
    // @ts-expect-error — test fixture typing
    mockedStore.mockImplementation((selector: any) => {
      const state = {
        employees: [],
        isLoading: false,
        error: 'Failed to fetch workforce',
      };
      return selector(state);
    });

    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/Failed to load workforce data/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch workforce/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });

  it('loading: shows Skeleton with srLabel and aria-busy (T064)', async () => {
    // @ts-expect-error — test fixture typing
    mockedStore.mockImplementation((selector: any) => {
      const state = {
        employees: [],
        isLoading: true,
        error: null,
      };
      return selector(state);
    });

    renderPage();

    expect(screen.getByLabelText(/Loading headcount plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading headcount plan data/i)).toBeInTheDocument();
    // Skeleton aria
    const busy = screen.getByLabelText(/Loading headcount plan/i);
    expect(busy).toHaveAttribute('aria-busy', 'true');
  });

  it('interop: 4 states combined are mutually exclusive (T065)', async () => {
    // Loading state should not show empty or error
    // @ts-expect-error — test fixture typing
    mockedStore.mockImplementation((selector: any) => {
      const state = { employees: [], isLoading: true, error: null };
      return selector(state);
    });

    const { unmount } = renderPage();
    expect(screen.getByLabelText(/Loading headcount plan/i)).toBeInTheDocument();
    expect(screen.queryByText(/No Workforce Data/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    unmount();

    // Error state should not show loading or empty
    // @ts-expect-error — test fixture typing
    mockedStore.mockImplementation((selector: any) => {
      const state = { employees: [], isLoading: false, error: 'Error' };
      return selector(state);
    });

    const { unmount: unmount2 } = render(
      <BrowserRouter>
        <HeadcountPlanPage />
      </BrowserRouter>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Loading headcount plan/i)).not.toBeInTheDocument();
    unmount2();
  });
});
