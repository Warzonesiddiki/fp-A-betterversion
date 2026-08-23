import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

/**
 * W6-P0-06 — honesty contract for the Executive-Dashboard sector KPI tiles.
 *
 * Every shipped sector pack declares defaultKPIs WITHOUT accountCodes, and
 * percent-unit KPIs were force-formatted as currency. These tests lock the
 * repaired behavior:
 *   1. A KPI that cannot be computed renders an explicit empty state
 *      (dash + "Map accounts in sector settings" tooltip), never a false $0.
 *   2. Display formatting follows each KPI's declared unit — percent values
 *      render through the percent formatter, never through the currency one.
 */

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [
      { accountCode: '4000', debit: 0, credit: 100000, period: '2026-01' },
      { accountCode: '6000', debit: 20000, credit: 0, period: '2026-01' },
    ],
    accounts: [],
    trialBalance: [],
    accountAnalysis: null,
    columnMappings: [],
    isLoading: false,
    importResult: null,
    setEntries: vi.fn(),
    setAccounts: vi.fn(),
    addEntries: vi.fn(),
    clearEntries: vi.fn(),
    setColumnMappings: vi.fn(),
    importData: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  })),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: [],
    activeBudgetId: null,
    lineItems: [],
    isLoading: false,
    isSubmitting: false,
    lastChange: null,
    history: [[]],
    historyIndex: 0,
    selectedCellId: null,
    submitBudget: vi.fn(),
    approveBudget: vi.fn(),
    deleteBudget: vi.fn(),
    duplicateBudget: vi.fn(),
    setActiveBudget: vi.fn(),
    setBudgets: vi.fn(),
    addLineItem: vi.fn(),
    updateLineItem: vi.fn(),
    removeLineItem: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  })),
}));

vi.mock('@/hooks/useSector', () => ({
  useSector: vi.fn(() => ({
    activeSector: 'technology',
    setSector: vi.fn(),
    availableSectors: [],
    sectorConfig: {
      id: 'technology',
      name: 'Technology',
      description: '',
      // Exactly the shape every shipped sector pack ships today: one KPI with
      // codes that exist in the ledger, one with NO mapping, one percent-unit.
      defaultKPIs: [
        {
          id: 'mapped_rev',
          label: 'Mapped Revenue',
          format: 'currency',
          target: 100000,
          accountCodes: ['4000'],
        },
        {
          id: 'arr',
          label: 'Annual Recurring Revenue',
          format: 'currency',
          target: 50000000,
        },
        {
          id: 'gross_margin',
          label: 'Gross Margin Pct',
          format: 'percent',
          target: 75,
          accountCodes: ['4000', '6000'],
        },
      ],
      enabledModules: ['saas'],
      sidebarOrder: ['dashboard'],
      defaultCurrency: 'USD',
    },
  })),
}));

vi.mock('@/hooks/useTour', () => ({
  useTour: vi.fn(() => ({
    runTour: vi.fn(),
    isActive: false,
    currentStepIndex: 0,
    steps: [],
    stopTour: vi.fn(),
  })),
}));

vi.mock('@/components/dashboard/KPICard', () => ({
  KPICard: ({ title }: { title: string }) => <div data-testid="kpi-card">{title}</div>,
}));

vi.mock('@/components/dashboard/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));

vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: () => <div data-testid="chart-wrapper" />,
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: () => null,
}));

vi.mock('@/components/ui/DrillDownModal', () => ({
  DrillDownModal: () => null,
}));

vi.mock('@/components/charts/GaugeChart', () => ({
  GaugeChart: () => <div data-testid="gauge-chart" />,
}));

vi.mock('@/components/charts/SparklineChart', () => ({
  SparklineChart: () => <div data-testid="sparkline-chart" />,
}));

vi.mock('@/components/ai/AICopilotPanel', () => ({
  AICopilotPanel: () => <div data-testid="ai-copilot" />,
}));

vi.mock('@/components/ai/NLQChat', () => ({
  NLQChat: () => <div data-testid="nlq-chat" />,
}));

vi.mock('@/components/ai/AnomalyHighlight', () => ({
  AnomalyHighlight: () => <div data-testid="anomaly-highlight" />,
}));

vi.mock('@/engines/FinanceCopilotEngine', () => ({
  FinanceCopilotEngine: { answer: vi.fn(() => '') },
}));

vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/pages/_docs', () => ({
  PAGE_HELP: {},
}));

import DashboardPage, { formatSectorKpiValue } from '@/pages/DashboardPage';

/** The tile card is the immediate parent of its label element. */
function tileFor(label: string): HTMLElement {
  const labelEl = screen.getByText(label);
  const tile = labelEl.parentElement;
  if (!tile) throw new Error(`No tile container found for ${label}`);
  return tile;
}

const UNMAPPED_TOOLTIP = 'Map accounts in sector settings';

describe('DashboardPage sector KPI tiles — W6-P0-06 honesty contract', () => {
  it('renders the Technology KPI section once entries exist', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Technology KPIs')).toBeInTheDocument();
  });

  it('computes a mapped currency KPI and formats it as currency', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    const tile = tileFor('Mapped Revenue');
    // Ledger fixture: a single credit-100,000 revenue row → $100,000.
    expect(within(tile).getByText('$100,000')).toBeInTheDocument();
  });

  it('shows an explicit unmapped state — never a false $0 — when the pack maps no accounts', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    const tile = tileFor('Annual Recurring Revenue');
    expect(within(tile).getByTitle(UNMAPPED_TOOLTIP)).toBeInTheDocument();
    expect(tile.textContent).not.toContain('$');
  });

  it('discloses percent-unit KPIs instead of rendering a fabricated figure', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    const tile = tileFor('Gross Margin Pct');
    expect(within(tile).getByTitle(UNMAPPED_TOOLTIP)).toBeInTheDocument();
    expect(tile.textContent).not.toContain('%');
    expect(tile.textContent).not.toContain('$');
  });
});

describe('formatSectorKpiValue — unit-aware display formatting', () => {
  const fmt = {
    currency0: (value: number | null | undefined) =>
      value == null || value === 0
        ? '—'
        : `$${Math.round(Math.abs(value)).toLocaleString('en-US')}`,
    number: (value: number | null | undefined) => String(value),
  };

  it('formats percent values through the percent formatter, never as currency', () => {
    expect(formatSectorKpiValue({ value: 47.37, format: 'percent' }, fmt)).toBe('47.4%');
    expect(formatSectorKpiValue({ value: 120, format: 'percent' }, fmt)).toBe('120.0%');
  });

  it('keeps currency KPIs in currency formatting', () => {
    expect(formatSectorKpiValue({ value: 95000, format: 'currency' }, fmt)).toBe('$95,000');
  });

  it('renders an em dash for an uncomputable KPI regardless of declared unit', () => {
    expect(formatSectorKpiValue({ value: null, format: 'percent' }, fmt)).toBe('—');
    expect(formatSectorKpiValue({ value: null, format: 'currency' }, fmt)).toBe('—');
  });
});
