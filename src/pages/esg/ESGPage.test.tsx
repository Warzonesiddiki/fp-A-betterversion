import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/store/glStore', () => ({
  useGLStore: (sel?: (s: any) => any) =>
    sel
      ? sel({ entries: [], isLoading: false, error: null })
      : { entries: [], isLoading: false, error: null },
}));
vi.mock('@/store/esgStore', () => ({
  useESGStore: () => ({
    esgEntries: [],
    emissionsData: [],
    carbonFootprint: 0,
    sdgAlignment: 0,
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

describe('ESGPage', () => {
  it('renders empty-state without crashing', async () => {
    const { default: ESGPage } = await import('./ESGPage');
    render(<ESGPage />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
