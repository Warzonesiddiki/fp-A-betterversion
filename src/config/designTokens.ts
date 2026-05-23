/**
 * Design Tokens — Consistent visual language across 140+ pages
 *
 * Financial apps look professional because of tight spacing,
 * proper number formatting, and consistent colors.
 * Never use raw colors in components — use these tokens.
 */

export const designTokens = {
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
    financial: {
      positive: '#16a34a',
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

  typography: {
    mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    tabularFigures: {
      fontFeatureSettings: '"tnum"',
      fontVariantNumeric: 'tabular-nums',
    },
  },

  spacing: {
    cell: { x: '8px', y: '4px' },
    cellCompact: { x: '4px', y: '2px' },
    cellComfortable: { x: '12px', y: '8px' },
  },

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

  motion: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
  },

  shadows: {
    card: '0 1px 3px rgba(0, 0, 0, 0.08)',
    dropdown: '0 4px 12px rgba(0, 0, 0, 0.12)',
    modal: '0 8px 30px rgba(0, 0, 0, 0.16)',
  },
} as const;

export type Density = keyof typeof designTokens.density;
export type ChartColor = (typeof designTokens.colors.charts)[number];
