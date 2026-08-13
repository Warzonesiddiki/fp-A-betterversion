/**
 * Navigation manifest contract (UI-03).
 *
 * Before this contract existed the sidebar listed 37 destinations against 190
 * in-shell routes: 160 screens (82%) were built, tested and shipped with no way
 * to reach them from the UI, and two of the 37 links — /data/trial-balance and
 * /data/import — pointed at paths that were never routes at all, so the two
 * most-used data destinations dead-ended on the 404 page.
 *
 * Both failures are invisible to type checking: a nav path is just a string.
 * So the manifest is asserted against the route table in both directions —
 * every in-shell route is reachable, and every manifest target resolves.
 *
 * @see src/test/routeTable.ts for the shared App.tsx scanner.
 */
import { describe, expect, it } from 'vitest';
import { ROLE_PERMISSIONS } from '@/store/authStore';
import { PAGE_HELP } from '@/pages/_docs';
import { inShellRoutes, pathsIn, APP_SOURCE } from '@/test/routeTable';
import {
  NAV_ITEMS,
  NAV_SECTIONS,
  findActiveItem,
  findActiveSectionId,
  isItemActive,
} from './navigation';

const manifestPaths = NAV_ITEMS.map((item) => item.path);

describe('navigation manifest contract (UI-03)', () => {
  it('exposes every route that renders inside the app shell', () => {
    const missing = inShellRoutes().filter((route) => !manifestPaths.includes(route));

    // A new screen added to App.tsx without a manifest entry is unreachable.
    expect(missing).toEqual([]);
  });

  it('points every manifest entry at a route that exists', () => {
    const declared = new Set(pathsIn(APP_SOURCE));
    const broken = manifestPaths.filter((path) => !declared.has(path));

    // Regression guard: /data/trial-balance and /data/import were 404s.
    expect(broken).toEqual([]);
  });

  it('never lists the same destination twice', () => {
    expect(new Set(manifestPaths).size).toBe(manifestPaths.length);
  });

  it('gives every destination help-panel coverage', () => {
    const undocumented = manifestPaths.filter((path) => !PAGE_HELP[path]);

    expect(undocumented).toEqual([]);
  });

  it('labels every destination with non-empty, unique text within its group', () => {
    for (const section of NAV_SECTIONS) {
      for (const group of section.groups) {
        const visible = group.items.filter((item) => !item.hidden);
        const labels = visible.map((item) => item.label);

        for (const label of labels) expect(label.trim()).not.toBe('');

        // Two identical labels side by side in a rail are unclickable noise.
        expect(new Set(labels).size, `${section.label} / ${group.label}`).toBe(labels.length);
      }
    }
  });

  it('only references permission keys the role model actually defines', () => {
    const known = new Set(Object.values(ROLE_PERMISSIONS).flat());
    const unknown = NAV_ITEMS.map((item) => item.permission).filter(
      (permission): permission is string => !!permission && !known.has(permission)
    );

    // A typo'd key grants nobody the item, silently hiding a whole section.
    expect([...new Set(unknown)]).toEqual([]);
  });

  it('keeps every section non-empty and uniquely identified', () => {
    const ids = NAV_SECTIONS.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const section of NAV_SECTIONS) {
      const items = section.groups.flatMap((group) => group.items);
      expect(items.length, section.label).toBeGreaterThan(0);
      expect(section.groups.every((group) => group.items.length > 0)).toBe(true);
    }
  });

  it('leaves an Admin-role user with every destination visible', () => {
    const granted = new Set(ROLE_PERMISSIONS.Admin);
    const withheld = NAV_ITEMS.filter((item) => item.permission && !granted.has(item.permission));

    expect(withheld.map((item) => item.path)).toEqual([]);
  });

  it('still shows a Viewer the read-only core of the product', () => {
    const granted = new Set(ROLE_PERMISSIONS.Viewer);
    const visible = NAV_ITEMS.filter(
      (item) => !item.permission || granted.has(item.permission)
    ).map((item) => item.path);

    for (const path of ['/dashboard', '/budgets', '/forecasts', '/reports', '/variance']) {
      expect(visible).toContain(path);
    }
    // …but never the administrative surfaces.
    expect(visible).not.toContain('/settings/users');
  });
});

describe('navigation active-state resolution', () => {
  it('matches a path and its descendants, not its string prefixes', () => {
    expect(isItemActive('/budgets', '/budgets')).toBe(true);
    expect(isItemActive('/budgets/create', '/budgets')).toBe(true);
    // "/budgets-archive" must not light up "/budgets".
    expect(isItemActive('/budgets-archive', '/budgets')).toBe(false);
  });

  it('resolves the most specific destination, not the first parent', () => {
    expect(findActiveItem('/reports/segment')?.path).toBe('/reports/segment');
    expect(findActiveItem('/data/gl-journals')?.path).toBe('/data/gl-journals');
    // An unmapped child still highlights its nearest mapped ancestor.
    expect(findActiveItem('/budgets/create/step-2')?.path).toBe('/budgets/create');
    expect(findActiveItem('/nonexistent-top-level')).toBeUndefined();
  });

  it('resolves the owning section so the sidebar can auto-expand', () => {
    expect(findActiveSectionId('/data/gl-journals')).toBe('accounting');
    expect(findActiveSectionId('/saas/arr')).toBe('industries');
    expect(findActiveSectionId('/settings/users')).toBe('admin');
    expect(findActiveSectionId('/nonexistent-top-level')).toBeUndefined();
  });

  it('resolves every in-shell route to a section', () => {
    const unresolved = inShellRoutes().filter((route) => !findActiveSectionId(route));

    expect(unresolved).toEqual([]);
  });
});
