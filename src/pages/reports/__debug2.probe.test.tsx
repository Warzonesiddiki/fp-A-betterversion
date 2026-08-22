import { describe, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import CashFlowPage from './CashFlowPage';
import { seedGLLedger, renderMoneyProbe } from '@/test/renderProbe';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

describe('debug2', () => {
  it('dumps', () => {
    const now = '2026-08';
    const prev = '2026-07';
    seedGLLedger([
      { accountCode: '1100', accountName: 'Cash', debit: 100_000, credit: 0, period: prev },
      { accountCode: '1210', accountName: 'AR', debit: 30_000, credit: 0, period: prev },
      { accountCode: '1510', accountName: 'PPE', debit: 80_000, credit: 0, period: prev },
      { accountCode: '2110', accountName: 'AP', debit: 0, credit: 25_000, period: prev },
      { accountCode: '2210', accountName: 'LTD', debit: 0, credit: 60_000, period: prev },
      { accountCode: '1210', accountName: 'AR', debit: 50_000, credit: 0, period: now },
      { accountCode: '4010', accountName: 'Rev', debit: 0, credit: 50_000, period: now },
      { accountCode: '1100', accountName: 'Cash', debit: 62_000, credit: 0, period: now },
      { accountCode: '1210', accountName: 'AR', debit: 0, credit: 62_000, period: now },
      { accountCode: '6010', accountName: 'Sal', debit: 20_000, credit: 0, period: now },
      { accountCode: '1100', accountName: 'Cash', debit: 0, credit: 20_000, period: now },
      {
        accountCode: '6100',
        accountName: 'Dep',
        description: 'Depreciation expense',
        debit: 5_000,
        credit: 0,
        period: now,
      },
      { accountCode: '2990', accountName: 'OthLia', debit: 0, credit: 5_000, period: now },
      { accountCode: '2110', accountName: 'AP', debit: 5_000, credit: 0, period: now },
      { accountCode: '1100', accountName: 'Cash', debit: 0, credit: 5_000, period: now },
      { accountCode: '2210', accountName: 'LTD', debit: 10_000, credit: 0, period: now },
      { accountCode: '1100', accountName: 'Cash', debit: 0, credit: 10_000, period: now },
      { accountCode: '1510', accountName: 'PPE', debit: 15_000, credit: 0, period: now },
      { accountCode: '1100', accountName: 'Cash', debit: 0, credit: 15_000, period: now },
      { accountCode: '3110', accountName: 'Div', debit: 6_000, credit: 0, period: now },
      { accountCode: '1100', accountName: 'Cash', debit: 0, credit: 6_000, period: now },
    ]);
    renderMoneyProbe(<CashFlowPage />);
    console.log(
      'CELLS2',
      JSON.stringify(screen.getAllByRole('gridcell').map((c) => c.textContent))
    );
  });
});
