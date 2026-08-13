import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * UI-02 regression contract — light mode is the default and is WCAG AA clean.
 *
 * Three independent defects were fixed here, none of which could fail a build,
 * a lint or an existing test:
 *
 *   A. DEFAULT. The app hard-defaulted to dark. `src/store/uiStore.ts` seeded
 *      `theme: 'dark'` and the index.html bootstrap fell back to `'dark'`.
 *
 *   B. PERSISTENCE. The bootstrap read `localStorage['finplan-theme']`, but
 *      NOTHING ever wrote that key — the real preference is persisted inside
 *      the encrypted SQLite blob `finplan-sqljs-db`, which a synchronous
 *      inline script cannot read. So the read always returned null and a
 *      user's saved choice never survived a reload. ThemeContext now mirrors
 *      the preference into that key.
 *
 *   C. CONTRAST. Colour tokens declared only in `:root` (dark) leaked into
 *      light mode unchanged and failed WCAG 2.1 AA against a light canvas —
 *      `--text-muted` #94a3b8 at 2.56:1 and `--warning` #f59e0b at 2.15:1
 *      were the worst. The `.light` block now overrides each one.
 *
 * The contrast test below RE-COMPUTES the ratios from the CSS rather than
 * asserting on hardcoded hexes, so it keeps holding as the palette evolves.
 */

const CSS = readFileSync('src/index.css', 'utf8');
const INDEX_HTML = readFileSync('index.html', 'utf8');
const THEME_CONTEXT = readFileSync('src/context/ThemeContext.tsx', 'utf8');
const UI_STORE = readFileSync('src/store/uiStore.ts', 'utf8');

/** Extract a top-level CSS block, anchored to line start + trailing `{` so
 *  that prose comments naming the selector cannot be matched instead. */
function block(opener: string): string {
  const match = new RegExp(`^${opener.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`, 'm').exec(
    CSS
  );
  if (!match) return '';
  const start = match.index + match[0].length;
  return CSS.slice(start, CSS.indexOf('\n}', start));
}

/** Last declaration wins, mirroring the CSS cascade within a single block. */
function declarations(css: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of css.split('\n')) {
    const m = /^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/i.exec(line);
    if (m) out.set(m[1], m[2].trim());
  }
  return out;
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const light = () => declarations(block('.light'));

describe('UI-02: light mode is the default', () => {
  it('seeds the UI store with the light theme', () => {
    expect(UI_STORE).toMatch(/theme:\s*'light'/);
    expect(UI_STORE).not.toMatch(/theme:\s*'dark'/);
  });

  it('does not fall back to dark in the pre-paint bootstrap', () => {
    // The bootstrap must only opt IN to dark, never default to it.
    expect(INDEX_HTML).not.toMatch(/getItem\('finplan-theme'\)\s*\|\|\s*'dark'/);
    expect(INDEX_HTML).toMatch(/stored === 'dark'/);
  });

  it("honours an explicit 'system' preference against the OS setting", () => {
    expect(INDEX_HTML).toContain('prefers-color-scheme: dark');
  });
});

describe('UI-02: the theme preference actually survives a reload', () => {
  it('writes the bootstrap mirror key that index.html reads', () => {
    // Defect B: index.html read a key that nothing wrote, because the real
    // store is an encrypted SQLite blob unreadable from a sync script.
    expect(THEME_CONTEXT).toContain("'finplan-theme'");
    expect(THEME_CONTEXT).toMatch(/localStorage\.setItem\(\s*THEME_BOOTSTRAP_KEY/);
  });

  it('reads and writes the same key on both sides', () => {
    const readKey = /getItem\('([^']+)'\)/.exec(INDEX_HTML)?.[1];
    const writeKey = /const THEME_BOOTSTRAP_KEY = '([^']+)'/.exec(THEME_CONTEXT)?.[1];
    expect(readKey).toBeDefined();
    expect(writeKey).toBe(readKey);
  });
});

describe('UI-02: light-mode colour tokens meet WCAG 2.1 AA', () => {
  // Every surface a user can see text on in light mode.
  const surfaces = ['--bg-root', '--bg-surface', '--bg-elevated', '--bg-hover'] as const;

  // Tokens used as text or iconography, which therefore need 4.5:1.
  const foregrounds = [
    '--text-primary',
    '--text-secondary',
    '--text-muted',
    '--text-accent',
    '--accent-primary',
    '--negative',
    '--warning',
    '--info',
  ] as const;

  it('declares a light override for every contrast-sensitive token', () => {
    const decls = light();
    for (const token of [...surfaces, ...foregrounds]) {
      expect(decls.get(token), `${token} must be overridden in .light`).toMatch(
        /^#[0-9a-f]{3,6}$/i
      );
    }
  });

  it('renders every foreground at >= 4.5:1 on every light surface', () => {
    const decls = light();
    const failures: string[] = [];

    for (const surface of surfaces) {
      for (const fg of foregrounds) {
        const ratio = contrastRatio(decls.get(fg) as string, decls.get(surface) as string);
        if (ratio < 4.5) failures.push(`${fg} on ${surface} = ${ratio.toFixed(2)}:1`);
      }
    }

    expect(failures, `WCAG AA failures:\n  ${failures.join('\n  ')}`).toEqual([]);
  });

  it('keeps unfavorable variance on the mandated #DC2626 (AGENTS.md)', () => {
    expect(light().get('--negative')?.toLowerCase()).toBe('#dc2626');
  });

  it('retunes dark-canvas glass and shadows for a light background', () => {
    const decls = light();
    // The dark theme's shadows are black at 0.3–0.4 alpha, which smudges on
    // white. Light mode must use a slate tint at low alpha.
    for (const token of ['--shadow-sm', '--shadow-md', '--shadow-lg']) {
      expect(decls.get(token), `${token} must be re-tuned for light`).toContain('rgba(15, 23, 42');
    }
    expect(decls.get('--glass-bg')).toContain('rgba(255, 255, 255');
  });
});
