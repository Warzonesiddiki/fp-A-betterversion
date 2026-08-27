// =============================================================================
// ESGPage tests — engine/store-wired overview
// -----------------------------------------------------------------------------
// Real store idiom: `useGLStore` and `useESGStore` seeded via setState.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import userEvent from '@testing-library/user-event';
import ESGPage from './ESGPage';
import { useGLStore } from '@/store/glStore';
import { useESGStore, type ESGMetric } from '@/store/esgStore';
import { ExportEngine } from '@/engines/ExportEngine';
import type { GLEntry } from '@/types';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn().mockResolvedValue(undefined),
    exportToExcel: vi.fn().mockResolvedValue(undefined),
    exportToCSV: vi.fn(),
  },
}));

function makeEntry(overrides: Partial<GLEntry> & Pick<GLEntry, 'id' | 'accountCode'>): GLEntry {
  return {
    accountId: overrides.id,
    accountName: overrides.accountCode,
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-01-15',
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

const mockEntries: GLEntry[] = [
  // Environmental spend (debit normal)
  makeEntry({
    id: '1',
    accountCode: '6810',
    accountName: 'Clean Energy and Carbon Offsets',
    debit: 45000,
    amount: 45000,
    netChange: 45000,
  }),
  // Social spend (debit normal)
  makeEntry({
    id: '2',
    accountCode: '6820',
    accountName: 'Employee Training and Diversity Program',
    debit: 25000,
    amount: 25000,
    netChange: 25000,
  }),
  // Governance spend (debit normal)
  makeEntry({
    id: '3',
    accountCode: '6830',
    accountName: 'Regulatory Compliance and External Audit',
    debit: 30000,
    amount: 30000,
    netChange: 30000,
  }),
];

const mockMetrics: ESGMetric[] = [
  {
    id: 'm1',
    name: 'Renewable Electricity Share',
    category: 'environmental',
    value: 80,
    unit: '%',
    target: 100,
    trend: 'up',
  },
];

const mockInitiatives = [
  {
    id: 'init1',
    name: 'Zero-Waste Facility Certification',
    description: 'Transitioning main assembly plant to landfill-free operation',
    status: 'In Progress',
    progress: 75,
    budget: 100000,
    spent: 70000,
  },
];

describe('ESGPage (store/GL wired)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
    useESGStore.setState({ metrics: mockMetrics, initiatives: mockInitiatives });
  });

  it('renders KPI values computed from GL expenditures and ESG store', () => {
    render(<ESGPage />);

    // Env = 45k, Soc = 25k, Gov = 30k, Total = 100k
    expect(screen.getByRole('region', { name: 'Total ESG Spend' })).toHaveTextContent('$100,000');
    expect(screen.getByRole('region', { name: 'Environmental Spend' })).toHaveTextContent(
      '$45,000'
    );
    // Score: 80 / 100 = 80%
    expect(screen.getByRole('region', { name: 'Overall ESG Score' })).toHaveTextContent('80%');
    expect(screen.getByRole('region', { name: 'Active Initiatives' })).toHaveTextContent('1');
  });

  it('renders the ESG investment allocation breakdown', () => {
    render(<ESGPage />);

    expect(screen.getByText('ESG Investment Allocation')).toBeInTheDocument();
    expect(screen.getByText('Environmental (E)')).toBeInTheDocument();
    expect(screen.getByText('Social & Workforce (S)')).toBeInTheDocument();
    expect(screen.getByText('Governance & Compliance (G)')).toBeInTheDocument();
  });

  it('exports a PDF report with ESG investments and indicators', async () => {
    const user = userEvent.setup();
    render(<ESGPage />);

    await user.click(screen.getByRole('button', { name: /Export PDF/i }));

    expect(ExportEngine.exportToPDF).toHaveBeenCalledTimes(1);
    const args = vi.mocked(ExportEngine.exportToPDF).mock.calls[0]![0];
    expect(args.rows).toEqual(
      expect.arrayContaining([
        ['Total ESG Investment', '$100,000', 'Posted GL environmental, social, governance spend'],
        ['Environmental Spend', '$45,000', 'Clean energy, waste reduction, carbon offsets'],
        ['Social Spend', '$25,000', 'Workforce wellness, diversity & community'],
      ])
    );
  });

  it('exports ESG metrics and expenditures to Excel', async () => {
    const user = userEvent.setup();
    render(<ESGPage />);

    await user.click(screen.getByRole('button', { name: /Export Excel/i }));

    expect(ExportEngine.exportToExcel).toHaveBeenCalledTimes(1);
    const args = vi.mocked(ExportEngine.exportToExcel).mock.calls[0]![0];
    expect(args.headers).toEqual(['Pillar', 'Metric / Indicator', 'Amount / Value']);
  });

  it('renders empty state when no GL data or ESG metrics exist', () => {
    useGLStore.setState({ entries: [] });
    useESGStore.setState({ metrics: [], initiatives: [] });
    render(<ESGPage />);

    expect(screen.getByRole('main', { name: 'ESG - No Data' })).toBeInTheDocument();
    expect(screen.getByText('No ESG Data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import GL data to view ESG/i })).toBeEnabled();
  });
});
