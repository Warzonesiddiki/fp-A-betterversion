/**
 * Desktop-only runtime gate smoke test (replaces the F-05 beta-mode smoke
 * test, which was removed 2026-08-12 by owner decision — the product is a
 * desktop app, not a web app).
 *
 * Renders the REAL <App /> in jsdom and asserts the desktop-only contract:
 *  1. A plain browser (no Tauri internals) is blocked: alert + no render.
 *  2. A Tauri runtime renders the app shell — no block, and no beta marker
 *     (the data-beta-web marker no longer exists).
 *
 * The stubEnvironmentGaps polyfills (matchMedia / ResizeObserver) cover
 * jsdom-only gaps — they are not runtime shims.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';
import { actAs, signOut } from '@/test/rbacFixtures';

// ---------------------------------------------------------------------------
// jsdom environment gaps (NOT runtime shims): ThemeContext calls
// window.matchMedia, and responsive chart wrappers use ResizeObserver.
// ---------------------------------------------------------------------------
function stubEnvironmentGaps(): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList
  );
  class ResizeObserverMock {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
}

const WINDOW_ANY = window as unknown as Record<string, unknown>;

beforeEach(() => {
  // The jsdom window is never a Tauri runtime unless a test says otherwise.
  delete WINDOW_ANY.__TAURI_INTERNALS__;
  delete WINDOW_ANY.__TAURI__;
  stubEnvironmentGaps();
  localStorage.clear();
});

afterEach(() => {
  delete WINDOW_ANY.__TAURI_INTERNALS__;
  delete WINDOW_ANY.__TAURI__;
  signOut();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('App desktop-only runtime gate', () => {
  it('blocks a plain browser with an alert and no render', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('finplan-setup-complete', 'true');

    const { container } = render(<App />);

    expect(alertSpy).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the app shell in a Tauri runtime', async () => {
    WINDOW_ANY.__TAURI_INTERNALS__ = {};
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('finplan-setup-complete', 'true');
    // AppLayout sits behind ProtectedRoute — an authenticated Admin session
    // is required or the shell redirects to /login before rendering.
    actAs('Admin');

    render(<App />);

    expect(alertSpy).not.toHaveBeenCalled();
    // The real app shell mounts (sidebar nav) once the lazy Dashboard chunk
    // resolves — proving the app does not crash on Tauri imports.
    const navLinks = await screen.findAllByText('Dashboard', {}, { timeout: 10000 });
    expect(navLinks.length).toBeGreaterThan(0);
  });
});
