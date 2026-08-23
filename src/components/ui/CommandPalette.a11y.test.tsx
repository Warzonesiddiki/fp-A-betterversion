/**
 * @vitest-environment jsdom
 *
 * R9-d — jest-axe content-state spec for the ⌘K command palette.
 * Content states:
 *   1. Open with results — listbox populated from passed commands while the
 *      real stores (budgets / forecasts / scenarios / entities) feed
 *      GlobalSearchEngine's index.
 *   2. Open with zero results — the post-R26 empty branch renders a
 *      role="status" region instead of an empty role="listbox"; this spec
 *      pins that branch as axe-clean so it cannot regress.
 * Bar: 0 violations per UI-07.
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CommandPalette, type CommandItem } from './CommandPalette';
import { useBudgetStore } from '@/store/budgetStore';
import { useForecastStore } from '@/store/forecastStore';
import { useScenarioStore } from '@/store/scenarioStore';
import { useEntityStore } from '@/store/entityStore';

expect.extend(toHaveNoViolations);

// matchMedia is unavailable in jsdom; stub it so any hook consumer of
// useReducedMotion or prefers-color-scheme resolves deterministically.
const originalMatchMedia = window.matchMedia;
function mockMatchMedia(prefersReducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? prefersReducedMotion : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

const COMMANDS: CommandItem[] = [
  {
    id: 'nav-budgets',
    label: 'Budgets',
    description: '/budgets',
    category: 'Plan',
    onSelect: () => {},
  },
  {
    id: 'nav-reports',
    label: 'Reports',
    description: '/reports',
    category: 'Report',
    shortcut: 'G R',
    onSelect: () => {},
  },
];

/** Minimal store seeds — GlobalSearchEngine reads name/status/type only. */
function seedStores() {
  useBudgetStore.setState({
    budgets: [
      {
        id: 'bgt-1',
        name: 'FY2026 Operating Budget',
        fiscalYear: 2026,
        status: 'Approved',
        totalAmount: 1000000,
        departments: ['Finance'],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
        items: [],
      },
    ],
  } as never);
  useForecastStore.setState({
    forecasts: [{ id: 'fcst-1', name: 'Q3 Revenue Forecast', status: 'draft' }],
  } as never);
  useScenarioStore.setState({
    scenarios: [{ id: 'scn-1', name: 'Base Case', status: 'draft' }],
  } as never);
  useEntityStore.setState({
    entities: [
      {
        id: 'ent-1',
        name: 'US Parent',
        code: 'USP',
        currency: 'USD',
        country: 'United States',
        isParent: true,
        parentId: null,
      },
    ],
  });
}

describe('CommandPalette a11y (axe-core content states)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia(false);
    seedStores();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  function renderPalette(open: boolean) {
    // testUtils' render already wraps BrowserRouter — no extra Router here.
    return render(<CommandPalette items={COMMANDS} isOpen={open} onClose={() => {}} />);
  }

  it('open with results: combobox + listbox state has zero violations', async () => {
    const { container } = renderPalette(true);

    expect(screen.getByLabelText('Search commands')).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Commands' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(COMMANDS.length);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('open with zero results: the R26 status-branch stays axe-clean (no empty listbox)', async () => {
    const { container } = renderPalette(true);

    fireEvent.change(screen.getByLabelText('Search commands'), { target: { value: 'zzzzzz' } });

    // R26 regression pins: the empty branch must NOT keep role=listbox.
    expect(screen.queryByRole('listbox')).toBeNull();
    // The combobox keeps pointing at a real status region. (role=status
    // alone is ambiguous — the footer LiveRegion is one too.)
    const statusRegion = container.querySelector('#command-list[role="status"]');
    expect(statusRegion).not.toBeNull();
    expect(statusRegion?.getAttribute('aria-label')).toBeTruthy();
    expect(statusRegion?.textContent).toMatch(/not found|no commands|commands.notfound/i);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
