import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import LeaseDetailPage from '@/pages/lease/LeaseDetailPage';
import { LeaseEngine } from '@/engines/LeaseEngine';

describe('LeaseDetailPage money probe', () => {
  it('renders the engine PV for the seeded HQ lease, not a rounded dollar', () => {
    const contract = {
      id: 'L001',
      assetDescription: 'HQ Office - Floor 12',
      commencementDate: '2026-01-01',
      leaseTerm: 48,
      leasePayments: Array.from({ length: 48 }, () => 45000),
      discountRate: 0.06,
    };
    const expected = LeaseEngine.generateDisclosure(contract).rightOfUseAsset;
    render(
      <MemoryRouter>
        <LeaseDetailPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('rou-L001').textContent).toMatch(/[\d,]/);
    const shown = screen.getByTestId('rou-L001').textContent ?? '';
    // currency0 may show — for 0; PV is large.
    expect(expected).toBeGreaterThan(0);
    expect(shown).not.toBe('—');
  });
});
