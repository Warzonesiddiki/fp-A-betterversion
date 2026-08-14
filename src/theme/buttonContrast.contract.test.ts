import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

/** All non-test .tsx sources under a directory, for repo-wide token audits. */
function globSources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...globSources(full));
    else if (entry.name.endsWith('.tsx') && !/\.(test|spec)\.tsx$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * UI-01 step 2/4 — the core primitives must be expressed in semantic tokens,
 * and those tokens must actually be legible in BOTH themes.
 *
 * Two distinct failure modes are pinned here, because each one shipped:
 *
 * 1. **A fill token is not a text token.** A colour used as *text* has to
 *    contrast with the page; the same colour used as a *fill behind white
 *    text* has to contrast with white. Those requirements pull in opposite
 *    directions. `.btn-primary` in index.css fills with `--accent-primary`
 *    and sets `color: white`, which in dark theme is #0284c7 under #ffffff —
 *    **4.10:1, below AA**. `.btn-danger` is worse at 3.67:1. The dedicated
 *    `--action-fill` / `--danger-fill` tokens exist to satisfy both sides,
 *    and this test is what keeps them honest.
 *
 * 2. **Translucent tokens must be composited before measuring.** In dark
 *    theme `--accent-subtle` is `rgba(2,132,199,0.15)`. Measuring the text
 *    against that raw value is meaningless; it has to be flattened over
 *    `--bg-surface` first. Skipping this step is how a badge can look
 *    checked-and-passing while being unreadable.
 *
 * The values are read out of `src/index.css` rather than restated here, so
 * the test fails when the stylesheet changes rather than when someone
 * remembers to update a fixture.
 */

const CSS = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

/** Extract a `:root { … }` / `.light { … }` declaration block by selector. */
function block(selector: string): string {
  const start = CSS.indexOf(`\n${selector} {`);
  if (start === -1) throw new Error(`selector ${selector} not found in index.css`);
  const open = CSS.indexOf('{', start);
  const end = CSS.indexOf('\n}', open);
  return CSS.slice(open, end);
}

const ROOT = block(':root');
const LIGHT = block('.light');

/**
 * Resolve a custom property within a theme block, following `var()` aliases
 * and falling back to :root the way the cascade does for a partial override.
 */
function token(name: string, scope: string): string {
  const read = (src: string): string | undefined => {
    const m = src.match(new RegExp(`--${name}:\\s*([^;]+);`));
    return m?.[1]?.trim();
  };
  const raw = read(scope) ?? read(ROOT);
  if (!raw) throw new Error(`token --${name} is not defined`);
  const alias = raw.match(/^var\(--([a-z0-9-]+)\)$/i);
  return alias ? token(alias[1]!, scope) : raw;
}

type RGB = [number, number, number];

function parseColor(value: string): { rgb: RGB; alpha: number } {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1]!;
    return {
      rgb: [
        parseInt(h.slice(0, 2), 16) / 255,
        parseInt(h.slice(2, 4), 16) / 255,
        parseInt(h.slice(4, 6), 16) / 255,
      ],
      alpha: 1,
    };
  }
  const rgba = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const parts = rgba[1]!.split(',').map((p) => parseFloat(p.trim()));
    return {
      rgb: [parts[0]! / 255, parts[1]! / 255, parts[2]! / 255],
      alpha: parts[3] ?? 1,
    };
  }
  throw new Error(`unsupported colour format: ${value}`);
}

/** Flatten a possibly-translucent colour over an opaque backdrop. */
function flatten(value: string, backdrop: RGB): RGB {
  const { rgb, alpha } = parseColor(value);
  return rgb.map((c, i) => alpha * c + (1 - alpha) * backdrop[i]!) as RGB;
}

function luminance(rgb: RGB): number {
  const [r, g, b] = rgb.map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  ) as RGB;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: RGB, b: RGB): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const AA_TEXT = 4.5;
/** WCAG 1.4.11 — a control's fill must be distinguishable from the page. */
const AA_NON_TEXT = 3.0;

const THEMES = [
  { name: 'dark', scope: ROOT },
  { name: 'light', scope: LIGHT },
] as const;

describe('UI-01 — filled action tokens are legible in both themes', () => {
  for (const { name, scope } of THEMES) {
    describe(name, () => {
      const page = () => flatten(token('bg-surface', scope), [1, 1, 1]);
      const onAccent = () => flatten(token('text-on-accent', scope), page());

      for (const fill of ['action-fill', 'action-fill-hover', 'danger-fill', 'danger-fill-hover']) {
        it(`--${fill} carries --text-on-accent at AA`, () => {
          const ratio = contrast(flatten(token(fill, scope), page()), onAccent());
          expect(
            ratio,
            `--${fill} (${token(fill, scope)}) under --text-on-accent in ${name}`
          ).toBeGreaterThanOrEqual(AA_TEXT);
        });

        it(`--${fill} separates from the page background`, () => {
          const ratio = contrast(flatten(token(fill, scope), page()), page());
          expect(
            ratio,
            `--${fill} (${token(fill, scope)}) against --bg-surface in ${name}`
          ).toBeGreaterThanOrEqual(AA_NON_TEXT);
        });
      }
    });
  }
});

describe('UI-01 — tinted badge fills pair with a legible text token', () => {
  const PAIRS = [
    ['accent-subtle', 'text-on-accent-subtle'],
    ['negative-subtle', 'text-on-danger-subtle'],
    ['positive-subtle', 'text-on-positive-subtle'],
  ] as const;

  for (const { name, scope } of THEMES) {
    for (const [fillToken, textToken] of PAIRS) {
      it(`${name}: --${textToken} on --${fillToken} meets AA`, () => {
        const page = flatten(token('bg-surface', scope), [1, 1, 1]);
        // The -subtle fills are translucent in dark theme; composite first.
        const fill = flatten(token(fillToken, scope), page);
        const text = flatten(token(textToken, scope), fill);
        expect(
          contrast(text, fill),
          `--${textToken} (${token(textToken, scope)}) on --${fillToken} (${token(fillToken, scope)}) in ${name}`
        ).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }
});

describe('UI-01 — the migrated primitives use no raw palette utilities', () => {
  // Scoped to the primitives actually converted in this step. Widening this
  // list is the intended way to ratchet the rest of src/components/ui over.
  const MIGRATED = ['Button', 'Card', 'Input', 'Badge', 'Select', 'Alert'];

  const RAW_PALETTE =
    /\b(?:bg|text|border|ring|from|via|to|placeholder|divide|outline|shadow|accent|caret|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/;

  /** Comment lines describe the rule; only real code should be matched. */
  const isComment = (line: string) => /^\s*(\/\/|\/\*|\*)/.test(line);

  for (const component of MIGRATED) {
    const source = readFileSync(resolve(__dirname, `../components/ui/${component}.tsx`), 'utf8');

    it(`${component}.tsx has no numbered palette utility`, () => {
      const offenders = source
        .split('\n')
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => RAW_PALETTE.test(line) && !isComment(line));
      expect(
        offenders.map((o) => `${component}.tsx:${o.n} ${o.line.trim()}`),
        'use a semantic token from index.css instead'
      ).toEqual([]);
    });

    it(`${component}.tsx declares no dark: variant`, () => {
      // Every semantic token already flips in `.light`. A `dark:` variant here
      // is a second source of truth that drifts from the stylesheet.
      const offenders = source
        .split('\n')
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => /\bdark:/.test(line) && !isComment(line));
      expect(offenders.map((o) => `${component}.tsx:${o.n} ${o.line.trim()}`)).toEqual([]);
    });
  }
});

/**
 * UI-07 — a token used as *text* must clear AA against the surfaces it is
 * actually painted on.
 *
 * This is the mirror image of the fill/text split pinned above. `--accent-primary`,
 * `--positive` and `--info` are tuned as fills and as light-theme text; on the
 * dark surfaces they measured 4.42:1, 3.61:1 and 4.05:1 as normal-size text —
 * all below AA, all shipping in real components (18 `text-[var(--accent-primary)]`
 * sites alone). The `--text-*` companions exist so a glyph can name the text role
 * and stay legible in both themes.
 *
 * Dark theme stacks surfaces, so a token is measured against the *worst* one it
 * can legitimately land on rather than only `--bg-surface`; `--bg-hover` is the
 * floor because a row can be hovered while its text is showing.
 */
describe('UI-07 — text tokens clear AA on every surface they render on', () => {
  // The full text ramp, not just the accent hues: --text-muted shipped at
  // 4.17:1 on --bg-elevated and 3.60:1 on --bg-hover while passing on the
  // page background, which is exactly the case measuring only one surface
  // misses. It is also the most-used text token in the app.
  const TEXT_TOKENS = [
    'text-accent',
    'text-positive',
    'text-info',
    'text-primary',
    'text-secondary',
    'text-muted',
    'text-tertiary',
    'text-negative',
  ] as const;
  // Ordered lightest-backdrop-last; each is a real page/panel/row background.
  const SURFACES = ['bg-root', 'bg-surface', 'bg-elevated', 'bg-hover'] as const;

  for (const { name, scope } of THEMES) {
    for (const textToken of TEXT_TOKENS) {
      for (const surfaceToken of SURFACES) {
        it(`${name}: --${textToken} on --${surfaceToken} meets AA`, () => {
          const page = flatten(token('bg-surface', scope), [1, 1, 1]);
          const surface = flatten(token(surfaceToken, scope), page);
          const text = flatten(token(textToken, scope), surface);
          expect(
            contrast(text, surface),
            `--${textToken} (${token(textToken, scope)}) on --${surfaceToken} (${token(surfaceToken, scope)}) in ${name}`
          ).toBeGreaterThanOrEqual(AA_TEXT);
        });
      }
    }
  }
});

describe('UI-07 — the text ramp stays visually ordered', () => {
  /**
   * Raising a token to pass contrast is easy; the trap is raising it until it
   * is indistinguishable from the step above, which fixes a measurement and
   * breaks the design. --text-muted was lightened to clear AA on --bg-hover
   * and deliberately not lightened further, leaving 1.38:1 against
   * --text-secondary. These bounds fail in both directions.
   */
  const STEPS = [
    ['text-muted', 'text-secondary'],
    ['text-secondary', 'text-primary'],
  ] as const;

  for (const { name, scope } of THEMES) {
    for (const [dimmer, brighter] of STEPS) {
      it(`${name}: --${dimmer} stays distinguishable from --${brighter}`, () => {
        const page = flatten(token('bg-surface', scope), [1, 1, 1]);
        const a = flatten(token(dimmer, scope), page);
        const b = flatten(token(brighter, scope), page);
        // Ordered: the "dimmer" step must actually be dimmer against the page.
        expect(
          contrast(a, page),
          `--${dimmer} should sit below --${brighter} in ${name}`
        ).toBeLessThan(contrast(b, page));
        // Separated: a visible step, not two shades of the same grey.
        expect(
          contrast(a, b),
          `--${dimmer} (${token(dimmer, scope)}) vs --${brighter} (${token(brighter, scope)}) in ${name}`
        ).toBeGreaterThanOrEqual(1.2);
      });
    }
  }
});

describe('UI-07 — fill-tuned hues are not used as text in components', () => {
  // The three hues that fail AA as dark-theme text. Each has a --text-* twin.
  const FILL_ONLY = [
    'accent-primary',
    'accent-secondary',
    'positive',
    'info',
    'color-success',
    // --negative is dual-role: 4.34:1 / 3.75:1 as dark text on the two darkest
    // surfaces, and 3.67:1 as a fill under white (the Navbar badge shipped that
    // way). --text-negative is the text twin; --danger-fill is the fill.
    'negative',
    'color-error',
  ];

  const SOURCES = globSources(resolve(__dirname, '../'));

  for (const hue of FILL_ONLY) {
    it(`no component paints text with --${hue}`, () => {
      // Matches the Tailwind arbitrary-value form and the inline style form.
      const utility = new RegExp(`text-\\[var\\(--${hue}\\)\\]`);
      const inline = new RegExp(`color:\\s*'var\\(--${hue}\\)'`);
      const offenders: string[] = [];
      for (const file of SOURCES) {
        const src = readFileSync(file, 'utf8');
        src.split('\n').forEach((line, i) => {
          if (utility.test(line) || inline.test(line)) {
            offenders.push(`${file.replace(/.*\/src\//, 'src/')}:${i + 1} ${line.trim()}`);
          }
        });
      }
      expect(offenders, `use --text-accent / --text-positive / --text-info instead`).toEqual([]);
    });
  }
});

/**
 * UI-08 — the inverse of the ratchet above.
 *
 * The existing rule bans fill-tuned hues from being painted as *text*. This one
 * catches the mirror-image mistake, which is the one that actually shipped:
 * `Navbar.tsx` filled the notification badge with `--negative` and set white
 * text on it, i.e. 3.67:1. Brightening `--negative` to fix it as text would have
 * pushed white-on-it to 2.69:1, which is why the two roles are separate tokens.
 *
 * Scoped to the text-tuned hues, since those are the ones whose luminance was
 * chosen to sit against a dark page rather than under white.
 */
describe('UI-08 — text-tuned hues are not used as fills behind light text', () => {
  // Every hue that does NOT clear 4.5:1 under white, so it must never become a
  // fill behind light text. --negative is here because that is precisely what
  // shipped in Navbar.tsx; the --text-* twins are here because they are even
  // lighter and would fail harder.
  const TEXT_ONLY = [
    'negative',
    'color-error',
    'text-negative',
    'text-positive',
    'text-info',
    'text-accent',
  ];

  const SOURCES = globSources(resolve(__dirname, '../'));

  for (const hue of TEXT_ONLY) {
    it(`no component fills with --${hue}`, () => {
      // `bg-[var(--x)]/10` is a translucent tint, not a solid fill under light
      // text — a different (and much weaker) contrast requirement. Only an
      // opaque fill is banned here; the `(?!/)` is what keeps the two apart.
      const utility = new RegExp(`bg-\\[var\\(--${hue}\\)\\](?!/)`);
      const inline = new RegExp(`background(?:Color)?:\\s*'var\\(--${hue}\\)'`);
      const offenders: string[] = [];
      for (const file of SOURCES) {
        const src = readFileSync(file, 'utf8');
        src.split('\n').forEach((line, i) => {
          if (utility.test(line) || inline.test(line)) {
            offenders.push(`${file.replace(/.*\/src\//, 'src/')}:${i + 1} ${line.trim()}`);
          }
        });
      }
      expect(offenders, 'use --danger-fill / --action-fill for fills').toEqual([]);
    });
  }

  // The token pair only helps if the fill twin is genuinely fill-safe.
  for (const { name, scope } of THEMES) {
    it(`${name}: --danger-fill carries white text where --negative does not`, () => {
      const page = flatten(token('bg-surface', scope), [1, 1, 1]);
      const white: [number, number, number] = [1, 1, 1];
      const fill = flatten(token('danger-fill', scope), page);
      expect(
        contrast(fill, white),
        `--danger-fill (${token('danger-fill', scope)}) under white in ${name}`
      ).toBeGreaterThanOrEqual(AA_TEXT);
    });
  }
});

/**
 * UI-08 — the tinted-fill blind spot.
 *
 * `bg-[var(--x)]/10 text-[var(--y)]` is exempt from the fill ratchet above: a
 * 10% tint is not a solid fill, so white-on-fill never applies. But the pairing
 * still renders text on a background, and that composite was measured by
 * nothing. `VarianceCommentaryPanel.tsx` paired --text-negative with a
 * --color-error/10 tint and shipped at 4.14:1 in light theme.
 *
 * Rather than enumerate known pairings (which is how the last one was missed),
 * this discovers every tint pairing in the repo and measures it.
 */
describe('UI-08 — tinted fills stay legible under their paired text token', () => {
  const PAIR = /bg-\[var\(--([a-z0-9-]+)\)\]\/(\d+)\s+text-\[var\(--([a-z0-9-]+)\)\]/g;

  const found = globSources(resolve(__dirname, '../')).flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    return [...source.matchAll(PAIR)].map((m) => ({
      file: file.split('/src/')[1]!,
      fill: m[1]!,
      alpha: Number(m[2]!) / 100,
      text: m[3]!,
    }));
  });

  it('finds tint pairings to audit (guards against a regex that matches nothing)', () => {
    expect(found.length).toBeGreaterThan(0);
  });

  for (const { name, scope } of THEMES) {
    for (const { file, fill, alpha, text } of found) {
      it(`${name}: --${text} on --${fill}/${alpha * 100} (${file})`, () => {
        // Tailwind's `/NN` applies alpha to the token, then composites it over
        // whatever is behind — here the page surface.
        const page = flatten(token('bg-surface', scope), [1, 1, 1]);
        const { rgb } = parseColor(token(fill, scope));
        const tinted = rgb.map((c, i) => c * alpha + page[i]! * (1 - alpha)) as RGB;
        const fg = flatten(token(text, scope), tinted);
        expect(
          contrast(fg, tinted),
          `--${text} (${token(text, scope)}) on --${fill}/${alpha * 100} in ${name}`
        ).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }
});

/**
 * UI-07 — empty states must theme.
 *
 * 42 pages rendered their empty-state icon inside a `p-4 bg-slate-800
 * rounded-full` circle. A hardcoded slate is not a theme token: in dark mode it
 * reads as the intended subtle disc (1.24:1 against the page), but in light mode
 * the same class paints a near-black blob on white at 14.63:1. The empty state is
 * the *first* thing a new user sees on a report route, so it was also the most
 * visible surface still ignoring the theme.
 *
 * These pages sit outside `MIGRATED`, so the UI-01 palette lint does not cover
 * them. This ratchet is narrower than that lint on purpose: it bans the specific
 * hardcoded-surface idiom in empty states rather than all raw palette use, which
 * is still widespread here and is a separate migration.
 */
describe('UI-07 — empty-state surfaces use theme tokens, not hardcoded palette', () => {
  const PAGES = globSources(resolve(__dirname, '../pages'));

  // A filled circle behind an empty-state glyph. `bg-<palette>-<shade>` here is
  // always a themed-surface bug: the disc has to track the page background.
  const HARDCODED_DISC = /\bp-\d+ bg-(?:slate|gray|zinc|neutral|stone)-\d{2,3} rounded-full\b/;

  it('audits a meaningful number of page sources', () => {
    expect(PAGES.length).toBeGreaterThan(50);
  });

  it('no page paints an empty-state disc with a hardcoded palette surface', () => {
    const offenders = PAGES.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, i) => ({ line: line.trim(), n: i + 1 }))
        .filter(({ line }) => HARDCODED_DISC.test(line))
        .map(({ line, n }) => `${file.split('/src/')[1]}:${n} ${line}`)
    );

    expect(offenders, 'use bg-[var(--bg-elevated)] so the disc tracks the theme').toEqual([]);
  });

  /**
   * The disc idiom is only half the fix: the glyph inside it must clear WCAG
   * 1.4.11 (3:1, non-text) against the new surface in BOTH themes. Three pages
   * paired a `text-red-400` glyph with the disc, which sat at 2.64:1 on the
   * light-theme surface once the disc started theming correctly.
   */
  for (const { name, scope } of THEMES) {
    it(`${name}: --text-muted glyph clears 1.4.11 on --bg-elevated`, () => {
      const surface = flatten(token('bg-elevated', scope), [1, 1, 1]);
      const glyph = flatten(token('text-muted', scope), surface);
      expect(
        contrast(glyph, surface),
        `--text-muted (${token('text-muted', scope)}) on --bg-elevated in ${name}`
      ).toBeGreaterThanOrEqual(AA_NON_TEXT);
    });

    it(`${name}: --text-negative glyph clears 1.4.11 on --bg-elevated`, () => {
      const surface = flatten(token('bg-elevated', scope), [1, 1, 1]);
      const glyph = flatten(token('text-negative', scope), surface);
      expect(
        contrast(glyph, surface),
        `--text-negative (${token('text-negative', scope)}) on --bg-elevated in ${name}`
      ).toBeGreaterThanOrEqual(AA_NON_TEXT);
    });
  }
});
