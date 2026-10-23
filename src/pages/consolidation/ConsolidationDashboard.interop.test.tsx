/**
 * @vitest-environment jsdom
 *
 * Interop tests for /consolidation — 4-state CONNECTED evidence (PR #94, N7 bundle + 11th route)
 * Proves journey, empty, error, loading per spine-evidence.json policy.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const glState = vi.hoisted(() => ({
  value: {
    entries: [] as unknown[],
    isLoading: false,
  },
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      entries: glState.value.entries,
      isLoading: glState.value.isLoading,
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import ConsolidationDashboard from '@/pages/consolidation/ConsolidationDashboard';

function renderPage(props: { initialError?: string | null; initialEntities?: any[] } = {}) {
  return render(
    <MemoryRouter initialEntries={['/consolidation']}>
      <ConsolidationDashboard {...props} />
    </MemoryRouter>
  );
}

describe('ConsolidationDashboard interop — 4-state CONNECTED', () => {
  beforeEach(() => {
    glState.value.isLoading = false;
    glState.value.entries = [];
    vi.clearAllMocks();
  });

  it('renders the consolidation journey with entities and consolidated P&L', () => {
    renderPage({
      initialEntities: [
        {
          id: 'ent-1',
          name: 'US Parent',
          code: 'US001',
          currency: 'USD',
          country: 'United States',
          parentId: null,
          ownershipPct: 100,
        },
        {
          id: 'ent-2',
          name: 'EU Subsidiary',
          code: 'EU001',
          currency: 'EUR',
          country: 'Germany',
          parentId: 'ent-1',
          ownershipPct: 80,
        },
      ],
    });
    expect(screen.getByRole('heading', { level: 1, name: /consolidation/i })).toBeInTheDocument();
    expect(screen.getAllByText(/US Parent/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/EU Subsidiary/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Consolidated Profit & Loss/)).toBeInTheDocument();
  });

  it('shows the empty state when no entities are defined', () => {
    renderPage();
    expect(screen.getByText(/No entities defined yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Add Entity/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('shows an error alert when consolidation fails to load and retry succeeds', async () => {
    renderPage({ initialError: 'Failed to load consolidation data' });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load consolidation data/i)).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: /Retry/i });
    expect(retry).toBeInTheDocument();
    // Retry clears error via internal setError(null)
    retry.click();
    // After click, error should clear and empty state appears
    const { findByText } = { findByText: screen.findByText.bind(screen) };
    expect(await findByText(/No entities defined yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('hydrate skeleton announces exactly once via srLabel, bars decorative', () => {
    glState.value.isLoading = true;
    const { container } = renderPage();
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite');
    expect(statuses[0]).toHaveTextContent('Loading consolidation dashboard…');
    expect(container.querySelectorAll('[aria-hidden=\"true\"]').length).toBeGreaterThan(0);
  });
});
