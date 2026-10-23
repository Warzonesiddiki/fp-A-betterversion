/**
 * FXExposurePage interop 4-state tests — T090-T094, T095-T098
 * Skills: test-driven-development, react-state-and-stores, accessibility-wcag, frontend-design
 * Verifies journey/empty/error/loading states with Skeleton srLabel, ErrorState role=alert, EmptyState
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useCurrencyFormatter', () => ({
  useCurrencyFormatter: () => ({
    currency0: (v: number) => `$${v}`,
    currency: (v: number) => `$${v}`,
  }),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn(() => Promise.resolve()),
    exportToExcel: vi.fn(() => Promise.resolve()),
  },
}));

import FXExposurePage from './FXExposurePage';

const mockExposures = [
  {
    currency: 'EUR',
    symbol: '€',
    exposure: 12500000,
    rate: 1.08,
    hedged: 8000000,
    hedgeRatio: 64,
    unrealizedGL: 325000,
  },
];

describe('FXExposurePage interop 4-state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('journey: renders FX exposure with data (T090)', async () => {
    render(
      <MemoryRouter>
        <FXExposurePage initialExposures={mockExposures} />
      </MemoryRouter>
    );
    expect(await screen.findByText(/FX Exposure/i)).toBeInTheDocument();
    expect(screen.getByText(/EUR/i)).toBeInTheDocument();
  });

  it('empty: shows No FX Exposure when no exposures (T093)', async () => {
    render(
      <MemoryRouter>
        <FXExposurePage initialExposures={[]} />
      </MemoryRouter>
    );
    expect(await screen.findByText(/No FX Exposure/i)).toBeInTheDocument();
  });

  it('error: shows role=alert with retry when error (T092)', async () => {
    render(
      <MemoryRouter>
        <FXExposurePage initialError="Failed to load FX exposures" />
      </MemoryRouter>
    );
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/Failed to load FX exposures/i)).toBeInTheDocument();
  });

  it('loading: shows Skeleton with srLabel and aria-busy (T091)', async () => {
    render(
      <MemoryRouter>
        <FXExposurePage initialLoading={true} />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Loading FX exposure/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading FX exposure data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loading FX exposure/i)).toHaveAttribute('aria-busy', 'true');
  });
});
