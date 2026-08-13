/**
 * Route-shell contract (UI-03).
 *
 * Every navigable screen must render inside <AppLayout>, which supplies the
 * sidebar, navbar and financial context bar. A <Route> declared as a sibling of
 * the layout still *matches* its path, so the page appears to work — but it
 * renders with no application chrome and no way to navigate onward. The user is
 * stranded on a dead-end screen and has to use browser history to escape.
 *
 * This is invisible to type checking, lint and the existing runtime smoke test,
 * so the structure is asserted here directly against the route tree in App.tsx.
 * The 36 sector/industry aliases were in exactly that state before this test
 * existed; see the "Phase 4 G11" group in App.tsx.
 */
import { describe, expect, it } from 'vitest';
import { APP_SOURCE, CHROMELESS_ROUTES, layoutEnd, layoutStart, pathsIn } from '@/test/routeTable';

describe('route shell contract (UI-03)', () => {
  it('renders every navigable route inside AppLayout', () => {
    const start = layoutStart();
    const end = layoutEnd();

    const outside = [
      ...pathsIn(APP_SOURCE.slice(0, start)),
      ...pathsIn(APP_SOURCE.slice(end)),
    ].filter((p) => !CHROMELESS_ROUTES.has(p));

    expect(outside).toEqual([]);
  });

  it('keeps the sector and industry aliases inside the app shell', () => {
    const inside = pathsIn(APP_SOURCE.slice(layoutStart(), layoutEnd()));

    // Representative sample of the group that previously rendered chromeless.
    for (const route of [
      '/sector/retail',
      '/sector/healthcare',
      '/sectors/telecom',
      '/education',
      '/government/grants',
      '/logistics/fleet-cost',
      '/telecom',
    ]) {
      expect(inside).toContain(route);
    }
  });

  it('declares the catch-all last so it cannot shadow later routes', () => {
    const catchAll = APP_SOURCE.indexOf('path="*"');
    expect(catchAll).toBeGreaterThan(-1);

    // Nothing may be routed after the catch-all: React Router ranks by
    // specificity rather than source order, so a trailing route is not
    // shadowed — but its placement outside the layout is what breaks it, and
    // keeping the wildcard last preserves the readable, conventional ordering.
    expect(pathsIn(APP_SOURCE.slice(catchAll + 'path="*"'.length))).toEqual([]);
  });

  it('does not lose or duplicate any route while the tree is restructured', () => {
    const all = pathsIn(APP_SOURCE);

    // 200 routed screens, per docs/CAPABILITY_TRUTH_MATRIX.md.
    expect(all).toHaveLength(200);
    // Aliases to the same page are allowed; identical path strings are not.
    expect(new Set(all).size).toBe(all.length);
  });
});
