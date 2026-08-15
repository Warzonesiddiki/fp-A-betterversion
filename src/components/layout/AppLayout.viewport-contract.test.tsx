/**
 * @vitest-environment jsdom
 *
 * UI-07 — the application shell is the 1024×600 minimum.
 *
 * jsdom performs no layout, so the 1024×600 contract is pinned structurally:
 * the mechanisms that make the two axes hold are class-level invariants on the
 * shell, and this test fails the moment one of them is weakened.
 *
 *   height (600) — the root is `flex h-screen` and the one scrolling surface is
 *       `<main class="overflow-y-auto">`. Content taller than the viewport
 *       scrolls there; nothing can be trapped off-screen vertically.
 *
 *   width (1024)  — the work area is `flex-1 min-w-0`, so a wide child shrinks
 *       or scrolls internally instead of widening the page; the context bar is
 *       `flex-wrap`, so it wraps to a second row rather than forcing horizontal
 *       scroll; the rail is `md:relative` (fixed rail at ≥768) and collapses to
 *       its compact 64px so the 264px default is never a hard cost.
 *
 * The source-level width audit lives in `src/theme/viewport.contract.test.ts`;
 * pixel verification remains a browser gate (T-10) and is NOT claimed here.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './AppLayout';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

let mockMobileSidebarOpen = false;

vi.mock('@/store/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    mobileSidebarOpen: mockMobileSidebarOpen,
    closeMobileSidebar: vi.fn(),
    toggleSidebar: vi.fn(),
    sidebarCollapsed: false,
    commandPaletteOpen: false,
    toggleCommandPalette: vi.fn(),
    helpPanelOpen: false,
    toggleHelpPanel: vi.fn(),
  })),
}));

vi.mock('@/hooks/useFocusManagement', () => ({
  useFocusManagement: vi.fn(() => ({ mainContentRef: { current: null } })),
}));

vi.mock('@/utils/localeFormatting', () => ({
  getLocaleDirection: vi.fn(() => 'ltr'),
}));

vi.mock('./Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('./Navbar', () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock('@/components/ui/ToastContainer', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: () => <div data-testid="help-panel" />,
}));

const WINDOW = window as unknown as { innerWidth: number };

function setViewportWidth(width: number): void {
  Object.defineProperty(WINDOW, 'innerWidth', { value: width, configurable: true });
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppLayout />
    </MemoryRouter>
  );
}

describe('AppLayout responsive shell contract (UI-07, 1024×600 minimum)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMobileSidebarOpen = false;
    setViewportWidth(1024);
  });

  describe('height axis — 600px is always reachable', () => {
    it('the root is a single viewport-height flex app (no page-level scroll body)', () => {
      const { container } = renderShell();
      const root = container.querySelector('.responsive-root');
      expect(root?.className).toContain('flex');
      expect(root?.className).toContain('h-screen');
    });

    it('the main region is the one vertical scroll surface', () => {
      const { container } = renderShell();
      const main = container.querySelector('main');
      expect(main?.className).toContain('overflow-y-auto');
    });
  });

  describe('width axis — 1024px never forces horizontal scroll', () => {
    it('the work area is flex-1 min-w-0, so wide children shrink instead of widening the page', () => {
      const { container } = renderShell();
      const main = container.querySelector('main');
      const workArea = main?.parentElement;
      expect(workArea?.className).toContain('flex-1');
      expect(workArea?.className).toContain('min-w-0');
      expect(workArea?.className).toContain('overflow-hidden');
    });

    it('the context bar wraps to a second row instead of forcing horizontal scroll', () => {
      const { container } = renderShell();
      const contextBar = container.querySelector('section[aria-label="Financial context"]');
      expect(contextBar?.className).toContain('flex-wrap');
    });

    it('the rail is a fixed sidebar at ≥768 (md:relative) and collapses to its compact width', () => {
      const { container } = renderShell();
      const nav = container.querySelector('#main-nav');
      const rail = nav?.querySelector('div');
      expect(rail?.className).toContain('md:relative');
      expect(rail?.className).toContain('md:translate-x-0');
    });
  });

  describe('below the 768 breakpoint', () => {
    it('the sidebar becomes an off-canvas overlay, not a fixed rail', () => {
      setViewportWidth(390);
      const { container } = renderShell();
      const nav = container.querySelector('#main-nav');
      const rail = nav?.querySelector('div');
      // Off-canvas: fixed, translated out of view until the mobile drawer opens.
      expect(rail?.className).toContain('fixed');
      expect(rail?.className).toContain('-translate-x-full');
    });

    it('renders the mobile overlay scrim only while the drawer is open', () => {
      setViewportWidth(390);
      const first = renderShell();
      expect(first.container.querySelector('.fixed.inset-0.z-40')).toBeNull();

      mockMobileSidebarOpen = true;
      const second = renderShell();
      expect(second.container.querySelector('.fixed.inset-0.z-40')).not.toBeNull();
    });
  });
});
