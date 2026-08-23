/**
 * @vitest-environment jsdom
 *
 * R9-d — jest-axe content-state spec for the app shell (lane S7/R9-d).
 *
 * Content states under test:
 *   1. Expanded rail, authenticated Admin, closed overlays (default).
 *   2. Collapsed icon rail (the W-A11Y-002 M1 sr-only name-carrier state).
 *
 * Realness policy: Sidebar, PillarNav, FinancialContextBar, DurabilityBanner,
 * SkipToContent and CommandPalette mount REAL. Stores are the real zustand
 * modules seeded via merge-setState (never replace=true) + actAs('Admin').
 * Navbar and ToastContainer are stubbed — they belong to other lanes' fix
 * ownership, and the existing AppLayout suite sets the same precedent, so
 * this spec's axe surface stays scoped to components this lane may fix.
 * Bar: 0 critical, 0 serious per UI-07 (asserted via full toHaveNoViolations;
 * axe "incomplete" results are not counted as violations).
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@/context/ThemeContext';
import AppLayout from './AppLayout';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useFinancialContextStore } from '@/store/financialContextStore';
import { DEFAULT_FINANCIAL_CONTEXT } from '@/types/financialContext';
import { actAs, signOut } from '@/test/rbacFixtures';

expect.extend(toHaveNoViolations);

vi.mock('./Navbar', () => ({
  Navbar: () => <div data-testid="navbar-stub" />,
}));
vi.mock('@/components/ui/ToastContainer', () => ({
  ToastContainer: () => <div data-testid="toast-container-stub" />,
}));
// Collaboration init touches a WebSocket-manager singleton — infra noise for
// a DOM content-state spec, so it is stubbed to a no-op hook.
vi.mock('@/hooks/useCollaborationInit', () => ({
  useCollaborationSetup: () => {},
}));

// matchMedia is unavailable in jsdom; ThemeProvider (prefers-color-scheme)
// and any useReducedMotion consumer need the stub. Default: motion allowed.
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

function renderLayoutAt(path = '/dashboard') {
  window.history.pushState({}, '', path);
  return render(
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}

describe('AppLayout a11y (axe-core content states)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia(false);
    actAs('Admin');
    useUIStore.setState({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      theme: 'light',
      commandPaletteOpen: false,
      helpPanelOpen: false,
    });
    useFinancialContextStore.setState({ context: DEFAULT_FINANCIAL_CONTEXT });
  });

  afterEach(() => {
    signOut();
    window.matchMedia = originalMatchMedia;
  });

  it('mounts the shell with the real Sidebar, one skip link, and zero axe violations', async () => {
    const { container } = renderLayoutAt();

    // Real chrome really mounted (not the sibling suite's stubbed variants).
    expect(screen.getByTestId('pillar-nav')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Financial context' })).toBeInTheDocument();
    expect(document.querySelector('aside.fp-sidebar')).not.toBeNull();

    // Exactly one bypass block, and it is the first focusable in the shell.
    const skipLinks = screen.getAllByText(/skip/i);
    expect(skipLinks).toHaveLength(1);
    const focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), select, input, textarea, [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable[0]).toBe(skipLinks[0]);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('keeps the collapsed icon rail free of critical or serious violations', async () => {
    useUIStore.setState({ sidebarCollapsed: true });
    const { container } = renderLayoutAt();

    expect(document.querySelector('aside[data-collapsed="true"]')).not.toBeNull();
    const results = await axe(container);
    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(blocking).toEqual([]);
  });
});
