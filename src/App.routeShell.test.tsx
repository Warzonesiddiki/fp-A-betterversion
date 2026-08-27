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

/**
 * Map every Navigate-only alias route to its redirect target.
 *
 * Tolerant of whitespace/newlines between `element={` and the JSX child
 * (the same App.tsx formatting quirk the route-map generator's B0 fix
 * handles), so the two scanners cannot disagree about which aliases exist.
 */
function navigateTargets(source: string): Map<string, string> {
  const targets = new Map<string, string>();
  const re = /<Route\s+path="([^"]+)"\s+element=\{\s*<Navigate[\s\S]*?to="([^"]+)"/g;
  for (const m of source.matchAll(re)) {
    targets.set(m[1]!, m[2]!);
  }
  return targets;
}

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

    // 200 routed screens, per docs/CAPABILITY_TRUTH_MATRIX.md, plus the 21
    // W0.5 slice-2 rescue aliases (RC3 redirects for never-declared deep links).
    //
    // Pin delta in W0.5 slice-2 route consolidation: 221 → 221 (Δ0). The
    // consolidation converted "/" from a second DashboardPage mount into an
    // in-place <Navigate to="/dashboard"> alias — an element swap that adds
    // and removes no <Route> declaration, so the inventory count is unchanged.
    //
    // Pin delta in W0.5 slice-3 hub fold: 221 → 228 (Δ+7). The seven declared
    // shell-target roots that never had a route (/workforce /treasury /currency
    // /revenue /tax /accounting /admin) gained Navigate aliases to their
    // canonical first children instead of falling through to the 404 catch-all.
    expect(all).toHaveLength(228);
    // Aliases to the same page are allowed; identical path strings are not.
    expect(new Set(all).size).toBe(all.length);
  });

  it('resolves every Navigate-only alias to a declared route', () => {
    const declared = new Set(pathsIn(APP_SOURCE));
    const broken = [...navigateTargets(APP_SOURCE)].filter(([_from, to]) => !declared.has(to));

    // An alias pointing at a path no route declares is a silent 404 loop:
    // the redirect fires and lands on the catch-all instead of the surface.
    expect(broken.map(([from]) => from)).toEqual([]);
  });

  it('keeps every namespace hub root pointed at its canonical child', () => {
    // W0.5 slice 3: the seven declared shell-target roots that never had a
    // route now resolve instead of 404-ing. Targets are the generator's
    // classify()-blessed canonical children (first declared child for
    // /workforce and /treasury).
    const targets = navigateTargets(APP_SOURCE);
    const hubAliases: ReadonlyArray<readonly [string, string]> = [
      ['/workforce', '/workforce/headcount'],
      ['/treasury', '/treasury/investments'],
      ['/currency', '/currency/fx-rates'],
      ['/revenue', '/revenue/rev-rec'],
      ['/tax', '/tax/provision'],
      ['/accounting', '/accounting/depreciation'],
      ['/admin', '/admin/debug'],
    ];
    for (const [from, to] of hubAliases) {
      expect(targets.get(from), from).toBe(to);
    }
  });

  it('keeps "/" as a pure alias of the /dashboard hub', () => {
    // W0.5 slice 2: "/" and "/dashboard" both mounted DashboardPage; the root
    // is now the redirect and the hub is the only rendered surface.
    expect(navigateTargets(APP_SOURCE).get('/')).toBe('/dashboard');

    // Exactly one direct mount remains — the consolidation must not leave a
    // duplicate dashboard surface behind on either path.
    const mounts = [...APP_SOURCE.matchAll(/<DashboardPage\s*\/>/g)];
    expect(mounts).toHaveLength(1);
  });
});
