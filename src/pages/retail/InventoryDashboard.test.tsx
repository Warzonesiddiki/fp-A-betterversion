import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// W-FAB remediation pins. This dashboard previously exported a per-store
// "Inventory Value" column computed as totalValue / storeCount — an even-split
// invention presented as measured per-store valuations — and, when no
// store-tagged entities existed, rendered zero-value placeholder slices for
// Raw Materials / Work in Progress / Finished Goods categories that exist in
// no store. Both are now disclosures instead of invented figures.
// ---------------------------------------------------------------------------

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    // Async contract matters: the page attaches .catch to the result.
    exportToExcel: vi.fn(async () => {}),
  },
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import InventoryDashboard from '@/pages/retail/InventoryDashboard';
import { ExportEngine } from '@/engines/ExportEngine';

const entryNoEntity = {
  id: '1',
  accountId: 'a1',
  accountCode: '1210',
  accountName: 'Inventory',
  period: '2026-01',
  periodName: 'Jan 2026',
  debit: 50000,
  credit: 0,
  netChange: 50000,
  date: '2026-01-01',
  amount: 50000,
  description: '',
  reference: '',
};

async function renderWith(entries: unknown[]) {
  const { useGLStore } = await import('@/store/glStore');
  (useGLStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ entries });
  return render(
    <MemoryRouter>
      <InventoryDashboard />
    </MemoryRouter>
  );
}

describe('InventoryDashboard honesty pins', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an h1 empty state and never shows manufacturing placeholder categories', async () => {
    await renderWith([]);
    expect(
      screen.getByRole('heading', { level: 1, name: /no inventory data/i })
    ).toBeInTheDocument();
    await renderWith([entryNoEntity]);
    expect(screen.queryByText('Raw Materials')).toBeNull();
    expect(screen.queryByText('Work in Progress')).toBeNull();
    expect(screen.queryByText('Finished Goods')).toBeNull();
    expect(screen.getByTestId('inventory-no-store-breakdown')).toBeInTheDocument();
  });

  it('exports only genuinely per-store columns (no even-split inventory value)', async () => {
    await renderWith([entryNoEntity]);
    const exportBtn = screen.getByRole('button', { name: /export inventory data/i });
    exportBtn.click();
    await Promise.resolve();
    expect(ExportEngine.exportToExcel).toHaveBeenCalled();
    const call = (ExportEngine.exportToExcel as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
      headers: string[];
    };
    expect(call.headers).not.toContain('Inventory Value');
    expect(call.headers).toEqual(['Store', 'Revenue', 'COGS', 'Gross Profit']);
  });
});
