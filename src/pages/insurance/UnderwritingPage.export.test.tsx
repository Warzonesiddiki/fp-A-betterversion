/**
 * Vertical truthfulness sweep (wave 2) — export wiring lock for
 * UnderwritingPage.
 *
 * The header previously offered a "Rate Filing Report" button with no click
 * handler: an implied export of rate filings the page itself discloses as
 * not derivable from the posted GL. The control is now wired and renamed:
 * it exports exactly what `deriveUnderwriting` supports, including the
 * omitted-metric reasons. This lock pins that contract.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';

const mockInsuranceState = {
  rateAdequacy: [],
  lossPicks: [],
  rateFilings: [],
};
vi.mock('@/store/insuranceStore', () => ({
  useInsuranceStore: (selector?: (s: typeof mockInsuranceState) => unknown) =>
    selector ? selector(mockInsuranceState) : mockInsuranceState,
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table" />,
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToExcel: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('@/utils/exportErrorHandler', () => ({
  reportExportFailure: vi.fn(),
}));

import UnderwritingPage from './UnderwritingPage';
import { ExportEngine } from '@/engines/ExportEngine';

const glEntries = [
  {
    id: 'u1',
    accountId: 'a1',
    accountCode: '4000',
    accountName: 'Premium Revenue',
    period: '2026-01',
    periodName: 'Jan',
    debit: 0,
    credit: 1000,
    netChange: -1000,
    date: '2026-01-15',
    amount: -1000,
    description: 'Prem',
    reference: '',
  },
  {
    id: 'u2',
    accountId: 'a2',
    accountCode: '5000',
    accountName: 'Claims Paid',
    period: '2026-01',
    periodName: 'Jan',
    debit: 400,
    credit: 0,
    netChange: 400,
    date: '2026-01-15',
    amount: 400,
    description: 'Loss',
    reference: '',
  },
] as never;

beforeEach(() => {
  vi.clearAllMocks();
  useGLStore.setState({ entries: [] });
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/insurance/underwriting']}>
      <UnderwritingPage />
    </MemoryRouter>
  );
}

describe('UnderwritingPage export wiring', () => {
  it('offers no fictional Rate Filing Report control', () => {
    useGLStore.setState({ entries: glEntries });
    renderPage();
    expect(screen.queryByRole('button', { name: /Rate Filing Report/i })).not.toBeInTheDocument();
  });

  it('exports the real derivation when the button is clicked', async () => {
    useGLStore.setState({ entries: glEntries });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Export Derivation/i }));
    expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    const call = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]!;
    const payload = call[0] as { headers: string[]; rows: (string | number)[][] };
    expect(payload.headers).toEqual(['Measure', 'Value']);
    const flat = payload.rows.map((r) => r.join('|')).join('\n');
    expect(flat).toContain('Posted premium|1000');
    expect(flat).toContain('Posted claims|400');
    // Omitted metrics travel as reasons, not invented values.
    expect(flat).toMatch(/Not derivable — Rate adequacy/);
    expect(flat).toMatch(/Not derivable — Loss picks/);
    expect(flat).toMatch(/Not derivable — Rate filings/);
  });
});
