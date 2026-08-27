import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// Lane R34 (W-A11Y-002 M5): hoisted-mutable store ref so specs can drive the
// page into its loading branch without re-importing modules. The page's
// isLoading is wired to GL-store hydration (lane R34 source fix).
const glState = vi.hoisted(() => ({
  value: {
    entries: [] as unknown[],
    isLoading: false,
  },
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => glState.value),
}));

vi.mock('@/engines/ConsolidationEngine', () => ({
  ConsolidationEngine: { consolidate: vi.fn(() => null) },
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    Plus: makeIcon(),
    Trash2: makeIcon(),
    Edit2: makeIcon(),
    LayoutGrid: makeIcon(),
    List: makeIcon(),
  };
});

import ConsolidationDashboard from '@/pages/consolidation/ConsolidationDashboard';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/consolidation']}>
      <ConsolidationDashboard />
    </MemoryRouter>
  );
}

describe('ConsolidationDashboard smoke test', () => {
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
  it('displays Legal Entity Consolidation heading', () => {
    renderPage();
    // Absorbed from the retired __tests__ mirror: the title is the page's
    // single level-1 heading, not just loose text.
    expect(screen.getByRole('heading', { level: 1, name: /consolidation/i })).toBeInTheDocument();
    expect(screen.getByText('Legal Entity Consolidation')).toBeInTheDocument();
  });
});

// W-A11Y-002 M5 announce-once (lane R34): the hoisted-mutable glStore ref
// flips isLoading; the skeleton must own exactly ONE polite status
// announcement with all bars aria-hidden.
describe('ConsolidationDashboard — loading branch announce-once', () => {
  beforeEach(() => {
    glState.value.isLoading = false;
  });

  it('hydrate skeleton announces exactly once via srLabel, bars decorative', () => {
    glState.value.isLoading = true;
    const { container } = renderPage();
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite');
    expect(statuses[0]).toHaveAttribute('aria-atomic', 'true');
    expect(statuses[0]).toHaveTextContent('Loading consolidation dashboard…');
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it('non-loading render exposes no status region', () => {
    renderPage();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
