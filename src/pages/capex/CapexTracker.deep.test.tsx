import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CapexTracker, {
  sumProjectBudgets,
  sumProjectActuals,
  projectVariance,
  sumAssetCosts,
  sumAssetNBV,
} from './CapexTracker';
import { useGLStore } from '@/store/glStore';
import { useCapExStore } from '@/store/capexStore';
import type { GLEntry } from '@/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CapexTracker (deep tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [], isLoading: false });
    useCapExStore.setState({
      projects: [],
      assets: [],
      depreciationSchedule: [],
      isLoading: false,
    });
  });

  const sampleProjects = [
    {
      id: 'p-1',
      name: 'HQ Server Migration',
      category: 'IT Infrastructure',
      budget: 150000,
      actual: 120000,
      status: 'in-progress' as const,
      paybackPeriod: 2.5,
      irr: 18.2,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    },
    {
      id: 'p-2',
      name: 'Warehouse Automation',
      category: 'Equipment',
      budget: 300000,
      actual: 310000,
      status: 'completed' as const,
      paybackPeriod: 3.1,
      irr: 14.5,
      startDate: '2025-06-01',
      endDate: '2026-06-30',
    },
  ];

  const sampleAssets = [
    {
      id: 'a-1',
      name: 'Rack Servers Alpha',
      category: 'Hardware',
      cost: 80000,
      nbv: 64000,
      annualDep: 16000,
      usefulLife: 5,
      acquisitionDate: '2026-01-15',
    },
  ];

  const sampleDepSchedule = [
    {
      year: 2026,
      assetName: 'Rack Servers Alpha',
      beginningValue: 80000,
      depreciation: 16000,
      endingValue: 64000,
    },
  ];

  describe('math helper functions', () => {
    it('accurately computes project budgets, actuals, variance, and asset values', () => {
      expect(sumProjectBudgets(sampleProjects)).toBe(450000);
      expect(sumProjectActuals(sampleProjects)).toBe(430000);
      expect(projectVariance(sampleProjects[0]!)).toBe(30000);
      expect(projectVariance(sampleProjects[1]!)).toBe(-10000);
      expect(sumAssetCosts(sampleAssets)).toBe(80000);
      expect(sumAssetNBV(sampleAssets)).toBe(64000);
    });
  });

  it('renders loading skeleton when GL or CapEx store is loading', () => {
    useCapExStore.setState({ isLoading: true });

    const { container } = render(
      <BrowserRouter>
        <CapexTracker />
      </BrowserRouter>
    );

    expect(screen.queryByText('CapEx Tracker')).not.toBeInTheDocument();
    // W-A11Y-002 M5 announce-once: bars stay decorative (aria-hidden) and the
    // whole loading branch owns exactly ONE polite status announcement.
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    expect(container.querySelector('.bg-gray-200')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders empty state when no GL entries exist and handles upload navigation', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <CapexTracker />
      </BrowserRouter>
    );

    expect(screen.getByRole('main', { name: 'CapEx Tracker - No Data' })).toBeInTheDocument();
    expect(screen.getByText('No CapEx Data')).toBeInTheDocument();

    const importBtn = screen.getByRole('button', { name: 'Import Data' });
    await user.click(importBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/data/gl-upload');
  });

  it('renders KPI metrics and data tables when GL and CapEx data exist', () => {
    const mockGLEntries: GLEntry[] = [
      {
        id: 'gl-1',
        accountCode: '1500',
        accountName: 'Equipment',
        debit: 50000,
        credit: 0,
        netChange: 50000,
        date: '2026-08-01',
        description: 'CapEx addition',
        category: 'Asset',
      },
    ];

    useGLStore.setState({ entries: mockGLEntries });
    useCapExStore.setState({
      projects: sampleProjects,
      assets: sampleAssets,
      depreciationSchedule: sampleDepSchedule,
    });

    render(
      <BrowserRouter>
        <CapexTracker />
      </BrowserRouter>
    );

    expect(screen.getByRole('main', { name: 'CapEx Tracker Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('CapEx Tracker')).toBeInTheDocument();
    expect(screen.getByText(/2 projects · 1 assets · 1 GL entries/i)).toBeInTheDocument();

    // Check KPIs
    expect(screen.getByText('Total Budget')).toBeInTheDocument();
    expect(screen.getByText('Total Actual')).toBeInTheDocument();
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('Net Asset Value')).toBeInTheDocument();

    // Check Tables
    expect(screen.getByText('Capital Projects')).toBeInTheDocument();
    expect(screen.getByText('HQ Server Migration')).toBeInTheDocument();
    expect(screen.getByText('Warehouse Automation')).toBeInTheDocument();

    expect(screen.getByText('Fixed Assets')).toBeInTheDocument();
    expect(screen.getAllByText('Rack Servers Alpha')).toHaveLength(2);

    expect(screen.getByText('Depreciation Schedule')).toBeInTheDocument();
  });

  it('toggles HelpPanel visibility on Help button click', async () => {
    const user = userEvent.setup();
    useGLStore.setState({
      entries: [
        {
          id: 'gl-1',
          accountCode: '1500',
          accountName: 'Equipment',
          debit: 50000,
          credit: 0,
          netChange: 50000,
          date: '2026-08-01',
          description: 'CapEx',
          category: 'Asset',
        },
      ],
    });

    render(
      <BrowserRouter>
        <CapexTracker />
      </BrowserRouter>
    );

    const helpBtn = screen.getByRole('button', { name: 'Help' });
    await user.click(helpBtn);

    expect(screen.getByText('CapEx Tracker Help')).toBeInTheDocument();
    expect(screen.getByText('What is CapEx Tracking?')).toBeInTheDocument();
  });
});
