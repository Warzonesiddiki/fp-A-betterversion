/**
 * UI-03 CONTRACT: no in-app navigation target may point at a route that does not exist.
 *
 * A `navigate('/x')`, `actionUrl: '/x'`, `to="/x"` or `href="/x"` that does not match a
 * `<Route path=...>` in App.tsx is a dead link: the user lands on the catch-all 404.
 * Three such links shipped before this test existed (`/data/import`, `/saas/cohort-analysis`,
 * `/audit/gdpr-consent`), so the rule is enforced mechanically rather than by review.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { APP_SOURCE } from './test/routeTable';

const SRC_ROOT = 'src';

/** Targets that are intentionally not React Router routes. */
const NON_ROUTE_PREFIXES = ['/api', '/#', '//'];
const ASSET_EXTENSION = /\.(png|jpe?g|svg|json|ico|js|css|webmanifest|txt|pdf|xml)$/;

/** `navigate('/x')`, `actionUrl: '/x'`, `to="/x"`, `href="/x"` — literal absolute paths only. */
const LINK_PATTERN = /(?:navigate|actionUrl:|to=|href=)\s*\(?\s*['"`](\/[^'"`${\s]*)['"`]/g;

function routeMatchers(): { exact: Set<string>; dynamic: RegExp[] } {
  const declared = [...APP_SOURCE.matchAll(/path="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => path !== '*');

  return {
    exact: new Set(declared),
    dynamic: declared
      .filter((path) => path.includes(':'))
      .map((path) => new RegExp(`^${path.replace(/:[^/]+/g, '[^/]+')}$`)),
  };
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' || entry.name === '__tests__' ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(path) && !/\.test\./.test(path) ? [path] : [];
  });
}

describe('App dead-link contract', () => {
  const { exact, dynamic } = routeMatchers();
  const isRoutable = (path: string): boolean =>
    exact.has(path) || dynamic.some((pattern) => pattern.test(path));

  it('declares a non-trivial route table', () => {
    expect(exact.size).toBeGreaterThan(150);
  });

  it('has no navigation target pointing at a non-existent route', () => {
    const dead: string[] = [];

    for (const file of sourceFiles(SRC_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(LINK_PATTERN)) {
        const target = match[1].split('?')[0].replace(/\/$/, '') || '/';
        if (NON_ROUTE_PREFIXES.some((prefix) => target.startsWith(prefix))) continue;
        if (ASSET_EXTENSION.test(target)) continue;
        if (!isRoutable(target)) dead.push(`${file}: ${target}`);
      }
    }

    expect(dead).toEqual([]);
  });
});
