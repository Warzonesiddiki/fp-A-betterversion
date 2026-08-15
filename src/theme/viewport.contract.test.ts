import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * UI-07 — the 1024×600 minimum is the width axis.
 *
 * The app is a desktop-only Tauri shell: a flex row of rail + work area that is
 * exactly `100vh` tall (`flex h-screen`) and scrolls the work area vertically.
 * That shell is what makes 600px of height reachable — every screen's content
 * lives inside the single `overflow-y-auto` <main>, so nothing can be trapped
 * off-screen vertically. (That mechanism is pinned by the render-level contract
 * in `src/components/layout/AppLayout.viewport-contract.test.tsx`.)
 *
 * The width axis is the one a class-string/DOM assertion cannot see, because
 * jsdom performs no layout: `scrollWidth` and `clientWidth` are both 0, so a
 * genuinely overflowing element is invisible to it. What CAN be caught at
 * source level is the unambiguous case: an element hardcoded wider than the
 * most generous content area the 1024 viewport can offer.
 *
 * Budget, with the rail collapsed to its compact 64px and `md` main padding
 * (24px per side) already spent:
 *
 *     1024 - 64 (compact rail) - 48 (main padding) = 912px
 *
 * Any fixed width ≥ 900px therefore overflows at the 1024 minimum even when
 * the user has done everything the shell allows. It is a horizontal-scroll
 * defect by construction, whatever container wraps it.
 *
 * Thresholds are 900px, and the rem/vw equivalents (16px root). Percentages and
 * `w-screen` are intentionally not flagged: they resolve relative to their
 * container and are not a hard overflow by themselves.
 *
 * Deliberately NOT covered (UI-04 / UI-05, not this slice): tables and grids
 * whose *content* is wide but which scroll internally inside an
 * `overflow-x-auto` wrapper. Those are density/table concerns and are swept
 * separately.
 */
describe('UI-07 — no hardcoded width overflows the 1024×600 minimum', () => {
  const MIN_PX = 900;

  function globSources(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) out.push(...globSources(full));
      else if (entry.name.endsWith('.tsx') && !/\.(test|spec)\.tsx$/.test(entry.name)) {
        out.push(full);
      }
    }
    return out;
  }

  // Tailwind arbitrary widths: w-[900px], min-w-[57rem], …
  const ARBITRARY_WIDTH = /\b(?:min-)?w-\[(\d+(?:\.\d+)?)(px|rem|vw)\]/g;

  // Inline style width/minWidth with a px value (React camelCase keys).
  const INLINE_WIDTH = /\b(?:minWidth|width):\s*['"]?(\d+(?:\.\d+)?)px['"]?/g;

  // A hand-authored stylesheet width/min-width declaration.
  const CSS_WIDTH = /(?:^|[^{}])(?:min-)?width:\s*(\d+(?:\.\d+)?)px\s*;?/gm;

  function px(amount: number, unit: string): number {
    if (unit === 'px') return amount;
    if (unit === 'rem') return amount * 16;
    // vw resolves against 1024, the minimum viewport width.
    return (amount / 100) * 1024;
  }

  const SOURCES = globSources(resolve(__dirname, '../'));
  const STYLESHEETS = [
    resolve(__dirname, '../index.css'),
    resolve(__dirname, '../styles/accessibility.css'),
    resolve(__dirname, '../styles/print.css'),
  ];

  it('audits a meaningful number of sources (a silent regex must not read as success)', () => {
    expect(SOURCES.length).toBeGreaterThan(400);
  });

  it('no Tailwind arbitrary width is wider than the 1024 content area', () => {
    const offenders = SOURCES.flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      return [...source.matchAll(ARBITRARY_WIDTH)]
        .filter((m) => px(Number(m[1]), m[2]!) >= MIN_PX)
        .map((m) => `${file.split('/src/')[1]}: ${m[0]}`);
    });
    expect(
      offenders,
      'a hardcoded w-[>=900px] overflows at 1024 even with the rail collapsed; ' +
        'make it responsive (grid/flex) or let it scroll inside overflow-x-auto'
    ).toEqual([]);
  });

  it('no inline style width is wider than the 1024 content area', () => {
    const offenders = SOURCES.flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      return [...source.matchAll(INLINE_WIDTH)]
        .filter((m) => Number(m[1]) >= MIN_PX)
        .map((m) => `${file.split('/src/')[1]}: ${m[0]}`);
    });
    expect(
      offenders,
      'an inline width: >=900px overflows at 1024; use a percentage or a responsive class'
    ).toEqual([]);
  });

  it('no stylesheet declaration is wider than the 1024 content area', () => {
    const offenders = STYLESHEETS.flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      return [...source.matchAll(CSS_WIDTH)]
        .filter((m) => Number(m[1]) >= MIN_PX)
        .map((m) => `${file.split('/src/')[1]}: ${m[0]}`);
    });
    expect(
      offenders,
      'a CSS width/min-width >=900px overflows at 1024; use min(100%, Npx) or a media query'
    ).toEqual([]);
  });
});
