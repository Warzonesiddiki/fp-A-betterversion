/**
 * F-05 beta-mode smoke test (remaining-work item 3 / handover T-03).
 *
 * Renders the REAL <App /> in jsdom and asserts the beta gate contract:
 *  1. A plain browser WITHOUT `VITE_BETA_WEB` keeps the existing explicit
 *     block (alert + no render + no beta marker).
 *  2. A plain browser WITH `VITE_BETA_WEB=true` renders instead of blocking,
 *     sets the honest `data-beta-web` marker, and mounts the app shell.
 *  3. First-run onboarding renders in beta mode (no block).
 *  4. A Tauri runtime renders WITHOUT the flag and WITHOUT the beta marker
 *     (default runtime behavior unchanged).
 *
 * The stubEnvironmentGaps polyfills (matchMedia / ResizeObserver) cover
 * jsdom-only gaps — they are NOT beta-mode shims.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '@/App';

// ---------------------------------------------------------------------------
// jsdom environment gaps (NOT beta-mode shims): ThemeContext calls
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
  vi.unstubAllEnvs();
  stubEnvironmentGaps();
  localStorage.clear();
});

afterEach(() => {
  delete WINDOW_ANY.__TAURI_INTERNALS__;
  delete WINDOW_ANY.__TAURI__;
  delete document.documentElement.dataset.betaWeb;
  localStorage.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('App browser beta gate (F-05 smoke)', () => {
  it('keeps the existing explicit block in a browser without VITE_BETA_WEB', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('finplan-setup-complete', 'true');
    // Explicitly NOT enabled — also robust when the whole suite runs with
    // VITE_BETA_WEB=true from the shell (beta-mode verification run).
    vi.stubEnv('VITE_BETA_WEB', 'false');

    const { container } = render(<App />);

    expect(alertSpy).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
    expect(document.documentElement.dataset.betaWeb).toBeUndefined();
  });

  it('renders instead of blocking when VITE_BETA_WEB=true, with the honest marker', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('finplan-setup-complete', 'true');
    vi.stubEnv('VITE_BETA_WEB', 'true');

    render(<App />);

    expect(alertSpy).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(document.documentElement.dataset.betaWeb).toBe('true');
    });
    // The real app shell mounts (sidebar nav) once the lazy Dashboard chunk
    // resolves — proving the app does not crash on Tauri imports in a browser.
    const navLinks = await screen.findAllByText('Dashboard', {}, { timeout: 10000 });
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('shows first-run onboarding in beta mode instead of blocking', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.stubEnv('VITE_BETA_WEB', 'true');

    render(<App />);

    expect(alertSpy).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(document.documentElement.dataset.betaWeb).toBe('true');
    });
    await screen.findByText('Welcome to FinPlan Pro');
  });

  it('renders in a Tauri runtime without the beta flag and without the beta marker', async () => {
    WINDOW_ANY.__TAURI_INTERNALS__ = {};
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.setItem('finplan-setup-complete', 'true');
    // VITE_BETA_WEB deliberately NOT set: Tauri is the default runtime.

    render(<App />);

    expect(alertSpy).not.toHaveBeenCalled();
    const navLinks = await screen.findAllByText('Dashboard', {}, { timeout: 10000 });
    expect(navLinks.length).toBeGreaterThan(0);
    expect(document.documentElement.dataset.betaWeb).toBeUndefined();
  });
});
