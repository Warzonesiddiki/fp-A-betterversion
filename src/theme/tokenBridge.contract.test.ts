import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * UI-01 regression contract.
 *
 * Two silent defect classes were fixed in src/index.css and neither one could
 * fail a build, a lint or a test — which is exactly why both survived so long:
 *
 *   A. 248 shadcn semantic utilities (`bg-card`, `text-muted-foreground`,
 *      `ring-ring`, …) across 42 files compiled to ZERO CSS, because no
 *      `--color-*` theme keys were ever registered with Tailwind.
 *   B. 287 `var(--…)` references across 50 files pointed at custom properties
 *      that were never declared, so the whole declaration was invalid at
 *      computed-value time and silently dropped.
 *
 * These tests re-derive both facts from the real source files rather than
 * asserting on a snapshot, so they keep working as the codebase grows.
 */

const CSS = readFileSync('src/index.css', 'utf8');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(full)) out.push(full);
  }
  return out;
}

/**
 * Extract a top-level CSS block by its opening line.
 *
 * Anchored to the start of a line and to the trailing `{` on purpose: the
 * prose comments above these blocks mention `@theme inline` by name, and a
 * plain substring search matched the COMMENT instead of the real at-rule,
 * which made these assertions silently vacuous.
 */
function block(opener: string): string {
  const match = new RegExp(`^${opener.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`, 'm').exec(
    CSS
  );
  if (!match) return '';
  const start = match.index + match[0].length;
  return CSS.slice(start, CSS.indexOf('\n}', start));
}

describe('UI-01: Tailwind theme bridge', () => {
  it('registers the shadcn semantic colour keys the components rely on', () => {
    const theme = block('@theme inline');
    expect(theme).not.toBe('');

    // Every shadcn colour name actually used by components in this repo.
    for (const key of [
      'background',
      'foreground',
      'card',
      'card-foreground',
      'popover',
      'primary',
      'primary-foreground',
      'muted',
      'muted-foreground',
      'accent',
      'border',
      'ring',
    ]) {
      expect(theme, `--color-${key} must be registered`).toContain(`--color-${key}:`);
    }
  });

  it('uses `@theme inline` so utilities stay theme-reactive', () => {
    // A plain `@theme` block would resolve these to the dark-theme values at
    // build time and permanently break the light theme. `inline` keeps the
    // emitted utility as `var(--…)`, which re-resolves per .dark / .light.
    expect(block('@theme inline'), 'the @theme at-rule itself must be declared inline').not.toBe(
      ''
    );

    const theme = block('@theme inline');
    const literals = [...theme.matchAll(/--color-[a-z-]+:\s*([^;]+);/g)]
      .map((m) => m[1].trim())
      .filter((v) => !v.startsWith('var(') && v !== '#ffffff');
    expect(literals, 'theme keys should alias existing tokens, not new colours').toEqual([]);
  });
});

describe('UI-01: no dangling custom properties', () => {
  it('declares every custom property that source code reads', () => {
    const cssFiles = walk('src').filter((f) => f.endsWith('.css'));
    const declared = new Set<string>();
    for (const file of cssFiles) {
      for (const m of readFileSync(file, 'utf8').matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) {
        declared.add(m[1]);
      }
    }

    const offenders: string[] = [];
    for (const file of walk('src')) {
      if (file.includes('.test.')) continue;
      const source = readFileSync(file, 'utf8');
      // Properties the module sets on itself (inline style / <style> tag).
      const local = new Set([...source.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]));
      for (const m of source.matchAll(/var\((--[a-zA-Z0-9-]+)\s*(,)?/g)) {
        const [, name, hasFallback] = m;
        // A fallback (`var(--x, #fff)`) degrades gracefully, so it is fine.
        if (hasFallback || local.has(name) || name.startsWith('--tw-')) continue;
        if (!declared.has(name)) offenders.push(`${file}: var(${name})`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('declares --bg-muted outside the high-contrast block', () => {
    // Regression guard: --bg-muted (78 uses) was previously declared ONLY
    // inside [data-high-contrast='true'], so it resolved to nothing during
    // normal light/dark use and table zebra striping silently vanished.
    expect(block(':root')).toContain('--bg-muted:');
  });
});
