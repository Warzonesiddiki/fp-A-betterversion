/**
 * Shared route-table reader for the route-shell and navigation contracts.
 *
 * The route tree in src/App.tsx is the source of truth for what screens exist.
 * Both contracts need the same answer to "which paths render inside
 * `<Route element={<AppLayout />}>`", so the brace-aware JSX scanner lives here
 * once instead of being copied — a scanner that drifts between two tests is a
 * contract that silently stops agreeing with itself.
 *
 * This is a test-only helper: it reads App.tsx from disk and is never imported
 * by application code.
 */
import fs from 'node:fs';
import path from 'node:path';

export const APP_SOURCE = fs.readFileSync(path.resolve(__dirname, '..', 'App.tsx'), 'utf8');

/** Routes intentionally rendered without app chrome (full-screen or pre-auth). */
export const CHROMELESS_ROUTES: ReadonlySet<string> = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/onboarding',
  // Opened as a standalone Tauri window; deliberately has no sidebar.
  '/drill-down',
  // The catch-all NotFound page.
  '*',
]);

/**
 * The layout route's opening tag. Tolerant of whitespace/newlines between the
 * JSX tokens (Prettier wraps `element={…}` across lines), so reformatting
 * App.tsx cannot silently break the scanner.
 */
const LAYOUT_OPEN_RE =
  /<Route\s+element=\{\s*<ProtectedRoute>\s*<AppLayout\s*\/>\s*<\/ProtectedRoute>\s*\}\s*>/;

/** Index of the `<Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>` opening tag. */
export function layoutStart(source: string = APP_SOURCE): number {
  const m = source.match(LAYOUT_OPEN_RE);
  if (!m || m.index === undefined) {
    throw new Error('ProtectedRoute<AppLayout> route wrapper not found in App.tsx');
  }
  return m.index;
}

/**
 * Scan forward from `<Route` at `open` to the `>` that closes that tag,
 * ignoring any `>` nested inside a braced JSX expression such as
 * `element={<Foo />}`. Returns the index just past the tag and whether it was
 * self-closing.
 */
export function readTag(
  open: number,
  source: string = APP_SOURCE
): { end: number; selfClosing: boolean } {
  let braces = 0;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') braces += 1;
    else if (ch === '}') braces -= 1;
    else if (ch === '>' && braces === 0) {
      return { end: i + 1, selfClosing: source[i - 1] === '/' };
    }
  }
  throw new Error(`Unterminated JSX tag at offset ${open}`);
}

/**
 * Walk the route tree from the layout's opening tag, tracking <Route> nesting
 * depth, and return the index just past its matching `</Route>`. Only real
 * <Route> tags move the depth counter — `element={<Page />}` does not.
 */
export function layoutEnd(source: string = APP_SOURCE): number {
  let depth = 0;
  let i = layoutStart(source);

  while (i < source.length) {
    const nextOpen = source.indexOf('<Route', i);
    const nextClose = source.indexOf('</Route>', i);

    if (nextOpen !== -1 && (nextClose === -1 || nextOpen < nextClose)) {
      const { end, selfClosing } = readTag(nextOpen, source);
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

/** Every `path="…"` literal in a slice of App.tsx source. */
export function pathsIn(segment: string): string[] {
  return [...segment.matchAll(/path="([^"]+)"/g)].map((m) => m[1]!);
}

/**
 * Concrete (non-parameterised, non-wildcard) paths rendered inside AppLayout —
 * i.e. exactly the set of screens the navigation manifest must cover.
 */
export function inShellRoutes(source: string = APP_SOURCE): string[] {
  return pathsIn(source.slice(layoutStart(source), layoutEnd(source))).filter(
    (p) => p !== '*' && !p.includes(':')
  );
}
