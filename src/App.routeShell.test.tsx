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
import fs from 'node:fs';
import path from 'node:path';

const APP_SOURCE = fs.readFileSync(path.resolve(__dirname, 'App.tsx'), 'utf8');

/** Routes intentionally rendered without app chrome (full-screen or pre-auth). */
const CHROMELESS_ROUTES = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/onboarding',
  // Opened as a standalone Tauri window; deliberately has no sidebar.
  '/drill-down',
  // The catch-all NotFound page.
  '*',
]);

const LAYOUT_OPEN = '<Route element={<AppLayout />}>';

/** Index of the `<Route element={<AppLayout />}>` opening tag. */
function layoutStart(): number {
  const idx = APP_SOURCE.indexOf(LAYOUT_OPEN);
  expect(idx).toBeGreaterThan(-1);
  return idx;
}

/**
 * Scan forward from `<Route` at `open` to the `>` that closes that tag,
 * ignoring any `>` nested inside a braced JSX expression such as
 * `element={<Foo />}`. Returns the index just past the tag and whether it was
 * self-closing.
 */
function readTag(open: number): { end: number; selfClosing: boolean } {
  let braces = 0;
  for (let i = open; i < APP_SOURCE.length; i += 1) {
    const ch = APP_SOURCE[i];
    if (ch === '{') braces += 1;
    else if (ch === '}') braces -= 1;
    else if (ch === '>' && braces === 0) {
      return { end: i + 1, selfClosing: APP_SOURCE[i - 1] === '/' };
    }
  }
  throw new Error(`Unterminated JSX tag at offset ${open}`);
}

/**
 * Walk the route tree from the layout's opening tag, tracking <Route> nesting
 * depth, and return the index just past its matching `</Route>`. Only real
 * <Route> tags move the depth counter — `element={<Page />}` does not.
 */
function layoutEnd(): number {
  let depth = 0;
  let i = layoutStart();

  while (i < APP_SOURCE.length) {
    const nextOpen = APP_SOURCE.indexOf('<Route', i);
    const nextClose = APP_SOURCE.indexOf('</Route>', i);

    if (nextOpen !== -1 && (nextClose === -1 || nextOpen < nextClose)) {
      const { end, selfClosing } = readTag(nextOpen);
      if (!selfClosing) depth += 1;
      i = end;
    } else if (nextClose !== -1) {
      depth -= 1;
      i = nextClose + '</Route>'.length;
      if (depth === 0) return i;
    } else {
      break;
    }
  }
  throw new Error('Unbalanced <Route> nesting: AppLayout close tag not found');
}

function pathsIn(segment: string): string[] {
  return [...segment.matchAll(/path="([^"]+)"/g)].map((m) => m[1]!);
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

    // 200 routed screens, per docs/CAPABILITY_TRUTH_MATRIX.md.
    expect(all).toHaveLength(200);
    // Aliases to the same page are allowed; identical path strings are not.
    expect(new Set(all).size).toBe(all.length);
  });
});
