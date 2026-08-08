import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/store/glStore', () => ({
  useGLStore: () => ({ entries: [], isLoading: false, error: null }),
}));
vi.mock('@/store/energyStore', () => ({
  useEnergyStore: () => ({
    energyEntries: [],
    productionData: [],
    capacity: 0,
    isLoading: false,
  }),
}));
vi.mock('@/components/ui/Button', () => ({ Button: () => <button>btn</button> }));
vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/KPIValue', () => ({ KPIValue: () => <span data-testid="kpi" /> }));
vi.mock('@/components/ui/DataTable', () => ({ DataTable: () => <div data-testid="data-table" /> }));
vi.mock('@/utils/money', () => ({
  roundTo: (n: number) => n,
  sumMoney: (a: number[]) => a.reduce((s, v) => s + v, 0),
}));

describe('EnergySectorPage', () => {
  it('renders empty-state without crashing', async () => {
    const { default: EnergySectorPage } = await import('./EnergySectorPage');
    render(<EnergySectorPage />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
