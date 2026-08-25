import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    vi.fn((sel?: (s: unknown) => unknown) => {
      const state = { entries: [] };
      return sel ? sel(state) : state;
    }),
    { getState: () => ({ entries: [] }) }
  ),
}));

vi.mock('@/engines', () => ({
  HealthcareEngine: {
    calculatePatientRevenue: vi.fn(() => ({
      netRevenue: 0,
      grossCharges: 0,
      contractuals: 0,
      cashCollected: 0,
      badDebt: 0,
      denialRate: 0,
      collectionRate: 0,
      daysInAR: 0,
    })),
    getPayerMix: vi.fn(() => []),
  },
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: () => <div data-testid="sparkline" />,
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: () => <div data-testid="composed-chart" />,
  Area: () => <div />,
  Bar: () => <div />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

import { useHealthcareStore } from '@/store/healthcareStore';
import ClinicalTrialCostPage from '@/pages/healthcare/ClinicalTrialCostPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/healthcare/clinical-trials']}>
      <ClinicalTrialCostPage />
    </MemoryRouter>
  );
}

describe('ClinicalTrialCostPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });
  it('asks for a study instead of demonstrating five', () => {
    // With no recorded trials the page empty-states. It previously rendered
    // five fixture studies at named institutions, so this file could assert
    // the heading with an empty workspace.
    renderPage();
    expect(screen.getByText('No Trials Recorded')).toBeTruthy();
    expect(screen.queryByText(/Mayo Clinic/)).toBeNull();
  });

  it('displays page heading once a trial is recorded', () => {
    useHealthcareStore.setState({
      clinicalTrials: [
        {
          id: 'T-1',
          name: 'Alpha',
          site: 'Site One',
          phase: 'Phase III',
          budget: 1000,
          actualSpend: 900,
          targetEnrollment: 10,
          enrolled: 5,
          status: 'active',
        },
      ],
    });
    renderPage();
    expect(screen.getByText('Clinical Trial Costs')).toBeTruthy();
  });
});
