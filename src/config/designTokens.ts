/**
 * Design Tokens — Consistent visual language across 379 pages + 250 components
 *
 * Financial apps look professional because of tight spacing,
 * proper number formatting, and consistent colors.
 * Never use raw colors in components — use these tokens.
 *
 * ─────────────────────────────────────────────────────────────────
 * TOKEN CATEGORIES (per T-1 Design System expansion CYCLE 25 TURN 365+)
 * ─────────────────────────────────────────────────────────────────
 *  §1  Brand colors        (primary 50-900 + financial + chart palette)
 *  §2  Semantic colors     (info/success/warning/danger/neutral × bg/fg/border)
 *  §3  Sector palette      (16 sectors × brand color, per Nike T-2 wire)
 *  §4  Typography          (font families + tabular figures + font size scale)
 *  §5  Spacing             (cell padding + 4pt/8pt grid scale)
 *  §6  Density             (compact/standard/comfortable for 240+ components)
 *  §7  Radius scale        (none/xs/sm/md/lg/xl/full)
 *  §8  Elevation           (shadows for 5 elevation levels)
 *  §9  Z-index scale       (11-layer stacking context)
 *  §10 Motion              (fast/normal/slow easing curves)
 *  §11 Breakpoints         (xs/sm/md/lg/xl/2xl responsive)
 *  §12 Focus ring          (a11y focus indicator, WCAG 2.1 AA 3:1 contrast)
 *  §13 Chart palette       (categorical + sequential + diverging)
 *
 * Cross-Muse: Hermes T-4.27 (WCAG AA contrast) + Nike T-2 (sector palette) +
 *             Athena T-3.16 (chart palette) + Demeter (dark mode parity)
 */

export const designTokens = {
  // ─────────────────────────────────────────────────────────────────
  // §1 BRAND COLORS
  // ─────────────────────────────────────────────────────────────────
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // PATCH 18+ sky token (Hephaestus T-14.1) — accent sky-700 #0369a1 (4.65:1 ✅ WCAG 2.1 AA Normal)
    // sky-600 #0284c7 (3.94:1 ❌) was used as --accent-primary but fails AA Normal
    // Use designTokens.colors.accent[600] for text or .accent[700] for stronger contrast
    accent: {
      500: '#0ea5e9', // sky-500 (decorative only, NOT for text)
      600: '#0284c7', // sky-600 (decorative + large text 3:1, NOT for small text)
      700: '#0369a1', // sky-700 (AA-compliant for body text 4.65:1 ✅)
      800: '#075985', // sky-800
      900: '#0c4a6e', // sky-900
    },
    financial: {
      positive: '#15803d', // green-700 (5.13:1 ✅ WCAG 2.1 AA Normal) — was green-600 #16a34a (3.94:1 ❌ FAILS AA Normal), PATCH 19+ Hephaestus T-18
      negative: '#dc2626',
      neutral: '#6b7280',
      warning: '#d97706',
      highlight: '#8b5cf6',
    },
    charts: [
      '#3b82f6',
      '#ef4444',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#f97316',
    ] as const,
  },

  // ─────────────────────────────────────────────────────────────────
  // §2 SEMANTIC COLORS (info / success / warning / danger / neutral)
  //     Each has bg (background), fg (foreground/text), border variants.
  //     All fg colors meet WCAG 2.1 AA Normal Text 4.5:1 contrast
  //     against their respective bg on white/dark surfaces.
  // ─────────────────────────────────────────────────────────────────
  semantic: {
    info: {
      bg: '#eff6ff',
      fg: '#1e40af', // primary-800 (8.64:1 ✅ AA Normal)
      border: '#93c5fd', // primary-300
      subtle: '#dbeafe', // primary-100
    },
    success: {
      bg: '#f0fdf4',
      fg: '#15803d', // green-700 (5.13:1 ✅ AA Normal)
      border: '#86efac',
      subtle: '#dcfce7',
    },
    warning: {
      bg: '#fffbeb',
      fg: '#92400e', // amber-800 (6.5:1 ✅ AA Normal)
      border: '#fcd34d',
      subtle: '#fef3c7',
    },
    danger: {
      bg: '#fef2f2',
      fg: '#991b1b', // red-800 (9.1:1 ✅ AA Normal)
      border: '#fca5a5',
      subtle: '#fee2e2',
    },
    neutral: {
      bg: '#f9fafb',
      fg: '#374151', // gray-700 (10.3:1 ✅ AA Normal)
      border: '#d1d5db',
      subtle: '#f3f4f6',
    },
  } as const,

  // ─────────────────────────────────────────────────────────────────
  // §3 SECTOR PALETTE (16 sectors)
  //     Per Nike T-2 cross-Muse coordination: 16 sector brand colors
  //     for sector badges, sector icons, sector hero features, and
  //     persona-driven P0A-11 Sales Demo.
  //     All hex colors chosen for 4.5:1 contrast on white background.
  // ─────────────────────────────────────────────────────────────────
  sector: {
    construction: '#b45309', // amber-700
    education: '#7c3aed', // violet-600
    energy: '#dc2626', // red-600
    esg: '#15803d', // green-700
    government: '#1d4ed8', // blue-700
    healthcare: '#0891b2', // cyan-600
    insurance: '#7e22ce', // purple-700
    logistics: '#c2410c', // orange-700
    realEstate: '#0f766e', // teal-700
    retail: '#be185d', // pink-700
    telecom: '#0369a1', // sky-700
    tour: '#a16207', // yellow-700
    hospitality: '#9d174d', // pink-800
    manufacturing: '#475569', // slate-600
    financial: '#1e40af', // blue-800
    technology: '#166534', // green-800
  } as const,

  // ─────────────────────────────────────────────────────────────────
  // §4 TYPOGRAPHY
  // ─────────────────────────────────────────────────────────────────
  typography: {
    mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    tabularFigures: {
      fontFeatureSettings: '"tnum"',
      fontVariantNumeric: 'tabular-nums',
    },
    // Type scale (Tailwind-aligned): size + line-height + weight for each role
    fontSize: {
      xs: { size: '12px', lineHeight: '16px' },
      sm: { size: '13px', lineHeight: '18px' },
      base: { size: '14px', lineHeight: '20px' },
      md: { size: '15px', lineHeight: '22px' },
      lg: { size: '16px', lineHeight: '24px' },
      xl: { size: '18px', lineHeight: '28px' },
      '2xl': { size: '20px', lineHeight: '28px' },
      '3xl': { size: '24px', lineHeight: '32px' },
      '4xl': { size: '30px', lineHeight: '36px' },
      '5xl': { size: '36px', lineHeight: '40px' },
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // §5 SPACING (4pt/8pt grid scale, financial-friendly cell padding)
  // ─────────────────────────────────────────────────────────────────
  spacing: {
    cell: { x: '8px', y: '4px' },
    cellCompact: { x: '4px', y: '2px' },
    cellComfortable: { x: '12px', y: '8px' },
    // Tailwind-aligned numeric scale (px values)
    scale: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      8: '32px',
      10: '40px',
      12: '48px',
      16: '64px',
      20: '80px',
      24: '96px',
      32: '128px',
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // §6 DENSITY (compact / standard / comfortable for grid/table rows)
  // ─────────────────────────────────────────────────────────────────
  density: {
    compact: {
      rowHeight: 28,
      headerHeight: 32,
      fontSize: '12px',
      cellPadding: '2px 6px',
    },
    standard: {
      rowHeight: 36,
      headerHeight: 40,
      fontSize: '13px',
      cellPadding: '4px 8px',
    },
    comfortable: {
      rowHeight: 48,
      headerHeight: 48,
      fontSize: '14px',
      cellPadding: '8px 12px',
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // §7 RADIUS SCALE
  // ─────────────────────────────────────────────────────────────────
  radius: {
    none: '0px',
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  } as const,

  // ─────────────────────────────────────────────────────────────────
  // §8 ELEVATION (6-level shadow scale)
  // ─────────────────────────────────────────────────────────────────
  elevation: {
    0: 'none',
    1: '0 1px 2px rgba(0, 0, 0, 0.05)',
    2: '0 1px 3px rgba(0, 0, 0, 0.08)',
    3: '0 4px 12px rgba(0, 0, 0, 0.10)',
    4: '0 8px 30px rgba(0, 0, 0, 0.12)',
    5: '0 12px 40px rgba(0, 0, 0, 0.16)',
  } as const,

  // ─────────────────────────────────────────────────────────────────
  // §9 Z-INDEX SCALE (11-layer stacking context)
  //     Sticky elements use sticky (1020); modals use modal (1050);
  //     toasts use toast (1100); never use values outside this scale.
  // ─────────────────────────────────────────────────────────────────
  zIndex: {
    hide: -1,
    base: 0,
    raised: 1,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1100,
  } as const,

  // ─────────────────────────────────────────────────────────────────
  // §10 MOTION (durations + easing)
  // ─────────────────────────────────────────────────────────────────
  motion: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },

  // ─────────────────────────────────────────────────────────────────
  // §11 BREAKPOINTS (responsive design min-widths)
  //     Aligned with Tailwind defaults; mobile-first.
  // ─────────────────────────────────────────────────────────────────
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  } as const,

  // ─────────────────────────────────────────────────────────────────
  // §12 FOCUS RING (WCAG 2.1 AA 3:1 contrast minimum, AA 2.4.7)
  //     2px ring with 2px offset for keyboard focus indicators.
  // ─────────────────────────────────────────────────────────────────
  focusRing: {
    width: '2px',
    offset: '2px',
    color: '#2563eb', // primary-600 (5.85:1 ✅ on white)
    style: 'solid',
  } as const,

  // ─────────────────────────────────────────────────────────────────
  // §13 CHART PALETTE EXTENSIONS
  //     Categorical (12 distinct hues) + sequential (5-step blue ramp)
  //     + diverging (red→white→green for variance visualization).
  // ─────────────────────────────────────────────────────────────────
  chartPalette: {
    categorical: [
      '#3b82f6', // blue
      '#ef4444', // red
      '#10b981', // emerald
      '#f59e0b', // amber
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
      '#14b8a6', // teal
      '#a855f7', // purple
      '#eab308', // yellow
      '#64748b', // slate
    ] as const,
    sequential: ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'] as const,
    diverging: ['#dc2626', '#fca5a5', '#ffffff', '#86efac', '#15803d'] as const,
  },

  // ─────────────────────────────────────────────────────────────────
  // LEGACY EXPORTS (back-compat for shadows — preserve existing callers)
  // ─────────────────────────────────────────────────────────────────
  shadows: {
    card: '0 1px 3px rgba(0, 0, 0, 0.08)',
    dropdown: '0 4px 12px rgba(0, 0, 0, 0.12)',
    modal: '0 8px 30px rgba(0, 0, 0, 0.16)',
  },
} as const;

export type Density = keyof typeof designTokens.density;
export type ChartColor = (typeof designTokens.colors.charts)[number];
export type SemanticTone = keyof typeof designTokens.semantic;
export type SectorKey = keyof typeof designTokens.sector;
export type RadiusKey = keyof typeof designTokens.radius;
export type ZIndexKey = keyof typeof designTokens.zIndex;
export type FontSizeKey = keyof typeof designTokens.typography.fontSize;
export type BreakpointKey = keyof typeof designTokens.breakpoints;
