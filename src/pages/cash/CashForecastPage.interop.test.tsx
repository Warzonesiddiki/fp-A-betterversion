/**
 * CashForecastPage interop 4-state tests — T036-T040, T041-T044
 * Skills: test-driven-development, react-state-and-stores, accessibility-wcag, frontend-design
 * Epic E2 /cash promotion to SUPPORTED (14th route)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CashForecastPage from './CashForecastPage';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(),
}));

vi.mock('@/hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => ({
    currency0: (v: number) => `$${v}`,
    currency: (v: number) => `$${v}`,
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

vi.mock('@/services/subledgers/settlementLadder', () => ({
  deriveSettlementLadder: vi.fn(() => null),
}));

vi.mock('@/services/subledgers/openItemAging', () => ({
  deriveOpenItemAging: vi.fn(() => ({ items: [] })),
}));

vi.mock('@/pages/cash/cashForecastModel', () => ({
  deriveCashPosition: vi.fn((entries: any[]) => {
    if (entries.length === 0) return null;
    return {
      postedBalance: 100000,
      receipts: 50000,
      disbursements: 20000,
      averageNetPerPeriod: 30000,
      periodCount: 3,
      cashAccountCodes: ['1000', '1100'],
      categories: [{ category: 'Operating', receipts: 50000, disbursements: 20000, net: 30000 }],
      periods: [{ runningBalance: 100000 }],
      unavailable: [],
    };
  }),
}));

import { useGLStore } from '@/store/glStore';

const mockedStore = vi.mocked(useGLStore);

function renderPage() {
  return render(
    <BrowserRouter>
      <CashForecastPage />
    </BrowserRouter>
  );
}

describe('CashForecastPage — 4-state interop (T036-T040)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('journey: renders cash position with data', async () => {
    // @ts-expect-error — test fixture typing
    mockedStore.mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector({
          entries: [{ date: '2026-01-01', accountCode: '1000', debit: 1000 }],
          isLoading: false,
          importError: null,
        });
      }
      return {
        entries: [{ date: '2026-01-01', accountCode: '1000', debit: 1000 }],
        isLoading: false,
        importError: null,
      };
    });

    renderPage();
    expect(await screen.findByText(/Cash Position/i)).toBeInTheDocument();
  });

  it('empty: shows No Cash Activity with CTA', async () => {
    // @ts-expect-error — test fixture typing
    mockedStore.mockImplementation((selector: any) => {
      const state = { entries: [], isLoading: false, importError: null };
      return typeof selector === 'function' ? selector(state) : state;
    });

    renderPage();
    expect(await screen.findByText(/No Cash Activity/i)).toBeInTheDocument();
    expect(screen.getAllByText(/cash accounts/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId('cash-empty-import')).toBeInTheDocument();
  });

  it('error: shows role=alert with retry', async () => {
    // @ts-expect-error — test fixture typing
    mockedStore.mockImplementation((selector: any) => {
      const state = { entries: [], isLoading: false, importError: 'Failed to load GL' };
      return typeof selector === 'function' ? selector(state) : state;
    });

    renderPage();
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/Failed to load cash data/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to load GL/i)).toBeInTheDocument();
  });

  it('loading: shows Skeleton with srLabel and aria-busy', async () => {
    // @ts-expect-error — test fixture typing
    mockedStore.mockImplementation((selector: any) => {
      const state = { entries: [], isLoading: true, importError: null };
      return typeof selector === 'function' ? selector(state) : state;
    });

    renderPage();
    expect(screen.getByLabelText(/Loading cash position/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading cash position data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loading cash position/i)).toHaveAttribute('aria-busy', 'true');
  });
});
